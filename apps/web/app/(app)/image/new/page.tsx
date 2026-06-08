import { createImageObservationAction } from "./actions";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";

const TEXT = {
  es: {
    title: "Nueva imagen",
    intro:
      "Se cifra al subirse. No se aplica análisis automático: solo se almacena y queda asociada a tu descripción.",
    file: "Archivo (PNG / JPG / WEBP, máx. 10 MB)",
    date: "Fecha",
    category: "Categoría",
    description: "Descripción",
    descriptionPlaceholder: "Lo que ves o lo que motivó la foto. Sé concreto.",
    tags: "Etiquetas (separadas por comas)",
    save: "Guardar imagen",
    categories: {
      iridology: "Iridología",
      "tongue-tcm": "Lengua (MTC)",
      skin: "Piel",
      wound: "Herida / lesión",
      other: "Otro",
    },
  },
  de: {
    title: "Neues Bild",
    intro:
      "Das Bild wird beim Hochladen verschlüsselt. Es findet keine automatische Analyse statt; gespeichert werden nur das Bild und deine Beschreibung.",
    file: "Datei (PNG / JPG / WEBP, max. 10 MB)",
    date: "Datum",
    category: "Kategorie",
    description: "Beschreibung",
    descriptionPlaceholder: "Was ist zu sehen oder warum hast du das Foto aufgenommen?",
    tags: "Schlagwörter (durch Kommas getrennt)",
    save: "Bild speichern",
    categories: {
      iridology: "Iridologie",
      "tongue-tcm": "Zunge (TCM)",
      skin: "Haut",
      wound: "Wunde / Verletzung",
      other: "Sonstiges",
    },
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

export default async function NewImagePage() {
  await requireSubscribedUserId();
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

      <form
        action={createImageObservationAction}
        encType="multipart/form-data"
        className="space-y-4"
      >
        <Field label={t.file}>
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.date}>
            <input
              type="date"
              name="observed_at"
              defaultValue={today}
              required
              className={inputCls}
            />
          </Field>
          <Field label={t.category}>
            <select name="category" defaultValue="iridology" className={inputCls}>
              {Object.entries(t.categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t.description}>
          <textarea
            name="description"
            rows={6}
            required
            placeholder={t.descriptionPlaceholder}
            className={inputCls}
          />
        </Field>

        <Field label={t.tags}>
          <input type="text" name="tags" className={inputCls} />
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
