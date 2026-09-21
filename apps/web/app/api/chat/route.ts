import { NextResponse } from "next/server";
import { inferEditorialDepth } from "@/lib/editorial-composition";
import { logAuditEventSafe } from "@/lib/audit";
import { UnauthorizedError, getSessionFromRequest } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getEnv } from "@/lib/env";
import { SubscriptionRequiredError } from "@/lib/subscription-access";
import { requireChatContext, type ChatContext } from "@/lib/data-access-guards";
import { languageContext } from "@/lib/language-contract";
import { detectCrisis, crisisResourcesText } from "@/lib/crisis";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeLlmQuota, refundLlmQuota } from "@/lib/llm-quota";
import { ChatBody, type ChatInput } from "@/lib/chat/request";
import { resolveChatVariant } from "@/lib/chat/variant";
import { runCurrentChat } from "@/lib/chat/current";
import { llmRateLimitResult } from "@/lib/chat/rate-limit-response";
import { withChatTelemetry } from "@/lib/chat/telemetry";

export const runtime = "nodejs"; // @tobilu/qmd y better-sqlite3 son nativos

/**
 * Endpoint del asistente reflexivo.
 *
 * Dos caminos, resueltos por `requireChatContext` (ver lib/data-access-guards):
 *
 *  · **Con sesión** — el de siempre. El userId proviene de la cookie de
 *    BetterAuth, nunca de la petición, y pasa por el choke point de ADR-018.
 *  · **Sin sesión y con `DEMO_MODE=true`** — visitante de la demostración
 *    (ADR-020). El sujeto es la constante `DEMO_SUBJECT_ID`, la cuota se cuenta
 *    por IP y hace falta `demoConsent: true` para obtener respuesta.
 *
 * Sin modo demostración, sin sesión no hay respuesta: 401.
 */
export async function POST(req: Request) {
  return withChatTelemetry(() => handlePost(req));
}

async function handlePost(req: Request) {
  const startedAt = Date.now();
  const deadline = AbortSignal.any([
    req.signal,
    AbortSignal.timeout(300_000),
  ]);
  let userId: string;
  let chatCtx: ChatContext;
  try {
    chatCtx = await requireChatContext(req);
    userId = chatCtx.subject;
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
  // El visitante anónimo se limita por IP y con menos margen: comparte el
  // mismo sujeto de datos que todos los demás visitantes, así que la clave
  // no puede ser el sujeto.
  const rate = chatCtx.anonymous
    ? checkRateLimit(`chat:anon:${chatCtx.quotaKey}`, 4, 60_000)
    : checkRateLimit(`chat:${userId}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  // -- Cuota diaria de inferencia ------------------------------------------
  // Distinta del limitador de ráfaga de arriba: acota el GASTO diario, no la
  // frecuencia. El tope de suscriptor es holgado y no debe notarse en uso
  // normal; existe como red ante una sesión robada o un cliente en bucle. El
  // tope global protege la factura de la instancia entera (ADR-019).
  const quota = consumeLlmQuota(chatCtx.quotaKey, chatCtx.quotaTier);
  if (!quota.allowed) {
    const payload =
      quota.reason === "kill_switch"
        ? { error: "llm_unavailable" }
        : {
            error:
              quota.reason === "global_daily"
                ? "daily_capacity_reached"
                : "daily_quota_reached",
            resetsInSec: quota.resetsInSec,
          };
    return NextResponse.json(payload, {
      status: quota.reason === "kill_switch" ? 503 : 429,
      headers: { "Retry-After": String(quota.resetsInSec) },
    });
  }

  // -- Validación ---------------------------------------------------------
  let body: ChatInput;
  try {
    body = ChatBody.parse(await req.json());
  } catch (err) {
    // No devolver el error crudo: puede contener internals. Al log sí.
    console.error("[chat] invalid_body", err);
    // La consulta nunca llegó al modelo: se devuelve la unidad de cuota.
    refundLlmQuota(chatCtx.quotaKey, chatCtx.quotaTier);
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  // -- Aviso previo del visitante anónimo (ADR-020) -------------------------
  // La interfaz ya no renderiza el chat hasta que se acepta, pero el requisito
  // se comprueba también aquí: así vive en el contrato de la API y no depende
  // de que una futura versión de la interfaz siga haciéndolo bien.
  if (chatCtx.anonymous && !body.demoConsent) {
    refundLlmQuota(chatCtx.quotaKey, chatCtx.quotaTier);
    return NextResponse.json({ error: "demo_consent_required" }, { status: 403 });
  }

  // La variante es una preferencia del turno, nunca un permiso ni una
  // configuración global. El flujo corriente no requiere sesión de admin.
  const selection = await resolveChatVariant(body.variant, {
    experimentsEnabled: getEnv().CHAT_EXPERIMENTS_ENABLED,
    isAdminActor: async () => {
      if (chatCtx.anonymous) return false;
      const session = await getSessionFromRequest(req);
      return Boolean(
        session?.user &&
        session.user.id === chatCtx.actor &&
        isAdminEmail(session.user.email),
      );
    },
  });
  if (!selection.allowed) {
    // Ninguna llamada de inferencia ni lectura de memoria ha ocurrido.
    refundLlmQuota(chatCtx.quotaKey, chatCtx.quotaTier);
    return NextResponse.json({ error: selection.error }, { status: selection.status });
  }

  const language = languageContext(body.locale);
  const editorialDepth = body.forceDepth
    ? body.depth
    : inferEditorialDepth(body.message, body.depth);

  // -- Clasificador de crisis ----------------------------------------------
  // Antes de cualquier generación (ROADMAP, criterios C-SSRS simplificados).
  // Si detecta riesgo, no se activa el flujo normal: aviso fijo con
  // recursos + audit log sin contenido. Fail-open ante errores de infra
  // (ver lib/crisis.ts).
  const crisisStartedAt = Date.now();
  const crisisDecision = await detectCrisis(body.message, body.history);
  if (crisisDecision.rateLimit) {
    const result = llmRateLimitResult(crisisDecision.rateLimit.retryAfterSec);
    return NextResponse.json(result.body, { status: result.status, headers: result.headers });
  }
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
      text: crisisResourcesText(language.answerLocale),
      citations: [],
      guardrail: { verdict: "block", flags: [] },
      crisis: true,
    });
  }

  // Único motor disponible en esta entrega. La selección Jev se rechaza
  // explícitamente antes de llegar aquí; nunca cae silenciosamente al actual.
  const result = await runCurrentChat({
    subject: chatCtx,
    input: body,
    language,
    editorialDepth,
    deadline,
    startedAt,
  });
  return NextResponse.json(result.body, {
    status: result.status,
    headers: "headers" in result ? result.headers : undefined,
  });
}
