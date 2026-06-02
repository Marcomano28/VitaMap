/**
 * Extracción estructurada de analíticas a partir del texto OCR usando el
 * LLM principal con un schema Zod estricto.
 *
 * El LLM ve solo el TEXTO de la analítica (no la imagen ni el PDF
 * original). Su salida se valida contra el schema; si falla, se reintenta
 * una vez con un prompt de reparación.
 */

import { z } from "zod";
import { chat } from "./llm";

// =====================================================================
// Schema
// =====================================================================

export const LabMarker = z.object({
  name: z.string().min(1),
  value: z.number().nullable().default(null),
  unit: z.string().nullable().default(null),
  reference_range: z.string().nullable().default(null),
  flag: z.enum(["low", "normal", "high", "unknown"]).default("unknown"),
});
export type LabMarker = z.infer<typeof LabMarker>;

export const LabResultExtraction = z.object({
  lab_name: z.string().nullable().default(null),
  observed_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "observed_at debe ser ISO YYYY-MM-DD"),
  markers: z.array(LabMarker).default([]),
  notes: z.string().nullable().default(null),
});
export type LabResultExtraction = z.infer<typeof LabResultExtraction>;

// =====================================================================
// Prompt
// =====================================================================

const EXTRACTION_PROMPT = `Eres un extractor de datos clínicos. Recibirás el texto OCR de una analítica de laboratorio. Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma exacta:

{
  "lab_name": string | null,
  "observed_at": "YYYY-MM-DD",
  "markers": [
    {
      "name": string,
      "value": number | null,
      "unit": string | null,
      "reference_range": string | null,
      "flag": "low" | "normal" | "high" | "unknown"
    }
  ],
  "notes": string | null
}

Reglas:
- NO inventes valores. Si un dato no aparece, usa null.
- "observed_at" es la fecha de extracción de la muestra o de emisión del informe en formato ISO YYYY-MM-DD. Si solo hay año y mes, usa el día 01.
- Si hay rango de referencia, marca "flag" comparando el valor; si no hay rango, deja "unknown".
- IMPORTANTE: NO incluyas nombre del paciente, DNI, número de seguridad social, dirección ni teléfono. Si aparecen, ignóralos.
- Responde SOLO el JSON, sin explicación, sin markdown, sin código entre backticks.`;

const REPAIR_PROMPT = `El JSON anterior no validó. Corrígelo y devuelve SOLO el JSON válido, sin explicación.`;

// =====================================================================
// API
// =====================================================================

function extractJsonObject(raw: string): unknown | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export async function extractLabResult(ocrText: string): Promise<LabResultExtraction> {
  const userInput = ocrText.slice(0, 12000); // cota dura para no reventar contexto
  const draft = await chat({
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: userInput },
    ],
    temperature: 0,
    maxTokens: 2048,
  });

  const obj = extractJsonObject(draft);
  if (obj) {
    const parsed = LabResultExtraction.safeParse(obj);
    if (parsed.success) return parsed.data;
  }

  // Reintento con prompt de reparación.
  const repaired = await chat({
    messages: [
      { role: "system", content: EXTRACTION_PROMPT },
      { role: "user", content: userInput },
      { role: "assistant", content: draft },
      { role: "user", content: REPAIR_PROMPT },
    ],
    temperature: 0,
    maxTokens: 2048,
  });

  const obj2 = extractJsonObject(repaired);
  if (!obj2) throw new Error("extraction: el LLM no devolvió JSON parseable");
  return LabResultExtraction.parse(obj2);
}
