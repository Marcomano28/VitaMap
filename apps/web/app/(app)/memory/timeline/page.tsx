import Link from "next/link";
import type { Metadata } from "next";
import { requireViewSubject } from "@/lib/data-access-guards";
import { DemoBanner } from "@/components/demo-notice";
import { listAllTags, listMemory, type MemoryItem } from "@/lib/memory-reader";
import { getLocale } from "@/lib/locale";
import { localize, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TEXT = {
  es: {
    title: "Mi memoria — línea de tiempo",
    entries: "entradas",
    filtered: "filtradas",
    type: "Tipo",
    tag: "Etiqueta",
    from: "Desde",
    to: "Hasta",
    allTags: "Todas",
    filter: "Filtrar",
    clear: "Limpiar",
    empty: "No hay entradas con esos filtros. Empieza desde",
    memoryPage: "la página de memoria",
    typeOptions: {
      "": "Todos los tipos",
      observation: "Observaciones",
      lab_result: "Analíticas",
      assessment: "Cuestionarios",
      image_observation: "Imágenes",
    },
    typeLabels: {
      observation: "Observación",
      lab_result: "Analítica",
      assessment: "Cuestionario",
      image_observation: "Imagen",
    },
  },
  de: {
    title: "Mein Speicher — Zeitlinie",
    entries: "Einträge",
    filtered: "gefiltert",
    type: "Typ",
    tag: "Schlagwort",
    from: "Von",
    to: "Bis",
    allTags: "Alle",
    filter: "Filtern",
    clear: "Zurücksetzen",
    empty: "Für diese Filter gibt es keine Einträge. Beginne auf",
    memoryPage: "der Speicherseite",
    typeOptions: {
      "": "Alle Typen",
      observation: "Beobachtungen",
      lab_result: "Laborbefunde",
      assessment: "Fragebögen",
      image_observation: "Bilder",
    },
    typeLabels: {
      observation: "Beobachtung",
      lab_result: "Laborbefund",
      assessment: "Fragebogen",
      image_observation: "Bild",
    },
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

const TYPE_COLOR: Record<string, string> = {
  observation: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  lab_result: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  assessment: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  image_observation: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
};

interface PageProps {
  searchParams: Promise<{ type?: string; tag?: string; from?: string; to?: string }>;
}

export default async function TimelinePage({ searchParams }: PageProps) {
  const { subject: userId, anonymous } = await requireViewSubject("read");
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const sp = await searchParams;
  const filter = {
    type: sp.type || undefined,
    tag: sp.tag || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
  };
  const [items, tags] = await Promise.all([listMemory(userId, filter), listAllTags(userId)]);

  return (
    <div className="space-y-6">
      {anonymous ? <DemoBanner locale={locale} /> : null}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {items.length} {t.entries}
          {filter.type || filter.tag || filter.from || filter.to ? ` (${t.filtered})` : ""}.
        </p>
      </header>

      <form method="GET" className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label={t.type}>
            <select name="type" defaultValue={filter.type ?? ""} className={inputCls}>
              {Object.entries(t.typeOptions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.tag}>
            <select name="tag" defaultValue={filter.tag ?? ""} className={inputCls}>
              <option value="">{t.allTags}</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.from}>
            <input type="date" name="from" defaultValue={filter.from ?? ""} className={inputCls} />
          </Field>
          <Field label={t.to}>
            <input type="date" name="to" defaultValue={filter.to ?? ""} className={inputCls} />
          </Field>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-1.5 text-sm font-medium hover:opacity-90"
          >
            {t.filter}
          </button>
          <Link href="/memory/timeline" className="text-sm self-center text-[var(--color-muted)] hover:underline">
            {t.clear}
          </Link>
        </div>
      </form>

      <section className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] py-4">
            {t.empty}{" "}
            <Link href="/memory" className="underline">
              {t.memoryPage}
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <Item key={it.relPath} it={it} locale={locale} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Item({ it, locale }: { it: MemoryItem; locale: Locale }) {
  const labels = localize(locale, TEXT).typeLabels;
  const t = it.type ?? "unknown";
  return (
    <li>
      <Link
        href={`/memory/view/${encodeURI(it.relPath)}`}
        className="block rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 hover:border-[var(--color-accent)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{it.title ?? it.relPath}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-2">{it.preview}</p>
            {it.tags && it.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {it.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded bg-[var(--color-background)] border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${TYPE_COLOR[t] ?? "bg-gray-100 text-gray-800"}`}>
              {labels[t as keyof typeof labels] ?? t}
            </span>
            {it.observedAt && (
              <span className="text-xs text-[var(--color-muted)]">{it.observedAt.slice(0, 10)}</span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
