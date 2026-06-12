import type { RetrievedChunk } from "./qmd";

function promptAttribute(value: string | undefined, fallback = ""): string {
  return (value ?? fallback)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SNIPPET_MAX_CHARS = 600;

function truncateSnippet(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max);
  return (cut > max * 0.7 ? text.slice(0, cut) : text.slice(0, max)) + " […]";
}

export function wrapForPrompt(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c) => {
      const snippet = truncateSnippet(c.snippet, SNIPPET_MAX_CHARS);
      if (c.source === "personal") {
        return `<source type="personal" observed_at="${promptAttribute(c.observedAt, "unknown")}" doc="${promptAttribute(c.path)}">\n${snippet}\n</source>`;
      }
      const limitations = c.limitations?.length
        ? `Limitaciones: ${c.limitations.join("; ")}\n`
        : "";
      return `<source type="evidence" kind="${promptAttribute(c.sourceKind, "unknown")}" document_type="${promptAttribute(c.sourceDocumentType, "unknown")}" title="${promptAttribute(c.title)}" url="${promptAttribute(c.sourceUrl)}" doc="${promptAttribute(c.path)}">\n${limitations}${snippet}\n</source>`;
    })
    .join("\n\n");
}
