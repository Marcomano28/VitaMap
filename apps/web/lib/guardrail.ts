/**
 * Guardrail anti-diagnóstico.
 *
 * Segunda pasada del LLM sobre la respuesta generada. Si detecta lenguaje
 * diagnóstico o prescriptivo, la marca para reescritura o bloqueo.
 *
 * Implementación dependiente de lib/llm.ts (chat non-streaming).
 */

import { chat, GUARDRAIL_CLASSIFIER_PROMPT } from "./llm";
import type { Locale } from "./i18n";

export type GuardrailVerdict = "safe" | "rewrite" | "block";

export interface GuardrailDecision {
  verdict: GuardrailVerdict;
  flags: GuardrailFlag[];
  reliable: boolean;
}

export type GuardrailFlag =
  | "diagnostic_statement"
  | "treatment_recommendation"
  | "dosage_recommendation"
  | "medication_name_without_evidence"
  | "absolute_certainty"
  | "missing_evidence_tag";

const ALL_FLAGS: GuardrailFlag[] = [
  "diagnostic_statement",
  "treatment_recommendation",
  "dosage_recommendation",
  "medication_name_without_evidence",
  "absolute_certainty",
  "missing_evidence_tag",
];

function extractJson(raw: string): { verdict: string; flags: string[] } | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]) as { verdict?: string; flags?: string[] };
    if (typeof parsed.verdict !== "string") return null;
    return {
      verdict: parsed.verdict,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch {
    return null;
  }
}

export async function checkResponse(
  text: string,
  signal?: AbortSignal,
): Promise<GuardrailDecision> {
  const raw = await chat({
    messages: [
      { role: "system", content: GUARDRAIL_CLASSIFIER_PROMPT },
      { role: "user", content: text },
    ],
    temperature: 0,
    maxTokens: 200,
    signal,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["verdict", "flags"],
      properties: {
        verdict: { type: "string", enum: ["safe", "rewrite", "block"] },
        flags: {
          type: "array",
          items: { type: "string", enum: ALL_FLAGS },
        },
      },
    },
  });

  const parsed = extractJson(raw);
  if (!parsed) {
    // Si el clasificador falla, fail-closed: tratar como "rewrite" para
    // forzar revisión humana.
    return {
      verdict: "rewrite",
      flags: ["missing_evidence_tag"],
      reliable: false,
    };
  }

  const verdict: GuardrailVerdict =
    parsed.verdict === "safe" || parsed.verdict === "block"
      ? parsed.verdict
      : "rewrite";

  const flags = parsed.flags.filter((f): f is GuardrailFlag =>
    (ALL_FLAGS as string[]).includes(f),
  );

  return { verdict, flags, reliable: true };
}

const REWRITE_PROMPT: Record<Locale, string> = {
  es: `Reescribe el siguiente texto en español, con un estilo socrático y observacional. No emitas diagnósticos. No recomiendes tratamientos. Convierte afirmaciones clínicas directas en preguntas o en observaciones acompañadas de su nivel de evidencia citado. Mantén las etiquetas <source>...</source> que ya aparezcan. Responde solo con el texto reescrito.`,
  de: `Formuliere den folgenden Text auf Deutsch in einem sokratischen, beobachtenden Stil neu. Stelle keine Diagnosen und empfehle keine Behandlungen. Verwandle direkte klinische Aussagen in Fragen oder Beobachtungen mit dem angegebenen Evidenzniveau. Behalte vorhandene <source>...</source>-Tags bei. Antworte ausschließlich mit dem neu formulierten Text.`,
};

export async function rewriteSocratic(
  text: string,
  locale: Locale,
  signal?: AbortSignal,
): Promise<string> {
  return chat({
    messages: [
      { role: "system", content: REWRITE_PROMPT[locale] },
      { role: "user", content: text },
    ],
    temperature: 0.3,
    maxTokens: 512,
    signal,
  });
}
