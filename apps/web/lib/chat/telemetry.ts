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
export type ChatStage =
  | "query_resolution" | "scope_resolution" | "qmd_retrieval"
  | "memory_store" | "kb_store" | "memory_search" | "kb_search" | "kb_lens_search"
  | "memory_documents" | "kb_documents" | "kb_lens_documents" | "evidence_selection"
  | "editorial_composition" | "personal_context" | "prompt_preparation";
type Span = {
  stage: ChatStage;
  offsetMs: number;
  durationMs: number;
  outcome: "ok" | "error" | "unfinished";
};
type Scope = { start: number; closed: boolean; calls: Call[]; spans: Span[] };
const storage = new AsyncLocalStorage<Scope>();

function beginChatStage(stage: ChatStage) {
  const scope = storage.getStore();
  const start = performance.now();
  const span: Span = { stage, offsetMs: scope ? Math.round(start - scope.start) : 0, durationMs: 0, outcome: "unfinished" };
  if (scope && !scope.closed) scope.spans.push(span);
  return (outcome: "ok" | "error") => {
    if (!scope || scope.closed) return;
    span.durationMs = Math.round(performance.now() - start);
    span.outcome = outcome;
  };
}

/** Nested/parallel spans are wall times, not additive costs. Only fixed labels
 * are recorded; values returned by work and thrown errors never enter the log. */
export async function measureChatStage<T>(stage: ChatStage, work: () => Promise<T>): Promise<T> {
  const finish = beginChatStage(stage);
  try {
    const value = await work();
    finish("ok");
    return value;
  } catch (error) {
    finish("error");
    throw error;
  }
}

export function measureChatStageSync<T>(stage: ChatStage, work: () => T): T {
  const finish = beginChatStage(stage);
  try {
    const value = work();
    finish("ok");
    return value;
  } catch (error) {
    finish("error");
    throw error;
  }
}

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
  schemaVersion: 2;
  startedAt: string;
  durationMs: number;
  responseStatus: number;
  llmCalls: number;
  calls: Call[];
  spans: Span[];
  tokens: Record<"input" | "output" | "total", ReturnType<typeof tokenSummary>>;
};

/** Request-local collection, including failures. No new inference or retries.
 * Token usage covers non-streaming chat only. QMD spans measure wall time,
 * never tokens of its internal models. Ingestion is out of scope. */
export async function withChatTelemetry<T extends { status: number }>(
  run: () => Promise<T>,
  emit: (summary: ChatTelemetry) => void = summary => console.info("[chat] llm_usage " + JSON.stringify(summary)),
): Promise<T> {
  const scope: Scope = { start: performance.now(), closed: false, calls: [], spans: [] };
  const startedAt = new Date().toISOString();
  return storage.run(scope, async () => {
    let responseStatus = 500;
    try {
      const response = await run();
      responseStatus = response.status;
      return response;
    } finally {
      scope.closed = true;
      const durationMs = Math.round(performance.now() - scope.start);
      // Parallel work may still be running when a sibling rejects. Report its
      // elapsed time as unfinished and prevent later mutation of this snapshot.
      for (const span of scope.spans) {
        if (span.outcome === "unfinished") span.durationMs = Math.max(0, durationMs - span.offsetMs);
      }
      // Requests rejected before instrumented work don't need a usage record.
      if (scope.calls.length || scope.spans.length) {
        try {
          emit({
            schemaVersion: 2, startedAt, durationMs,
            responseStatus, llmCalls: scope.calls.length, calls: scope.calls,
            spans: scope.spans,
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
