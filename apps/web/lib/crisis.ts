/**
 * Clasificador de crisis (ROADMAP — "guardrail específico para contenido
 * de crisis", criterios C-SSRS simplificados).
 *
 * Corre sobre los mensajes del usuario ANTES de la generación. Si detecta
 * señales de ideación suicida, autolesión o riesgo de daño — también
 * expresadas de forma indirecta — el flujo normal del chat no se activa:
 * la UI muestra un aviso fijo con recursos de ayuda y el evento queda en
 * el audit log como `safety.crisis_detected`, sin contenido.
 *
 * Política de errores: si la llamada al LLM falla (timeout, red), el
 * clasificador NO bloquea el chat (fail-open) — bloquear todo el servicio
 * por un error de infraestructura disfrazaría una caída de aviso de
 * crisis. La regla conservadora "ante la duda, crisis" aplica a la
 * clasificación, no a los errores. El guardrail diagnóstico de la
 * respuesta sigue siendo fail-closed.
 */

import { chat, type ChatMessage } from "./llm";

const CRISIS_TIMEOUT_MS = 8_000;
const MAX_HISTORY_USER_TURNS = 8;
const MAX_TURN_CHARS = 500;

export const CRISIS_CLASSIFIER_PROMPT = `Eres un clasificador de seguridad para una plataforma de salud. Analiza los mensajes del usuario y devuelve EXCLUSIVAMENTE un JSON con esta forma:

{"crisis": true | false}

Marca "crisis": true si detectas, de forma directa O indirecta:
- ideación suicida pasiva ("no quiero seguir", "ojalá no despertara", "estarían mejor sin mí") o activa
- deseo de morir, plan, preparativos, despedidas o cierre de asuntos
- autolesión actual, reciente, o impulsos de autolesionarse
- intención de hacer daño a otra persona

NO marques crisis por: tristeza, ansiedad, agotamiento o desesperanza sin señal de riesgo; dolor físico expresado con frases hechas ("este dolor me mata", "me muero de cansancio"); preguntas informativas o académicas sobre salud mental; relatos sobre terceras personas sin implicación de riesgo propio.

Regla conservadora: ante una duda razonable entre crisis y no crisis, marca true. Un falso positivo es aceptable; un falso negativo no.

Los mensajes pueden estar en español o alemán. Devuelve solo el JSON, sin explicación. /no_think`;

const CRISIS_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: { crisis: { type: "boolean" } },
  required: ["crisis"],
  additionalProperties: false,
};

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CrisisDecision {
  crisis: boolean;
  /** true si la decisión proviene de un error del clasificador (fail-open). */
  classifierError: boolean;
}

function collectUserText(
  message: string,
  history: readonly HistoryMessage[],
): string {
  const turns = history
    .filter((t) => t.role === "user" && t.content.trim())
    .slice(-MAX_HISTORY_USER_TURNS)
    .map((t) => t.content.replace(/\s+/g, " ").trim().slice(0, MAX_TURN_CHARS));
  turns.push(message.replace(/\s+/g, " ").trim().slice(0, MAX_TURN_CHARS));
  return turns.map((t, i) => `Mensaje ${i + 1}: ${t}`).join("\n");
}

export async function detectCrisis(
  message: string,
  history: readonly HistoryMessage[],
  signal?: AbortSignal,
): Promise<CrisisDecision> {
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: CRISIS_CLASSIFIER_PROMPT },
      { role: "user", content: collectUserText(message, history) },
    ];
    const raw = await chat({
      messages,
      temperature: 0,
      maxTokens: 60,
      jsonSchema: CRISIS_JSON_SCHEMA,
      signal: signal ?? AbortSignal.timeout(CRISIS_TIMEOUT_MS),
    });
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) {
      // Salida no parseable = duda del clasificador, no error de infra:
      // aplica la regla conservadora.
      console.warn("[crisis] unparseable_output");
      return { crisis: true, classifierError: false };
    }
    const parsed = JSON.parse(m[0]) as { crisis?: unknown };
    if (typeof parsed.crisis !== "boolean") {
      console.warn("[crisis] invalid_schema");
      return { crisis: true, classifierError: false };
    }
    return { crisis: parsed.crisis, classifierError: false };
  } catch (err) {
    // Error de infraestructura: fail-open con traza (ver cabecera).
    console.error("[crisis] classifier_failed", String(err).slice(0, 200));
    return { crisis: false, classifierError: true };
  }
}

/**
 * Texto de recursos mostrado en lugar de la respuesta normal. Fijo, nunca
 * generado por el LLM. Números verificados a fecha del commit; revisar
 * al ampliar países del piloto.
 */
export function crisisResourcesText(locale: "es" | "de"): string {
  if (locale === "de") {
    return [
      "Was du geschrieben hast, erscheint mir wichtig — und ich möchte, dass du jetzt echte Unterstützung von einem Menschen bekommst, nicht von einer Lernplattform.",
      "",
      "Bei unmittelbarer Gefahr: ruf die 112 an.",
      "Telefonseelsorge (kostenlos, rund um die Uhr): 0800 111 0 111 oder 0800 111 0 222 — auch per Chat auf online.telefonseelsorge.de.",
      "",
      "Diese Plattform ist ein Lernangebot und kann in einer Krise nicht helfen. Das Gespräch hier wird nicht gespeichert.",
    ].join("\n");
  }
  return [
    "Lo que has escrito me parece importante — y quiero que recibas apoyo real de una persona ahora, no de una plataforma educativa.",
    "",
    "Si estás en peligro inmediato: llama al 112.",
    "Línea 024 de atención a la conducta suicida (gratuita, 24 h, España). Teléfono de la Esperanza: 717 003 717.",
    "Si estás fuera de España, busca la línea de crisis de tu país.",
    "",
    "Esta plataforma es educativa y no puede ayudarte en una crisis. Esta conversación no se guarda.",
  ].join("\n");
}
