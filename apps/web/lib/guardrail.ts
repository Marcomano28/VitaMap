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
  | "unsupported_factual_claim"
  | "unit_conversion_without_rule"
  | "personal_target_without_source"
  | "unsupported_lab_inference";

const ALL_FLAGS: GuardrailFlag[] = [
  "diagnostic_statement",
  "treatment_recommendation",
  "dosage_recommendation",
  "medication_name_without_evidence",
  "absolute_certainty",
  "missing_evidence_tag",
  "unsupported_factual_claim",
  "unit_conversion_without_rule",
  "personal_target_without_source",
  "unsupported_lab_inference",
];

/**
 * Comprobaciones deterministas para errores observados en el piloto. No
 * sustituyen al clasificador: garantizan que estas formas concretas siempre
 * pasen por reescritura aunque el segundo LLM sea permisivo.
 */
interface Measurement {
  value: string;
  unit: string;
}

function measurements(text: string): Measurement[] {
  return [...text.matchAll(/(-?\d+(?:[.,]\d+)?)\s*(mmol\s*\/\s*l|mg\s*\/\s*dL|ng\s*\/\s*mL|mg\s*\/\s*L|mIU\s*\/\s*L|%)/gi)].map(
    (match) => ({
      value: String(Number(match[1].replace(",", "."))),
      unit: match[2].replace(/\s+/g, "").toLocaleLowerCase("en"),
    }),
  );
}

function measurementKey(item: Measurement): string {
  return `${item.value}|${item.unit}`;
}

export function deterministicResponseFlags(
  text: string,
  sourceContext = "",
  enforcePersonalLabPolicy = true,
): GuardrailFlag[] {
  const flags = new Set<GuardrailFlag>();
  if (!enforcePersonalLabPolicy) return [];
  const hasBothUnits = /\bmmol\s*\/\s*l\b/i.test(text) && /\bmg\s*\/\s*dL\b/i.test(text);
  const claimsConversion =
    /\b(equival\w*|entspricht|umgerechnet|convert\w*|aproximadamente|aprox\.?|unos?)\b/i.test(
      text,
    );
  const claimsCrossUnitComparison =
    /(?:muy parecid\w*|casi id[eé]ntic\w*|similares?|pequeña diferencia de unidades|baj[oó]|subi[oó]|aument\w*|descend\w*|reduj\w*|m[aá]s alt\w*|m[aá]s baj\w*)/i.test(
      text,
    );
  if (hasBothUnits && (claimsConversion || claimsCrossUnitComparison)) {
    flags.add("unit_conversion_without_rule");
  }

  if (sourceContext) {
    const sourceMeasurements = measurements(sourceContext);
    const sourceKeys = new Set(sourceMeasurements.map(measurementKey));
    const responseMeasurements = measurements(text);
    const unsupported = responseMeasurements.filter(
      (item) => !sourceKeys.has(measurementKey(item)),
    );

    if (unsupported.length > 0) {
      flags.add("unsupported_factual_claim");
      const sourceUnits = new Set(sourceMeasurements.map((item) => item.unit));
      const hidesUnitChange = unsupported.some(
        (item) =>
          (item.unit === "mg/dl" && sourceUnits.has("mmol/l")) ||
          (item.unit === "mmol/l" && sourceUnits.has("mg/dl")),
      );
      if (hidesUnitChange) flags.add("unit_conversion_without_rule");
    }
  }

  if (
    /\b(rango habitual|rango saludable|rango normal|rango deseable|valores? normales?|niveles? normales?|umbral saludable|objetivo habitual|el objetivo (?:suele|es|sería)|pers[oö]nlicher zielwert|[uü]blicher zielbereich|gesunder bereich|normbereich)\b/i.test(
      text,
    )
  ) {
    flags.add("personal_target_without_source");
  }

  // "No permite descartar inflamación" es precisamente la cautela válida;
  // se retira antes de buscar conclusiones que sí la descartan.
  const inferenceText = text.replace(
    /no (?:permite|sirve para|basta para)\s+descartar\w*.{0,80}(?:inflamaci\w*|enfermedad)/gis,
    "",
  );
  if (
    /\b(no (?:hab[ií]a|hay|parece haber|se observa|existe)\b.{0,100}\b(?:inflamaci\w*|proceso inflamatorio)|no (?:est[aá]|estaba|est[eé]) siendo alterad\w*.{0,100}\b(?:inflamaci\w*|proceso inflamatorio)|ausencia de\b.{0,80}\b(?:inflamaci\w*|enfermedad)|sin (?:signos? de )?(?:inflamaci\w*|proceso inflamatorio)|descarta\w*\b.{0,80}\b(?:inflamaci\w*|enfermedad)|sugiere que no\b.{0,100}\b(?:inflamaci\w*|proceso inflamatorio)|keine\b.{0,100}\bentz[uü]ndung)\b/is.test(
      inferenceText,
    )
  ) {
    flags.add("unsupported_lab_inference");
  }

  return [...flags];
}

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
  enforcePersonalLabPolicy = false,
): Promise<GuardrailDecision> {
  const deterministicFlags = deterministicResponseFlags(
    text,
    sourceContext,
    enforcePersonalLabPolicy,
  );
  const reviewInput = sourceContext
    ? `FUENTES PROPORCIONADAS:\n${sourceContext}\n\nRESPUESTA A REVISAR:\n${text}`
    : text;
  const raw = await chat({
    stage: "guardrail",
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

  const flags = [
    ...new Set([
      ...parsed.flags.filter((f): f is GuardrailFlag =>
        (ALL_FLAGS as string[]).includes(f),
      ),
      ...deterministicFlags,
    ]),
  ];

  const effectiveVerdict: GuardrailVerdict =
    verdict === "safe" && flags.length > 0 ? "rewrite" : verdict;

  return { verdict: effectiveVerdict, flags, reliable: true };
}

const REWRITE_PROMPT: Record<Locale, string> = {
  es: `Reescribe el texto en español usando únicamente las fuentes proporcionadas. Elimina o corrige cualquier afirmación factual que las fuentes no respalden o contradigan, especialmente sobre identidad, taxonomía, hábitat, preparación, eficacia, seguridad, o la relación entre un nutriente y un síntoma o parte del cuerpo. No emitas diagnósticos, no recomiendes tratamientos ni pautas dietéticas personalizadas. Conserva las unidades originales sin convertirlas. Llama a los límites del laboratorio "intervalo de referencia indicado en el informe", nunca objetivo personal ni rango habitual/saludable. Un valor dentro del intervalo no demuestra ausencia de inflamación o enfermedad. Convierte afirmaciones clínicas directas en observaciones acompañadas de su fuente. Mantén solo las etiquetas <source>...</source> necesarias alrededor de las afirmaciones citadas y no copies bloques de fuente ni metadatos. Si las fuentes no permiten confirmar algo, dilo brevemente. Responde solo con el texto reescrito.`,
  de: `Formuliere den Text auf Deutsch neu und verwende ausschließlich die bereitgestellten Quellen. Entferne oder korrigiere Tatsachenbehauptungen, die von den Quellen nicht gestützt werden oder ihnen widersprechen, besonders zu Identität, Taxonomie, Lebensraum, Zubereitung, Wirksamkeit, Sicherheit oder dem Zusammenhang zwischen einem Nährstoff und einem Symptom oder Körperteil. Stelle keine Diagnosen, empfehle keine Behandlungen und keine personalisierten Ernährungspläne. Behalte die Originaleinheiten bei und rechne sie nicht um. Nenne Laborgrenzen den im Befund angegebenen Referenzbereich, nicht persönliches Ziel oder gesunden/üblichen Bereich. Ein Wert im Referenzbereich beweist nicht, dass keine Entzündung oder Erkrankung vorliegt. Behalte nur notwendige <source>...</source>-Tags um belegte Aussagen und kopiere keine Quellenblöcke oder Metadaten. Wenn die Quellen etwas nicht bestätigen, sage das kurz. Antworte ausschließlich mit dem neu formulierten Text.`,
};

export async function rewriteSocratic(
  text: string,
  locale: Locale,
  sourceContext = "",
  signal?: AbortSignal,
  policyFlags: readonly GuardrailFlag[] = [],
): Promise<string> {
  const targetedCorrection = policyFlags.length
    ? `\n\nLA REESCRITURA ANTERIOR TODAVÍA INCUMPLE: ${policyFlags.join(", ")}. ` +
      `Corrígelo de forma explícita. Usa solamente pares cifra+unidad que aparezcan literalmente en las fuentes. ` +
      `Si dos resultados tienen unidades distintas, muestra cada valor original por fecha y di que aquí no se comparan directamente; no conviertas, no calcules y no afirmes si subió o bajó. ` +
      `Sustituye normal/saludable/deseable por "dentro/fuera del intervalo de referencia indicado en ese informe". ` +
      `Elimina cualquier conclusión sobre ausencia de inflamación o enfermedad.`
    : "";
  const rewriteInput = sourceContext
    ? `FUENTES PROPORCIONADAS:\n${sourceContext}\n\nTEXTO A REESCRIBIR:\n${text}${targetedCorrection}`
    : `${text}${targetedCorrection}`;
  return chat({
    stage: "response_rewrite",
    messages: [
      { role: "system", content: REWRITE_PROMPT[locale] },
      { role: "user", content: rewriteInput },
    ],
    temperature: policyFlags.length > 0 ? 0 : 0.3,
    maxTokens: 512,
    signal,
  });
}
