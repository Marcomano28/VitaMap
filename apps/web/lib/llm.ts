/**
 * Cliente del LLM principal. Habla protocolo OpenAI-compatible contra el
 * endpoint definido en LLM_BASE_URL (llama.cpp server / Ollama / vLLM).
 *
 * Sin SDK pesada: fetch directo es suficiente y mantiene el bundle pequeño.
 */

import { getEnv } from "./env";

// =====================================================================
// Tipos
// =====================================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  jsonSchema?: Record<string, unknown>;
}

interface CompletionResponse {
  choices: Array<{ message: { role: string; content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// =====================================================================
// System prompt — la pieza más crítica del producto
// =====================================================================

export const SOCRATIC_SYSTEM_PROMPT = `Eres un asistente reflexivo de salud personal. NO eres médico y NO emites diagnósticos ni recomendaciones de tratamiento.

Reglas inviolables:
1. NUNCA afirmes "usted tiene X" ni "debería tomar Y".
2. Cada afirmación clínica debe ir acompañada de una cita explícita de su fuente entre <source>...</source>, citando el atributo "level" si la fuente es evidencia científica.
3. Cuando reconozcas un patrón en la memoria personal del usuario, formúlalo como una observación + pregunta socrática ("Observo que en X fechas Y; ¿qué notabas tú en esos días?").
4. Si la información disponible es insuficiente, dilo claramente.
5. Distingue siempre entre lo que viene de la memoria personal del usuario y lo que viene de la evidencia científica.

Las fuentes en tu contexto vienen etiquetadas:
- <source type="personal" observed_at="..." doc="..."> = observación del usuario
- <source type="evidence" level="..." url="..." doc="..."> = fragmento de literatura científica

Comparar un resultado con el intervalo de referencia impreso en la misma
analítica es una descripción factual, no un diagnóstico. Puedes responderlo
directamente si atribuyes el dato a esa fuente.

Responde en el mismo idioma del usuario. Tono cálido pero preciso. /no_think`;

export const GUARDRAIL_CLASSIFIER_PROMPT = `Eres un revisor clínico. Analiza el siguiente texto y devuelve EXCLUSIVAMENTE un JSON con esta forma:

{"verdict": "safe" | "rewrite" | "block", "flags": [...]}

Marca "rewrite" si el texto contiene: afirmaciones diagnósticas directas ("usted tiene"), recomendaciones de tratamiento o dosis ("debería tomar"), afirmaciones clínicas sin cita de fuente, o lenguaje de certeza absoluta sobre temas clínicos.

Marca "block" solo si hay daño potencial inmediato (p. ej. recomendación de suspender medicación sin supervisión médica).

Comparar literalmente un resultado con el intervalo de referencia impreso en
la fuente NO es un diagnóstico y debe marcarse "safe" si está atribuido.

Flags posibles: diagnostic_statement, treatment_recommendation, dosage_recommendation, medication_name_without_evidence, absolute_certainty, missing_evidence_tag.

Devuelve solo el JSON, sin explicación. /no_think`;

// =====================================================================
// API pública
// =====================================================================

/**
 * Llamada non-streaming. Devuelve el contenido de assistant.
 * En errores HTTP lanza, dejando que el caller decida cómo manejarlos.
 */
export async function chat(req: ChatRequest): Promise<string> {
  const env = getEnv();
  const timeout = AbortSignal.timeout(120_000);
  const signal = req.signal
    ? AbortSignal.any([req.signal, timeout])
    : timeout;
  const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages: req.messages,
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 1024,
      stream: false,
      chat_template_kwargs: { enable_thinking: false },
      ...(req.jsonSchema
        ? {
            response_format: {
              type: "json_schema",
              schema: req.jsonSchema,
            },
          }
        : {}),
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM error ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as CompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response missing choices[0].message.content");
  }
  return content;
}

/**
 * Streaming SSE token-a-token. Útil cuando queramos /api/chat con
 * TransferEncoding: chunked. Para Fase 0 priorizamos non-streaming para
 * que el guardrail pueda actuar sobre la respuesta completa.
 */
export async function chatStream(req: ChatRequest): Promise<ReadableStream<string>> {
  const env = getEnv();
  const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LLM_API_KEY}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages: req.messages,
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 1024,
      stream: true,
    }),
    signal: req.signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM stream error ${res.status}: ${body.slice(0, 500)}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<string>({
    async start(controller) {
      const reader = res.body!.getReader();
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(delta);
              }
            } catch {
              // ignorar líneas no JSON (keep-alives, etc.)
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
