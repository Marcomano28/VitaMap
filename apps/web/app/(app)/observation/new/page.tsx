import { createObservationAction } from "./actions";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireDataSubject } from "@/lib/data-access-guards";

const TEXT = {
  es: {
    title: "Nueva observación",
    intro:
      "Síntomas, sueño, energía, una sesión de acupuntura o notas libres. Se guarda como markdown en tu memoria.",
    date: "Fecha",
    entryTitle: "Título",
    titlePlaceholder: "Ej. Dolor de cabeza al despertar",
    content: "Contenido",
    contentPlaceholder:
      "Describe lo que has observado: intensidad, duración, contexto, lo que estabas haciendo...",
    tags: "Etiquetas (separadas por comas)",
    tagsPlaceholder: "dolor, sueño, mañana",
    save: "Guardar",
  },
  de: {
    title: "Neue Beobachtung",
    intro:
      "Symptome, Schlaf, Energie, eine Akupunktursitzung oder freie Notizen. Der Eintrag wird als Markdown in deinem Speicher abgelegt.",
    date: "Datum",
    entryTitle: "Titel",
    titlePlaceholder: "Z. B. Kopfschmerzen nach dem Aufwachen",
    content: "Inhalt",
    contentPlaceholder:
      "Beschreibe deine Beobachtung: Intensität, Dauer, Zusammenhang und was du gerade getan hast...",
    tags: "Schlagwörter (durch Kommas getrennt)",
    tagsPlaceholder: "Schmerz, Schlaf, Morgen",
    save: "Speichern",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

export default async function NewObservationPage() {
  await requireDataSubject("read");
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.intro}
        </p>
      </header>

      <form action={createObservationAction} className="space-y-4">
        <Field label={t.date}>
          <input
            type="date"
            name="observed_at"
            defaultValue={today}
            required
            className={inputCls}
          />
        </Field>

        <Field label={t.entryTitle}>
          <input
            type="text"
            name="title"
            required
            maxLength={200}
            placeholder={t.titlePlaceholder}
            className={inputCls}
          />
        </Field>

        <Field label={t.content}>
          <textarea
            name="body"
            rows={8}
            required
            placeholder={t.contentPlaceholder}
            className={inputCls}
          />
        </Field>

        <Field label={t.tags}>
          <input
            type="text"
            name="tags"
            placeholder={t.tagsPlaceholder}
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {t.save}
        </button>
      </form>
    </div>
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
