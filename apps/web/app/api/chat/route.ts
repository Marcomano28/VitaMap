import { NextResponse } from "next/server";
import { z } from "zod";
import { queryMemoryAndKB, wrapForPrompt, type RetrievedChunk } from "@/lib/qmd";
import { chat, SOCRATIC_SYSTEM_PROMPT, type ChatMessage } from "@/lib/llm";
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

  // -- Validación ---------------------------------------------------------
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", detail: String(err) },
      { status: 400 },
    );
  }

  // -- Retrieval dual -----------------------------------------------------
  let personal: RetrievedChunk[] = [];
  let evidence: RetrievedChunk[] = [];
  const retrievalStartedAt = Date.now();
  console.info("[chat] retrieval started");
  try {
    const result = await queryMemoryAndKB(userId, body.message, {
      limit: 3,
      minScore: 0.35,
    });
    personal = result.personal;
    evidence = result.evidence;
    console.info("[chat] retrieval complete", {
      durationMs: Date.now() - retrievalStartedAt,
      personalCount: personal.length,
      evidenceCount: evidence.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "retrieval_failed", detail: String(err) },
      { status: 500 },
    );
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
      ? "Antworte auf Deutsch, auch wenn einzelne Quellen in einer anderen Sprache vorliegen."
      : "Responde en español, aunque alguna fuente esté en otro idioma.";

  const messages: ChatMessage[] = [
    { role: "system", content: `${SOCRATIC_SYSTEM_PROMPT}\n\n${languageInstruction}` },
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
      maxTokens: 512,
      signal: deadline,
    });
    console.info("[chat] generation complete", {
      durationMs: Date.now() - generationStartedAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "llm_failed", detail: String(err) },
      { status: 502 },
    );
  }

  // -- Guardrail ----------------------------------------------------------
  let finalText = draft;
  let verdict: "safe" | "rewrite" | "block" = "safe";
  let flags: string[] = [];
  const guardrailStartedAt = Date.now();
  console.info("[chat] guardrail started");
  try {
    const decision = await checkResponse(draft, deadline);
    verdict = decision.verdict;
    flags = decision.flags;
    if (decision.verdict === "rewrite") {
      const rewritten = prepareAssistantText(
        await rewriteSocratic(draft, body.locale, deadline),
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
