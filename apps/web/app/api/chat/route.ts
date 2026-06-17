import { NextResponse } from "next/server";
import { z } from "zod";
import { queryMemoryAndKB, wrapForPrompt, type RetrievedChunk } from "@/lib/qmd";
import { deriveScope } from "@/lib/marker-scope";
import {
  chat,
  SOCRATIC_SYSTEM_PROMPT,
  EDU_GUIDE_RULE,
  type ChatMessage,
} from "@/lib/llm";
import { checkResponse, rewriteSocratic } from "@/lib/guardrail";
import { logAuditEventSafe } from "@/lib/audit";
import { UnauthorizedError } from "@/lib/session";
import {
  requireSubscribedUserIdFromRequest,
  SubscriptionRequiredError,
} from "@/lib/subscription-access";
import { LOCALES, localize } from "@/lib/i18n";
import {
  canRecoverMissingCitation,
  hasVisibleAssistantText,
  prepareAssistantText,
} from "@/lib/assistant-text";
import { responseTokenBudget } from "@/lib/conversation-policy";
import { resolveRetrievalQuery } from "@/lib/query-rewrite";
import { detectCrisis, crisisResourcesText } from "@/lib/crisis";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs"; // @tobilu/qmd y better-sqlite3 son nativos

const Body = z.object({
  message: z.string().min(1).max(4000),
  locale: z.enum(LOCALES).default("de"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .default([]),
});

/**
 * Endpoint del asistente reflexivo.
 *
 * Requiere sesión válida (cookie BetterAuth). userId proviene de la
 * sesión, no de query string.
 */
export async function POST(req: Request) {
  const startedAt = Date.now();
  const deadline = AbortSignal.any([
    req.signal,
    AbortSignal.timeout(300_000),
  ]);
  let userId: string;
  try {
    userId = await requireSubscribedUserIdFromRequest(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof SubscriptionRequiredError) {
      return NextResponse.json(
        { error: "subscription_required", billingUrl: "/settings/billing" },
        { status: 402 },
      );
    }
    throw err;
  }

  // -- Rate limit ----------------------------------------------------------
  // Cada respuesta consume varias pasadas de LLM en CPU: limitar por
  // usuario evita que una sesión sature el servicio para el resto.
  const rate = checkRateLimit(`chat:${userId}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  // -- Validación ---------------------------------------------------------
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    // No devolver el error crudo: puede contener internals. Al log sí.
    console.error("[chat] invalid_body", err);
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // -- Clasificador de crisis ----------------------------------------------
  // Antes de cualquier generación (ROADMAP, criterios C-SSRS simplificados).
  // Si detecta riesgo, no se activa el flujo normal: aviso fijo con
  // recursos + audit log sin contenido. Fail-open ante errores de infra
  // (ver lib/crisis.ts).
  const crisisStartedAt = Date.now();
  const crisisDecision = await detectCrisis(body.message, body.history);
  console.info("[chat] crisis check complete", {
    durationMs: Date.now() - crisisStartedAt,
    crisis: crisisDecision.crisis,
    classifierError: crisisDecision.classifierError,
  });
  if (crisisDecision.crisis) {
    await logAuditEventSafe({
      actor: userId,
      action: "safety.crisis_detected",
      subjectId: userId,
      // Sin contenido de la conversación, por diseño (ROADMAP).
      payloadSum: "crisis_notice_shown",
    });
    return NextResponse.json({
      text: crisisResourcesText(body.locale),
      citations: [],
      guardrail: { verdict: "block", flags: [] },
      crisis: true,
    });
  }

  // -- Retrieval dual -----------------------------------------------------
  let personal: RetrievedChunk[] = [];
  let evidence: RetrievedChunk[] = [];
  const retrievalStartedAt = Date.now();
  console.info("[chat] retrieval started");
  try {
    // Condense question con LLM; fallback automático a la heurística de
    // conversation-policy si la pasada falla (ver lib/query-rewrite.ts).
    const { query: retrievalQuery, method: queryMethod } =
      await resolveRetrievalQuery(body.message, body.history, body.locale);
    // Scope por marcador: el mensaje actual manda; si no aporta tema, se mira
    // una ventana corta de mensajes previos del USUARIO (no del asistente).
    // La memoria personal no entra aquí (ver lib/marker-scope.ts `deriveScope`).
    const priorUserMessages = body.history
      .filter((m) => m.role === "user")
      .map((m) => m.content);
    const scope = deriveScope(body.message, priorUserMessages);
    const result = await queryMemoryAndKB(userId, retrievalQuery, {
      limit: 3,
      minScore: 0.35,
      locale: body.locale,
      markers: [...scope.markers],
      lens: [...scope.lens],
      healthAreas: [...scope.healthAreas],
    });
    personal = result.personal;
    evidence = result.evidence;
    console.info("[chat] retrieval complete", {
      durationMs: Date.now() - retrievalStartedAt,
      queryMethod,
      personalCount: personal.length,
      evidenceCount: evidence.length,
    });
    // Diagnóstico opcional: contenido de usuario (query) y títulos de
    // chunks en logs SOLO con RETRIEVAL_DEBUG=true. Apagado por defecto
    // para no verter datos de salud en los logs de docker.
    if (process.env.RETRIEVAL_DEBUG === "true") {
      console.info("[chat] retrieval debug", {
        query: retrievalQuery.slice(0, 300),
        personal: personal.map((c) => ({
          title: c.title.slice(0, 80),
          score: Number(c.score.toFixed(3)),
        })),
        evidence: evidence.map((c) => ({
          title: c.title.slice(0, 80),
          score: Number(c.score.toFixed(3)),
          sourceLanguage: c.sourceLanguage,
          sourceJurisdiction: c.sourceJurisdiction,
        })),
      });
    }
  } catch (err) {
    // Detalle solo al log del servidor: String(err) puede exponer rutas
    // del filesystem o internals de QMD al cliente.
    console.error("[chat] retrieval_failed", err);
    return NextResponse.json({ error: "retrieval_failed" }, { status: 500 });
  }

  // -- Construcción del prompt -------------------------------------------
  const contextBlock = [
    personal.length > 0 ? wrapForPrompt(personal) : "",
    evidence.length > 0 ? wrapForPrompt(evidence) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userContent = contextBlock
    ? `${contextBlock}\n\n---\n\n${
        body.locale === "de" ? "Frage des Benutzers" : "Pregunta del usuario"
      }:\n${body.message}`
    : body.message;

  const languageInstruction =
    body.locale === "de"
      ? "Antworte auf Deutsch, auch wenn einzelne Quellen in einer anderen Sprache vorliegen. Wenn relevante deutsche oder europäische Quellen im Kontext vorhanden sind, bevorzuge sie in der Erklärung; wenn eine wichtige Quelle auf Englisch ist, behandle das transparent."
      : "Responde en español, aunque alguna fuente esté en otro idioma.";

  // Regla educativa opcional: desactivable por configuración para poder
  // apagar esta función interpretativa antes del piloto real (GUIA-OPERATIVA B-1).
  const eduGuide =
    process.env.ASSISTANT_EDU_GUIDE === "true" ? EDU_GUIDE_RULE : "";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${SOCRATIC_SYSTEM_PROMPT}${eduGuide}\n\n${languageInstruction}`,
    },
    ...body.history,
    { role: "user", content: userContent },
  ];

  // -- Llamada al LLM principal ------------------------------------------
  let draft: string;
  const generationStartedAt = Date.now();
  console.info("[chat] generation started");
  try {
    draft = await chat({
      messages,
      temperature: 0.4,
      maxTokens: responseTokenBudget(body.message),
      signal: deadline,
    });
    console.info("[chat] generation complete", {
      durationMs: Date.now() - generationStartedAt,
    });
  } catch (err) {
    console.error("[chat] llm_failed", err);
    return NextResponse.json({ error: "llm_failed" }, { status: 502 });
  }

  // -- Guardrail ----------------------------------------------------------
  let finalText = draft;
  let verdict: "safe" | "rewrite" | "block" = "safe";
  let flags: string[] = [];
  const guardrailStartedAt = Date.now();
  console.info("[chat] guardrail started");
  try {
    const decision = await checkResponse(draft, contextBlock, deadline);
    verdict = decision.verdict;
    flags = decision.flags;
    if (decision.verdict === "rewrite") {
      const rewritten = prepareAssistantText(
        await rewriteSocratic(draft, body.locale, contextBlock, deadline),
      );
      if (hasVisibleAssistantText(rewritten)) {
        finalText = rewritten;
      } else if (
        canRecoverMissingCitation(
          decision.flags,
          decision.reliable,
          personal.length + evidence.length > 0,
        )
      ) {
        finalText = localize(body.locale, {
          es: `Según la fuente consultada:\n\n${prepareAssistantText(draft)}`,
          de: `Laut der herangezogenen Quelle:\n\n${prepareAssistantText(draft)}`,
        });
      } else {
        verdict = "block";
        finalText = localize(body.locale, {
          es: "La revisión de seguridad no pudo producir una respuesta completa. No mostramos el borrador sin revisar.",
          de: "Die Sicherheitsprüfung konnte keine vollständige Antwort erzeugen. Der ungeprüfte Entwurf wird nicht angezeigt.",
        });
      }
    } else if (decision.verdict === "block") {
      finalText = localize(body.locale, {
        es: "No puedo ofrecer una respuesta segura para esta consulta. Te sugiero hablarlo con un profesional sanitario.",
        de: "Ich kann auf diese Anfrage keine sichere Antwort geben. Bitte besprich sie mit medizinischem Fachpersonal.",
      });
    }
  } catch {
    // Si el guardrail falla, fail-closed: bloquear con mensaje neutro.
    verdict = "block";
    finalText = localize(body.locale, {
      es: "Se ha producido un problema verificando la respuesta. Por seguridad no la mostramos. Inténtalo de nuevo en unos segundos.",
      de: "Bei der Sicherheitsprüfung der Antwort ist ein Fehler aufgetreten. Die Antwort wird deshalb nicht angezeigt. Bitte versuche es in einigen Sekunden erneut.",
    });
  }
  console.info("[chat] guardrail complete", {
    durationMs: Date.now() - guardrailStartedAt,
    totalDurationMs: Date.now() - startedAt,
    verdict,
    flags,
  });

  finalText = prepareAssistantText(finalText);
  if (!hasVisibleAssistantText(finalText)) {
    verdict = "block";
    flags = [...new Set([...flags, "missing_evidence_tag"])];
    finalText = localize(body.locale, {
      es: "La respuesta generada no contenía texto visible. No mostramos una respuesta incompleta; inténtalo de nuevo.",
      de: "Die erzeugte Antwort enthielt keinen sichtbaren Text. Eine unvollständige Antwort wird nicht angezeigt; bitte versuche es erneut.",
    });
  }

  // -- Citas devueltas al cliente ----------------------------------------
  const citations = [...personal, ...evidence].map((c) => ({
    source: c.source,
    title: c.title,
    path: c.path,
    score: c.score,
    sourceKind: c.sourceKind,
    sourceDocumentType: c.sourceDocumentType,
    sourceUrl: c.sourceUrl,
    sourceLanguage: c.sourceLanguage,
    sourceJurisdiction: c.sourceJurisdiction,
    observedAt: c.observedAt,
  }));

  await logAuditEventSafe({
    actor: userId,
    action: "chat.query",
    subjectId: userId,
    payloadSum: `personal=${personal.length} evidence=${evidence.length} verdict=${verdict}`,
  });

  return NextResponse.json({
    text: finalText,
    citations,
    guardrail: { verdict, flags },
  });
}
