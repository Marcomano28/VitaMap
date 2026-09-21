/**
 * Reescritura de la query de retrieval con el LLM (condense question).
 *
 * Las preguntas de seguimiento ("¿qué alimentos son apropiados?") tienen
 * poca señal semántica por sí solas y el buscador recupera chunks
 * genéricos. Esta pasada corta las convierte en una consulta autónoma
 * usando el historial. Si la pasada falla o tarda demasiado, se usa la
 * heurística de conversation-policy como fallback — el chat nunca se
 * bloquea por esta etapa.
 *
 * Coste: ~0.5-1 s y unas decenas de tokens por mensaje con proveedor
 * externo (ADR-014). En modo local CPU puede pesar más; si vuelve a ser
 * un problema al retornar a local, condicionar por LLM_PROVIDER aquí.
 */

import { chat } from "./llm";
import { LlmRateLimitError } from "./llm-errors";
import { buildRetrievalQuery } from "./conversation-policy";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

type Locale = "es" | "de";

const REWRITE_TIMEOUT_MS = 5_000;
const MAX_HISTORY_TURNS = 6;
const MAX_TURN_CHARS = 300;
const MAX_QUERY_CHARS = 400;

const REWRITE_SYSTEM_PROMPT: Record<Locale, string> = {
  es: `Eres un reescritor de consultas para un buscador semántico de salud. Recibes el historial de una conversación y la última pregunta del usuario. Devuelve UNA sola consulta de búsqueda autónoma que capture la intención completa: si la pregunta depende del historial (pronombres, "sí", "¿y eso?", referencias implícitas), incorpora el tema concreto del que se hablaba. Si la pregunta ya es autónoma o CAMBIA DE TEMA respecto al historial, devuélvela casi igual y NO arrastres el tema anterior a la consulta. Máximo 30 palabras. Sin comillas, sin explicación, sin saludos: solo la consulta. /no_think`,
  de: `Du bist ein Query-Rewriter für eine semantische Gesundheits-Suche. Du erhältst den Gesprächsverlauf und die letzte Frage des Benutzers. Gib EINE eigenständige Suchanfrage zurück, die die vollständige Absicht erfasst: Wenn die Frage vom Verlauf abhängt (Pronomen, "ja", implizite Bezüge), nimm das konkrete Thema auf. Ist die Frage bereits eigenständig oder WECHSELT sie das Thema, gib sie fast unverändert zurück und ziehe das vorherige Thema NICHT in die Anfrage. Maximal 30 Wörter. Keine Anführungszeichen, keine Erklärung: nur die Anfrage. /no_think`,
};

function formatHistory(history: readonly HistoryMessage[], locale: Locale): string {
  const turns = history.slice(-MAX_HISTORY_TURNS);
  const userLabel = locale === "de" ? "Benutzer" : "Usuario";
  const assistantLabel = locale === "de" ? "Assistent" : "Asistente";
  return turns
    .filter((t) => t.content.trim())
    .map(
      (t) =>
        `${t.role === "user" ? userLabel : assistantLabel}: ${t.content
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, MAX_TURN_CHARS)}`,
    )
    .join("\n");
}

/** Heurística de validez: una query, no una explicación ni un rechazo. */
function isUsableRewrite(raw: string): boolean {
  const text = raw.trim();
  if (!text || text.length > MAX_QUERY_CHARS) return false;
  if (text.split("\n").length > 2) return false;
  // Señales de que el modelo conversó en vez de reescribir.
  if (/^(lo siento|no puedo|als ki|entschuldigung|claro[,:]|aquí tienes)/i.test(text)) {
    return false;
  }
  return true;
}

export interface ResolvedQuery {
  query: string;
  method: "llm" | "heuristic";
}

export async function resolveRetrievalQuery(
  message: string,
  history: readonly HistoryMessage[],
  locale: Locale,
): Promise<ResolvedQuery> {
  const heuristic = (): ResolvedQuery => ({
    query: buildRetrievalQuery(message, history, locale),
    method: "heuristic",
  });

  // Primer mensaje de la conversación: no hay contexto que condensar.
  if (!history.some((t) => t.content.trim())) return heuristic();

  try {
    const userContent = `${formatHistory(history, locale)}\n\n${
      locale === "de" ? "Letzte Frage" : "Última pregunta"
    }: ${message.replace(/\s+/g, " ").trim().slice(0, MAX_TURN_CHARS)}`;

    const raw = await chat({
      messages: [
        { role: "system", content: REWRITE_SYSTEM_PROMPT[locale] },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      maxTokens: 80,
      signal: AbortSignal.timeout(REWRITE_TIMEOUT_MS),
    });

    const rewritten = raw.trim().replace(/^["'«]|["'»]$/g, "").trim();
    if (!isUsableRewrite(rewritten)) return heuristic();
    return { query: rewritten, method: "llm" };
  } catch (err) {
    // Do not continue to generation against the same throttled provider.
    if (err instanceof LlmRateLimitError) throw err;
    // Timeout o error del LLM: degradar en silencio a la heurística.
    console.warn("[chat] query_rewrite_failed", String(err).slice(0, 200));
    return heuristic();
  }
}
