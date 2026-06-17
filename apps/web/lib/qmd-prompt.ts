import type { RetrievedChunk } from "./qmd";

function promptAttribute(value: string | undefined, fallback = ""): string {
  return (value ?? fallback)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function promptListAttribute(value: readonly string[] | undefined): string | undefined {
  return value && value.length > 0 ? value.join(",") : undefined;
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
      return `<source type="evidence" kind="${promptAttribute(c.sourceKind, "unknown")}" document_type="${promptAttribute(c.sourceDocumentType, "unknown")}" marker="${promptAttribute(promptListAttribute(c.marker), "unknown")}" section="${promptAttribute(c.seccion, "unknown")}" health_area="${promptAttribute(promptListAttribute(c.areaDeSalud), "unknown")}" system="${promptAttribute(promptListAttribute(c.sistema), "unknown")}" source_language="${promptAttribute(c.sourceLanguage, "unknown")}" source_jurisdiction="${promptAttribute(promptListAttribute(c.sourceJurisdiction), "unknown")}" title="${promptAttribute(c.title)}" url="${promptAttribute(c.sourceUrl)}" doc="${promptAttribute(c.path)}">\n${limitations}${snippet}\n</source>`;
    })
    .join("\n\n");
}
