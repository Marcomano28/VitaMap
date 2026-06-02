import { NextResponse } from "next/server";
import { z } from "zod";
import { queryMemoryAndKB, wrapForPrompt, type RetrievedChunk } from "@/lib/qmd";
import { chat, SOCRATIC_SYSTEM_PROMPT, type ChatMessage } from "@/lib/llm";
import { checkResponse, rewriteSocratic } from "@/lib/guardrail";
import { logAuditEventSafe } from "@/lib/audit";
import { requireUserIdFromRequest, UnauthorizedError } from "@/lib/session";

export const runtime = "nodejs"; // @tobilu/qmd y better-sqlite3 son nativos

const Body = z.object({
  message: z.string().min(1).max(4000),
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
  let userId: string;
  try {
    userId = await requireUserIdFromRequest(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  try {
    const result = await queryMemoryAndKB(userId, body.message, {
      limit: 5,
      minScore: 0.3,
    });
    personal = result.personal;
    evidence = result.evidence;
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
    ? `${contextBlock}\n\n---\n\nPregunta del usuario:\n${body.message}`
    : body.message;

  const messages: ChatMessage[] = [
    { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
    ...body.history,
    { role: "user", content: userContent },
  ];

  // -- Llamada al LLM principal ------------------------------------------
  let draft: string;
  try {
    draft = await chat({ messages, temperature: 0.4, maxTokens: 1024 });
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
  try {
    const decision = await checkResponse(draft);
    verdict = decision.verdict;
    flags = decision.flags;
    if (decision.verdict === "rewrite") {
      finalText = await rewriteSocratic(draft);
    } else if (decision.verdict === "block") {
      finalText =
        "No puedo ofrecer una respuesta segura para esta consulta. Te sugiero hablarlo con un profesional sanitario.";
    }
  } catch {
    // Si el guardrail falla, fail-closed: bloquear con mensaje neutro.
    verdict = "block";
    finalText =
      "Se ha producido un problema verificando la respuesta. Por seguridad no la mostramos. Inténtalo de nuevo en unos segundos.";
  }

  // -- Citas devueltas al cliente ----------------------------------------
  const citations = [...personal, ...evidence].map((c) => ({
    source: c.source,
    title: c.title,
    path: c.path,
    score: c.score,
    evidenceLevel: c.evidenceLevel,
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
