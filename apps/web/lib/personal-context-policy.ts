import type { RetrievedChunk } from "./qmd";
import type { MemoryItem } from "./memory-reader";

/**
 * Política temporal de memoria personal.
 *
 * No forma parte de corpus-taxonomy.json: "última" describe qué documento
 * personal elegir, no la identidad de un marcador ni una relación del corpus.
 */
export function isLatestLabRequest(message: string): boolean {
  const normalized = message.toLocaleLowerCase("es");

  // Una comparación o un plural explícito necesita varias fechas.
  if (
    /\b(compar|evoluci[oó]n|tendencia|hist[oó]ric|dos|tres|varias|mehrere|vergleich|verlauf|trend)\w*/i.test(
      normalized,
    ) ||
    /\b([uú]ltim(?:as|os)|letzten)\b/i.test(normalized)
  ) {
    return false;
  }

  const latest =
    /\b(?:mi|la|el)\s+[uú]ltim[oa]\s+(?:anal[ií]tica|an[aá]lisis|informe|resultado)/i.test(
      normalized,
    ) ||
    /\b(?:anal[ií]tica|an[aá]lisis|informe|resultado)\s+m[aá]s\s+reciente\b/i.test(
      normalized,
    ) ||
    /\b(?:meine[mrn]?|der|die|das)\s+(?:neueste[nrms]?|letzte[nrms]?)\s+(?:labor(?:bericht|befund|werte?)|blut(?:bild|werte?)|analyse|ergebnis)/i.test(
      normalized,
    ) ||
    /\b(?:c[oó]mo\s+est[aá]|cu[aá]l\s+es)\s+(?:ahora\s+)?(?:mi|el)\s+[\p{L}][\p{L}\d()%-]*(?:\s+[\p{L}][\p{L}\d()%-]*){0,3}\b/iu.test(
      normalized,
    ) ||
    /\bwie\s+(?:ist|hoch\s+ist)\s+(?:mein\w*|der|die|das)\s+[\p{L}][\p{L}\d()%-]*\b/iu.test(
      normalized,
    );

  return latest;
}

/** Pregunta sobre el valor personal, no sobre conocimiento general del marcador. */
export function isPersonalLabValueRequest(message: string): boolean {
  return /\b(mi|mis|anal[ií]tica|an[aá]lisis|resultado|valor(?:es)?|c[oó]mo est[aá]|c[oó]mo sali[oó]|compar\w*|evoluci[oó]n|tendencia|mein\w*|laborbefund|messwert\w*|vergleich\w*|verlauf)\b/i.test(
    message,
  );
}

/**
 * Una pregunta conceptual sobre un marcador no autoriza a introducir sus
 * analíticas. Conservamos otras clases de memoria para no desactivar el RAG
 * personal general; solo retiramos informes de laboratorio estructurados.
 */
export function personalContextForRequest(
  chunks: readonly RetrievedChunk[],
  includeLabResults: boolean,
): RetrievedChunk[] {
  if (includeLabResults) return [...chunks];
  return chunks.filter((chunk) => chunk.memoryType !== "lab_result");
}

export function selectLatestLabItem(items: readonly MemoryItem[]): MemoryItem | null {
  const dated = items.filter((item) => item.type === "lab_result" && item.observedAt);
  if (dated.length === 0) return null;
  return [...dated].sort((a, b) =>
    (b.observedAt ?? "").localeCompare(a.observedAt ?? ""),
  )[0];
}

/** Lee el informe más reciente por observed_at, sin depender del ranking QMD. */
export async function latestLabContext(userId: string): Promise<RetrievedChunk[]> {
  // Import dinámico: mantiene las funciones puras anteriores utilizables en
  // tests sin inicializar filesystem/QMD.
  const { listMemory, readMemoryItem } = await import("./memory-reader");
  const latest = selectLatestLabItem(await listMemory(userId, { type: "lab_result" }));
  if (!latest) return [];

  const document = await readMemoryItem(userId, latest.relPath);
  if (!document) return [];

  return [
    {
      source: "personal",
      docId: latest.relPath,
      path: latest.relPath,
      title: latest.title ?? `Analítica ${latest.observedAt}`,
      context: "",
      snippet: document.body.trim(),
      score: 1,
      observedAt: latest.observedAt,
    },
  ];
}
