import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { getEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeLlmQuota, refundLlmQuota, llmDisabled } from "@/lib/llm-quota";
import { withChatTelemetry, type ChatTelemetry } from "@/lib/chat/telemetry";
import { CASES, fixture, MAX_EXPERIMENT_CALLS } from "@/lib/chat/experiments/fixtures";
import { experimentConfigurationId, experimentStore } from "@/lib/chat/experiments/config";
import { ExperimentStoreError, type ExperimentSession } from "@/lib/chat/experiments/store";
import { runExperiment } from "@/lib/chat/experiments/runner";
import { TypeSafeError } from "@/lib/chat/experiments/typesafe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), caseId: z.enum(["education", "latest", "context", "ambiguous", "insufficient", "crisis"]), locale: z.enum(["es", "de"]), variant: z.enum(["current", "control", "jev"]) }).strict(),
  z.object({ action: z.literal("run"), sessionId: z.string().uuid(), step: z.number().int().min(0).max(1) }).strict(),
]);
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function authorize(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session?.user) return null;
  return isAdminEmail(session.user.email) ? session.user.id : null;
}
function publicSession(session: ExperimentSession) {
  const { id, caseId, locale, variant, version, expiresAt, step, status, results } = session;
  return { id, caseId, locale, variant, version, expiresAt, step, status, results, turns: fixture(caseId, locale).turns };
}
function storeError(error: unknown) {
  if (error instanceof ExperimentStoreError) return json({ error: error.code }, error.code === "not_found" ? 404 : error.code === "budget_exhausted" ? 429 : 409);
  return json({ error: "experiment_unavailable" }, 503);
}

export async function GET(req: Request) {
  if (!(await authorize(req))) return json({ error: "forbidden" }, 403);
  const env = getEnv();
  return json({ enabled: env.CHAT_EXPERIMENTS_ENABLED, jevConfigured: Boolean(env.TYPESAFE_API_KEY),
    inferenceEnabled: !llmDisabled(), cases: CASES, configurationId: experimentConfigurationId(),
    mainModel: env.LLM_MODEL, jevModel: env.TYPESAFE_MODEL, dailyCallReservationLimit: env.CHAT_EXPERIMENT_DAILY_CALLS,
  });
}

export async function POST(req: Request) {
  const owner = await authorize(req);
  if (!owner) return json({ error: "forbidden" }, 403);
  const env = getEnv();
  if (!env.CHAT_EXPERIMENTS_ENABLED || llmDisabled()) return json({ error: "experiments_disabled" }, 503);
  if (req.headers.get("origin") !== new URL(env.NEXT_PUBLIC_APP_URL).origin) return json({ error: "invalid_origin" }, 403);
  if (!checkRateLimit(`chat-experiments:${owner}`, 10, 60_000).allowed) return json({ error: "rate_limited" }, 429);
  // A finite body limit before JSON parsing; no free-form prompts accepted.
  const raw = await req.text();
  if (raw.length > 1024) return json({ error: "invalid_body" }, 400);
  let input: z.infer<typeof bodySchema>;
  try { input = bodySchema.parse(JSON.parse(raw)); } catch { return json({ error: "invalid_body" }, 400); }
  const version = experimentConfigurationId();
  try {
    const store = experimentStore();
    if (input.action === "create") {
      if (input.variant === "jev" && !env.TYPESAFE_API_KEY) return json({ error: "typesafe_not_configured" }, 503);
      return json({ session: publicSession(store.create(owner, input.caseId, input.locale, input.variant, version)) });
    }
    const existing = store.read(input.sessionId, owner);
    if (existing.variant === "jev" && !env.TYPESAFE_API_KEY) return json({ error: "typesafe_not_configured" }, 503);
    const quotaTime = new Date();
    const quota = consumeLlmQuota(owner, "user", quotaTime);
    if (!quota.allowed) return json({ error: "quota_exhausted" }, 429);
    let session: ExperimentSession;
    try {
      session = store.claim(input.sessionId, owner, input.step, version, env.CHAT_EXPERIMENT_DAILY_CALLS);
    } catch (error) { refundLlmQuota(owner, "user", quotaTime); return storeError(error); }
    const deadline = AbortSignal.any([req.signal, AbortSignal.timeout(300_000)]);
    let metrics: ChatTelemetry | undefined;
    const result = await withChatTelemetry(async () => {
      try {
        const answer = await runExperiment(session.caseId, session.locale, session.variant, session.step, deadline);
        return { status: 200, answer, error: undefined as string | undefined };
      } catch (error) {
        // Safe codes only; never serialize errors or provider bodies.
        return { status: 503, answer: undefined, error: error instanceof TypeSafeError ? error.message : "experiment_unavailable" };
      }
    }, summary => {
      metrics = summary;
      console.info("[chat-experiment] usage " + JSON.stringify({ version, variant: session.variant, caseId: session.caseId, locale: session.locale, ...summary }));
    }, { maxCalls: MAX_EXPERIMENT_CALLS });
    store.finish(session.id, owner, session.step, { ...result, metrics }, result.status !== 200, fixture(session.caseId, session.locale).turns.length);
    return json({ session: publicSession(store.read(session.id, owner)), ...(result.error ? { error: result.error } : {}) }, result.status);
  } catch (error) { return storeError(error); }
}
