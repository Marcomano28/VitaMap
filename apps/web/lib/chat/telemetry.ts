import { AsyncLocalStorage } from "node:async_hooks";

export type LlmStage = "crisis" | "query_rewrite" | "generation" | "guardrail" | "response_rewrite" | "unclassified";
type Usage = { prompt_tokens?: unknown; completion_tokens?: unknown; total_tokens?: unknown };
type Outcome = "ok" | "rate_limited" | "aborted" | "error";
type Call = {
  stage: LlmStage;
  provider: "local" | "external";
  offsetMs: number;
  durationMs: number;
  outcome: Outcome;
  httpStatus: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};
type Scope = { start: number; closed: boolean; calls: Call[] };
const storage = new AsyncLocalStorage<Scope>();

function tokens(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/** Only numeric usage and fixed labels enter the collector: never prompts,
 * answers, provider error bodies, URLs, credentials or account identifiers. */
export function beginLlmMeasurement(stage: LlmStage, provider: "local" | "external") {
  const scope = storage.getStore();
  const start = performance.now();
  let finished = false;
  return (result: { outcome: Outcome; httpStatus?: number; usage?: Usage }) => {
    if (!scope || scope.closed || finished) return;
    finished = true;
    scope.calls.push({
      stage, provider,
      offsetMs: Math.round(start - scope.start),
      durationMs: Math.round(performance.now() - start),
      outcome: result.outcome,
      httpStatus: result.httpStatus ?? null,
      inputTokens: tokens(result.usage?.prompt_tokens),
      outputTokens: tokens(result.usage?.completion_tokens),
      totalTokens: tokens(result.usage?.total_tokens),
    });
  };
}

function tokenSummary(calls: Call[], field: "inputTokens" | "outputTokens" | "totalTokens") {
  const known = calls.flatMap(call => call[field] === null ? [] : [call[field]]);
  return {
    reported: known.length ? known.reduce((sum, count) => sum + count, 0) : null,
    callsWithUsage: known.length,
    callsWithoutUsage: calls.length - known.length,
  };
}

export type ChatTelemetry = {
  schemaVersion: 1;
  startedAt: string;
  durationMs: number;
  responseStatus: number;
  llmCalls: number;
  calls: Call[];
  tokens: Record<"input" | "output" | "total", ReturnType<typeof tokenSummary>>;
};

/** Request-local collection, including failures. No new inference or retries.
 * Non-streaming chat calls only; embeddings/QMD and ingestion are out of scope. */
export async function withChatTelemetry<T extends { status: number }>(
  run: () => Promise<T>,
  emit: (summary: ChatTelemetry) => void = summary => console.info("[chat] llm_usage " + JSON.stringify(summary)),
): Promise<T> {
  const scope: Scope = { start: performance.now(), closed: false, calls: [] };
  const startedAt = new Date().toISOString();
  return storage.run(scope, async () => {
    let responseStatus = 500;
    try {
      const response = await run();
      responseStatus = response.status;
      return response;
    } finally {
      scope.closed = true;
      // Requests rejected before inference don't need a provider usage record.
      if (scope.calls.length) {
        try {
          emit({
            schemaVersion: 1, startedAt,
            durationMs: Math.round(performance.now() - scope.start),
            responseStatus, llmCalls: scope.calls.length, calls: scope.calls,
            tokens: {
              input: tokenSummary(scope.calls, "inputTokens"),
              output: tokenSummary(scope.calls, "outputTokens"),
              total: tokenSummary(scope.calls, "totalTokens"),
            },
          });
        } catch { /* Observability must not alter the response. */ }
      }
    }
  });
}
