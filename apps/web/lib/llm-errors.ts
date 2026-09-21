/** Typed provider throttling. Never retains a provider response body or prompt. */
export class LlmRateLimitError extends Error {
  constructor(readonly retryAfterSec?: number) {
    super("LLM provider rate limit exceeded");
    this.name = "LlmRateLimitError";
  }
}

/** HTTP Retry-After may be seconds or a date. Missing/invalid means unknown. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value?.trim()) return undefined;
  const text = value.trim();
  const seconds = /^\d+$/.test(text)
    ? Number(text)
    : /^[A-Za-z]{3},/.test(text)
      ? Math.ceil((Date.parse(text) - now) / 1000)
      : NaN;
  return Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : undefined;
}
