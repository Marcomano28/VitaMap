import { z } from "zod";
import { getEnv } from "../../env";
import { beginLlmMeasurement } from "../telemetry";
import { parseRetryAfter } from "../../llm-errors";

const probability = z.number().finite().min(0).max(1);
const choiceSchema = z.object({
  type: z.literal("choice"), choice: z.string(),
  probabilities: z.record(probability), confidence: probability,
}).strict();
const responseSchema = z.object({
  model: z.string(), answers: z.record(choiceSchema),
  usage: z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() }).strict(),
}).strict();
export type ChoiceAnswer = z.infer<typeof choiceSchema>;
export type Questions = Record<string, { type: "choice"; instructions: string; criteria: Record<string, string> }>;
export type Decisions = z.infer<typeof responseSchema>;
export class TypeSafeError extends Error {
  constructor(readonly code: "not_configured" | "rate_limited" | "unavailable" | "timeout" | "invalid", readonly retryAfterSec?: number) {
    super(`typesafe_${code}`);
  }
}

export function validateDecisions(raw: unknown, questions: Questions, model: string): Decisions {
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success || parsed.data.model !== model) throw new TypeSafeError("invalid");
  const result = parsed.data;
  if (Object.keys(result.answers).sort().join() !== Object.keys(questions).sort().join()) throw new TypeSafeError("invalid");
  for (const [id, question] of Object.entries(questions)) {
    const answer = result.answers[id];
    const keys = Object.keys(question.criteria).sort();
    const scores = Object.values(answer.probabilities);
    if (!keys.includes(answer.choice) || keys.join() !== Object.keys(answer.probabilities).sort().join()
      || Math.abs(scores.reduce((a, b) => a + b, 0) - 1) > 0.001
      || answer.probabilities[answer.choice] < Math.max(...scores)) throw new TypeSafeError("invalid");
  }
  return result;
}

/** Provisional experimental thresholds, NOT calibrated clinical confidence. */
export function acceptedChoice(answer: ChoiceAnswer): string | null {
  const ranked = Object.values(answer.probabilities).sort((a, b) => b - a);
  return answer.confidence >= 0.7 && ranked[0] >= 0.8 && ranked[0] - (ranked[1] ?? 0) >= 0.2 ? answer.choice : null;
}

export async function evaluateChoices(
  state: unknown, questions: Questions,
  stage: "jev_route" | "jev_evidence" | "jev_support", signal: AbortSignal,
): Promise<Decisions> {
  const env = getEnv();
  if (!env.TYPESAFE_API_KEY) throw new TypeSafeError("not_configured");
  const body = JSON.stringify({ model: env.TYPESAFE_MODEL, state, questions });
  if (body.length > 40_000 || Object.keys(questions).length > 6) throw new TypeSafeError("invalid");
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(env.TYPESAFE_TIMEOUT_MS)]);
  const finish = beginLlmMeasurement(stage, "typesafe");
  let httpStatus: number | undefined;
  let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
  let outcome: "ok" | "error" | "aborted" | "rate_limited" = "error";
  try {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.TYPESAFE_API_KEY}` },
      body, signal: deadline, redirect: "error",
    });
    httpStatus = response.status;
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      if (response.status === 429 || response.status === 529) {
        outcome = "rate_limited";
        throw new TypeSafeError("rate_limited", parseRetryAfter(response.headers.get("retry-after")));
      }
      throw new TypeSafeError("unavailable");
    }
    const raw: unknown = await response.json();
    // Usage can still be accounted when decisions are invalid.
    const parsed = responseSchema.safeParse(raw);
    if (parsed.success) {
      const u = parsed.data.usage;
      usage = { prompt_tokens: u.input_tokens, completion_tokens: u.output_tokens, total_tokens: u.input_tokens + u.output_tokens };
    }
    const result = validateDecisions(raw, questions, env.TYPESAFE_MODEL);
    outcome = "ok";
    return result;
  } catch (error) {
    if (deadline.aborted) { outcome = "aborted"; throw new TypeSafeError("timeout"); }
    if (error instanceof TypeSafeError) throw error;
    // Never expose provider errors, request state or response bodies.
    throw new TypeSafeError("unavailable");
  } finally { finish({ outcome, httpStatus, usage }); }
}
