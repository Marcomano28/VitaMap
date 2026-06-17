import type { Locale } from "./i18n";
import type { RetrievedChunk } from "./qmd";

export interface SourceLocaleMetadata {
  sourceLanguage?: string;
  sourceJurisdiction?: string[];
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function hostnameOf(sourceUrl: string | undefined): string {
  if (!sourceUrl) return "";
  try {
    return new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathOf(sourceUrl: string | undefined): string {
  if (!sourceUrl) return "";
  try {
    return new URL(sourceUrl).pathname.toLowerCase();
  } catch {
    return "";
  }
}

export function inferSourceLocaleFromUrl(sourceUrl: string | undefined): SourceLocaleMetadata {
  const host = hostnameOf(sourceUrl);
  const pathname = pathOf(sourceUrl);
  if (!host) return {};

  if (
    host.endsWith(".de") ||
    host.includes("gesundheitsinformation.de") ||
    host.includes("iqwig.de") ||
    host.includes("rki.de") ||
    host.includes("bfarm.de") ||
    host.includes("bfr.bund.de")
  ) {
    return { sourceLanguage: "de", sourceJurisdiction: ["DE"] };
  }

  if (host.includes("europa.eu") || host.includes("ema.europa.eu") || host.includes("efsa.europa.eu")) {
    return {
      sourceLanguage: pathname.includes("/de/") ? "de" : "en",
      sourceJurisdiction: ["EU"],
    };
  }

  if (host.endsWith(".at")) return { sourceLanguage: "de", sourceJurisdiction: ["AT"] };
  if (host.endsWith(".ch")) return { sourceLanguage: "de", sourceJurisdiction: ["CH"] };
  if (host.endsWith(".es")) return { sourceLanguage: "es", sourceJurisdiction: ["ES"] };
  if (host.endsWith(".uk") || host.includes("nhs.uk")) {
    return { sourceLanguage: "en", sourceJurisdiction: ["GB"] };
  }

  if (
    host.endsWith(".gov") ||
    host.includes("nih.gov") ||
    host.includes("medlineplus.gov") ||
    host.includes("cdc.gov") ||
    host.includes("cancer.gov") ||
    host.includes("ncbi.nlm.nih.gov") ||
    host.includes("pubmed.ncbi.nlm.nih.gov")
  ) {
    return { sourceLanguage: "en", sourceJurisdiction: ["US"] };
  }

  if (host.includes("who.int")) return { sourceLanguage: "en", sourceJurisdiction: ["INT"] };
  if (host.includes("ctext.org")) return { sourceLanguage: "zh", sourceJurisdiction: ["CN"] };
  if (host.includes("uchile.cl")) return { sourceLanguage: "es", sourceJurisdiction: ["CL"] };

  return {};
}

function sourceLocaleOf(chunk: RetrievedChunk): SourceLocaleMetadata {
  const inferred = inferSourceLocaleFromUrl(chunk.sourceUrl);
  return {
    sourceLanguage: chunk.sourceLanguage ?? inferred.sourceLanguage,
    sourceJurisdiction: chunk.sourceJurisdiction ?? inferred.sourceJurisdiction,
  };
}

function preferenceScore(chunk: RetrievedChunk, locale: Locale): number {
  if (chunk.source !== "evidence") return 0;
  const source = sourceLocaleOf(chunk);
  const language = source.sourceLanguage;
  const jurisdictions = source.sourceJurisdiction ?? [];

  if (locale === "de") {
    let score = 0;
    if (language === "de") score += 6;
    if (jurisdictions.includes("DE")) score += 4;
    if (jurisdictions.includes("EU")) score += 3;
    if (jurisdictions.includes("AT") || jurisdictions.includes("CH")) score += 2;
    if (language === "en") score += 1;
    return score;
  }

  if (locale === "es") {
    let score = 0;
    if (language === "es") score += 5;
    if (jurisdictions.includes("ES")) score += 3;
    if (language === "en") score += 1;
    return score;
  }

  return 0;
}

export function preferEvidenceForLocale(
  chunks: readonly RetrievedChunk[],
  locale: Locale | undefined,
): RetrievedChunk[] {
  if (!locale) return [...chunks];
  return chunks
    .map((chunk, index) => ({ chunk, index, preference: preferenceScore(chunk, locale) }))
    .sort((a, b) => b.preference - a.preference || a.index - b.index)
    .map(({ chunk }) => chunk);
}

export function normalizeJurisdiction(value: unknown): string[] | undefined {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\s]+/)
      : [];
  const values = uniq(
    raw
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toUpperCase()),
  );
  return values.length ? values : undefined;
}
