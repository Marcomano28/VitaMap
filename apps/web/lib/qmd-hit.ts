export interface QmdHit {
  displayPath?: string;
  path?: string;
  bestChunk?: string;
  snippet?: string;
  body?: string;
}

function stripLeadingFrontmatter(text: string): string {
  return text.replace(/^\s*---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").trim();
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
  return stripLeadingFrontmatter(
    (hit.bestChunk ?? hit.snippet ?? hit.body ?? "").trim(),
  );
}
