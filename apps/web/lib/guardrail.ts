/**
 * Guardrail de seguridad y fidelidad factual.
 *
 * Segunda pasada del LLM sobre la respuesta generada. Si detecta lenguaje
 * diagnóstico, prescriptivo o contradictorio con las fuentes, lo marca para
 * reescritura o bloqueo.
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
  | "missing_evidence_tag"
  | "unsupported_factual_claim";

const ALL_FLAGS: GuardrailFlag[] = [
  "diagnostic_statement",
  "treatment_recommendation",
  "dosage_recommendation",
  "medication_name_without_evidence",
  "absolute_certainty",
  "missing_evidence_tag",
  "unsupported_factual_claim",
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
  sourceContext = "",
  signal?: AbortSignal,
): Promise<GuardrailDecision> {
  const reviewInput = sourceContext
    ? `FUENTES PROPORCIONADAS:\n${sourceContext}\n\nRESPUESTA A REVISAR:\n${text}`
    : text;
  const raw = await chat({
    messages: [
      { role: "system", content: GUARDRAIL_CLASSIFIER_PROMPT },
      { role: "user", content: reviewInput },
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
  es: `Reescribe el texto en español usando únicamente las fuentes proporcionadas. Elimina o corrige cualquier afirmación factual que las fuentes no respalden o contradigan, especialmente sobre identidad, taxonomía, hábitat, preparación, eficacia, seguridad, o la relación entre un nutriente y un síntoma o parte del cuerpo. No emitas diagnósticos, no recomiendes tratamientos ni pautas dietéticas personalizadas. Convierte afirmaciones clínicas directas en observaciones acompañadas de su nivel de evidencia citado. Mantén las etiquetas <source>...</source> que ya aparezcan. Si las fuentes no permiten confirmar algo, dilo brevemente. Responde solo con el texto reescrito.`,
  de: `Formuliere den Text auf Deutsch neu und verwende ausschließlich die bereitgestellten Quellen. Entferne oder korrigiere Tatsachenbehauptungen, die von den Quellen nicht gestützt werden oder ihnen widersprechen, besonders zu Identität, Taxonomie, Lebensraum, Zubereitung, Wirksamkeit, Sicherheit oder dem Zusammenhang zwischen einem Nährstoff und einem Symptom oder Körperteil. Stelle keine Diagnosen, empfehle keine Behandlungen und keine personalisierten Ernährungspläne. Behalte vorhandene <source>...</source>-Tags bei. Wenn die Quellen etwas nicht bestätigen, sage das kurz. Antworte ausschließlich mit dem neu formulierten Text.`,
};

export async function rewriteSocratic(
  text: string,
  locale: Locale,
  sourceContext = "",
  signal?: AbortSignal,
): Promise<string> {
  const rewriteInput = sourceContext
    ? `FUENTES PROPORCIONADAS:\n${sourceContext}\n\nTEXTO A REESCRIBIR:\n${text}`
    : text;
  return chat({
    messages: [
      { role: "system", content: REWRITE_PROMPT[locale] },
      { role: "user", content: rewriteInput },
    ],
    temperature: 0.3,
    maxTokens: 512,
    signal,
  });
}
