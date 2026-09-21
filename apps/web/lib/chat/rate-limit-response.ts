/** Upstream capacity failure, distinct from VitaMap's own per-user 429 quotas. */
export function llmRateLimitResult(retryAfterSec?: number) {
  const headers: Record<string, string> = retryAfterSec === undefined
    ? {} : { "Retry-After": String(retryAfterSec) };
  return {
    status: 503 as const,
    body: {
      error: "llm_rate_limited" as const,
      ...(retryAfterSec === undefined ? {} : { retryAfterSec }),
    },
    headers,
  };
}
