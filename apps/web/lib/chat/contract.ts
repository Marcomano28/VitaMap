import type { SubjectContext } from "../data-access";
import type { LanguageContext } from "../language-contract";
import type { RetrievedChunk } from "../qmd";
import type { LabSeries } from "../lab-visualization";
import type { ChatInput } from "./request";
import type { llmRateLimitResult } from "./rate-limit-response";

/** Constructed by the route only after authorization and input safety checks. */
export interface ChatExecutionContext {
  subject: SubjectContext;
  input: ChatInput;
  language: LanguageContext;
  editorialDepth: "discover" | "understand" | "deep";
  deadline: AbortSignal;
  startedAt: number;
}

export type ChatCitation = Pick<
  RetrievedChunk,
  | "source" | "title" | "path" | "score"
  | "sourceKind" | "sourceDocumentType" | "sourceUrl"
  | "sourceLanguage" | "sourceJurisdiction" | "canonicalCardId"
  | "contentLocale" | "requestedContentLocale" | "contentLocaleFallback"
  | "observedAt"
>;

/** Wire-compatible with the existing ChatUI. */
export interface ChatAnswer {
  text: string;
  citations: ChatCitation[];
  guardrail: { verdict: "safe" | "rewrite" | "block"; flags: string[] };
  depth: ChatExecutionContext["editorialDepth"];
  editorialComposed: boolean;
  topics: string[];
  visualization?: {
    kind: "lab-series";
    series: Array<{ markerId: string; displayName: string; series: LabSeries }>;
    mapHref: string;
  };
}

export type ChatRunResult =
  | ReturnType<typeof llmRateLimitResult>
  | { status: 200; body: ChatAnswer }
  | { status: 500 | 502; body: { error: "retrieval_failed" | "llm_failed" } };

export type ChatRunner = (context: ChatExecutionContext) => Promise<ChatRunResult>;
