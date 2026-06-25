/**
 * Tarjeta de cita devuelta por /api/chat. Server-safe (sin state).
 *
 * Para evidencia: muestra título + nivel de evidencia + enlace externo.
 * Para memoria personal: muestra título + fecha de la observación.
 */

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface Citation {
  source: "personal" | "evidence";
  title: string;
  path: string;
  score: number;
  sourceKind?: string;
  sourceDocumentType?: string;
  sourceUrl?: string | null;
  sourceLanguage?: string;
  sourceJurisdiction?: string[];
  observedAt?: string;
}

const KIND_COLOR: Record<string, string> = {
  "clinical-evidence": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "institutional-education": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  "tradition-context": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
};

const KIND_LABEL: Record<Locale, Record<string, string>> = {
  es: {
    "clinical-evidence": "Evidencia clínica",
    "institutional-education": "Educación institucional",
    "tradition-context": "Tradición y contexto",
  },
  de: {
    "clinical-evidence": "Klinische Evidenz",
    "institutional-education": "Institutionelle Information",
    "tradition-context": "Tradition und Kontext",
  },
};

const LANGUAGE_LABEL: Record<Locale, Record<string, string>> = {
  es: {
    de: "alemán",
    en: "inglés",
    es: "español",
    zh: "chino",
  },
  de: {
    de: "Deutsch",
    en: "Englisch",
    es: "Spanisch",
    zh: "Chinesisch",
  },
};

export function CitationCard({ c, locale }: { c: Citation; locale: Locale }) {
  if (c.source === "personal") {
    return (
      <Link
        href={`/memory/view/${encodeURI(c.path)}`}
        className="block rounded border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs hover:border-[var(--color-accent)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
          <span className="rounded bg-[var(--color-background)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
            {locale === "de" ? "dein Speicher" : "tu memoria"}
          </span>
        </div>
        {c.observedAt && (
          <p className="text-[var(--color-muted)] mt-0.5">{c.observedAt.slice(0, 10)}</p>
        )}
      </Link>
    );
  }

  const kindColor = KIND_COLOR[c.sourceKind ?? ""] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  const kindLabel = c.sourceKind ? (KIND_LABEL[locale][c.sourceKind] ?? c.sourceKind) : undefined;
  const sourceLocale = [
    c.sourceLanguage ? (LANGUAGE_LABEL[locale][c.sourceLanguage] ?? c.sourceLanguage) : undefined,
    c.sourceJurisdiction?.join("/"),
  ].filter(Boolean).join(" · ");
  const inner = (
    <div className="block rounded border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs hover:border-[var(--color-accent)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
        {kindLabel && (
          <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${kindColor}`}>
            {kindLabel}
          </span>
        )}
      </div>
      <p className="text-[var(--color-muted)] mt-0.5 truncate">
        {c.sourceDocumentType ? `${c.sourceDocumentType} · ` : ""}
        {sourceLocale ? `${sourceLocale} · ` : ""}
        {c.path}
      </p>
    </div>
  );
  return c.sourceUrl ? (
    <a href={c.sourceUrl} target="_blank" rel="noreferrer noopener">
      {inner}
    </a>
  ) : (
    inner
  );
}
