import { checkResponse } from "../../guardrail";
import { evaluateChoices, acceptedChoice, type Decisions } from "./typesafe";
import { supportQuestions } from "./questions";
import type { fixture, ExperimentVariant } from "./fixtures";

export type ProbeReport = {
  statement: string;
  passages: { id: string; text: string }[];
  expected: "supported" | "insufficient" | "contradicted";
  guardrail: { verdict: string; flags: string[]; accepted: boolean; matchesExpectedAcceptance: boolean };
  jev?: { chosen: string; accepted: string | null; matchesExpectedLabel: boolean; matchesExpectedAcceptedLabel: boolean };
};

/** Fixed identical statement/passages for both reviewers. No generation,
 * selection, routing or expected labels are sent to either reviewer. */
export async function runSupportProbe(data: ReturnType<typeof fixture>, variant: ExperimentVariant, signal: AbortSignal): Promise<{ report: ProbeReport; result?: Decisions }> {
  const probe = data.supportProbe!;
  const passages = data.evidence.filter(s => probe.sourceIds.includes(s.docId)).map(s => ({ id: s.docId, text: s.snippet }));
  const pairs = [{ id: "a1", text: probe.text, sources: passages.map(s => s.text) }];
  // Independent measurements; a guardrail rejection must not hide J3's result.
  const review = await checkResponse(`${probe.text} <source>${probe.sourceIds.join(", ")}</source>`,
    passages.map(p => `<source id="${p.id}">${p.text}</source>`).join("\n"), signal, false);
  const report: ProbeReport = {
    statement: probe.text, passages, expected: probe.expected,
    guardrail: { verdict: review.verdict, flags: review.flags, accepted: review.verdict === "safe", matchesExpectedAcceptance: (review.verdict === "safe") === (probe.expected === "supported") },
  };
  if (variant !== "jev") return { report };
  const result = await evaluateChoices(pairs, supportQuestions(pairs), "jev_support", signal);
  const answer = result.answers.a1;
  if (answer.type !== "choice") throw new Error("invalid_support_answer");
  const accepted = acceptedChoice(answer, "support");
  report.jev = { chosen: answer.choice, accepted, matchesExpectedLabel: answer.choice === probe.expected, matchesExpectedAcceptedLabel: accepted === probe.expected };
  return { report, result };
}
