export interface QmdHit {
  displayPath?: string;
  path?: string;
  bestChunk?: string;
  snippet?: string;
  body?: string;
}

export function qmdRelativePath(
  hit: QmdHit,
  collection: "memory" | "kb",
): string {
  const raw = (hit.displayPath ?? hit.path ?? "")
    .replace(/^qmd:\/\//, "")
    .replace(/^\/+/, "");
  const prefix = `${collection}/`;
  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}

export function qmdHitSnippet(hit: QmdHit): string {
  return (hit.bestChunk ?? hit.snippet ?? hit.body ?? "").trim();
}
