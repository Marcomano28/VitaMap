/**
 * Tarjeta de cita devuelta por /api/chat. Server-safe (sin state).
 *
 * Para evidencia: muestra título + nivel de evidencia + enlace externo.
 * Para memoria personal: muestra título + fecha de la observación.
 */

import Link from "next/link";

interface Citation {
  source: "personal" | "evidence";
  title: string;
  path: string;
  score: number;
  evidenceLevel?: string;
  sourceUrl?: string | null;
  observedAt?: string;
}

const LEVEL_LABEL: Record<string, string> = {
  "cochrane-a": "Cochrane A",
  "cochrane-b": "Cochrane B",
  "grade-a": "GRADE A",
  "grade-b": "GRADE B",
  "grade-c": "GRADE C",
  "grade-d": "GRADE D",
  guideline: "Guía clínica",
  tradition: "Tradición",
  unrated: "Sin nivel",
};

const LEVEL_COLOR: Record<string, string> = {
  "cochrane-a": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  "cochrane-b": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  "grade-a": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  "grade-b": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "grade-c": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  "grade-d": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  guideline: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  tradition: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  unrated: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function CitationCard({ c }: { c: Citation }) {
  if (c.source === "personal") {
    return (
      <Link
        href={`/memory/view/${encodeURI(c.path)}`}
        className="block rounded border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs hover:border-[var(--color-accent)]"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{c.title}</span>
          <span className="rounded bg-[var(--color-background)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
            tu memoria
          </span>
        </div>
        {c.observedAt && (
          <p className="text-[var(--color-muted)] mt-0.5">{c.observedAt.slice(0, 10)}</p>
        )}
      </Link>
    );
  }

  const level = c.evidenceLevel ?? "unrated";
  const inner = (
    <div className="block rounded border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs hover:border-[var(--color-accent)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate">{c.title}</span>
        <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${LEVEL_COLOR[level] ?? LEVEL_COLOR.unrated}`}>
          {LEVEL_LABEL[level] ?? level}
        </span>
      </div>
      <p className="text-[var(--color-muted)] mt-0.5 truncate">{c.path}</p>
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
