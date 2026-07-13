import { BASE_CONTENT_LOCALE, type Locale } from "./language-contract";
import type { RetrievedChunk } from "./qmd";

function conceptKey(chunk: RetrievedChunk): string {
  return chunk.canonicalCardId ?? chunk.tarjetaId ?? chunk.path ?? chunk.docId;
}

function isPublishedRendition(chunk: RetrievedChunk): boolean {
  return (
    chunk.localizationStatus === undefined ||
    chunk.localizationStatus === "reviewed"
  );
}

function renditionPriority(chunk: RetrievedChunk, locale: Locale): number {
  if (chunk.contentLocale === locale) return 0;
  // Todo el corpus legacy anterior al contrato tiene cuerpo español.
  if (
    chunk.contentLocale === BASE_CONTENT_LOCALE ||
    chunk.contentLocale === undefined
  ) {
    return 1;
  }
  // Una tarjeta original en otro idioma puede alimentar el fallback generado
  // del chat, pero nunca desplaza una rendición exacta o la base española.
  if (chunk.localizationKind === "original") return 2;
  return Number.POSITIVE_INFINITY;
}

/**
 * Escoge como máximo una rendición publicada por concepto. Mantiene el orden
 * de relevancia del primer hit conceptual, pero dentro del concepto prioriza
 * el idioma solicitado. Las rendiciones editoriales no revisadas se excluyen.
 */
export function selectEvidenceForContentLocale(
  chunks: readonly RetrievedChunk[],
  locale: Locale | undefined,
  limit = Number.POSITIVE_INFINITY,
): RetrievedChunk[] {
  if (!locale) {
    return chunks.filter(isPublishedRendition).slice(0, limit);
  }

  const groups = new Map<
    string,
    { firstIndex: number; candidates: Array<{ chunk: RetrievedChunk; index: number }> }
  >();
  chunks.forEach((chunk, index) => {
    if (!isPublishedRendition(chunk)) return;
    const key = conceptKey(chunk);
    const group = groups.get(key) ?? { firstIndex: index, candidates: [] };
    group.candidates.push({ chunk, index });
    groups.set(key, group);
  });

  return [...groups.values()]
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .flatMap((group) => {
      const selected = group.candidates
        .map(({ chunk, index }) => ({
          chunk,
          index,
          priority: renditionPriority(chunk, locale),
        }))
        .filter(({ priority }) => Number.isFinite(priority))
        .sort((left, right) => left.priority - right.priority || left.index - right.index)[0];
      if (!selected) return [];
      return [
        {
          ...selected.chunk,
          requestedContentLocale: locale,
          contentLocaleFallback: selected.priority > 0,
        },
      ];
    })
    .slice(0, limit);
}
