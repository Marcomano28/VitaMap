import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { savePrakritiAction } from "./actions";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { assessmentsEnabled } from "@/lib/flags";
import { getPrakritiItems, PROVENANCE } from "@/lib/prakriti";

const TEXT = {
  es: {
    metadata: "Constitución (Ayurveda)",
    title: "Tu constitución según el Ayurveda",
    intro:
      "Elige en cada pregunta la opción que mejor te describe de forma habitual, no solo cómo te sientes hoy. Si hay una segunda que también te representa, puedes indicarla. Al terminar verás tu perfil Vāta · Pitta · Kapha.",
    disclaimer:
      "Es un retrato tradicional para autoconocimiento, no un diagnóstico médico. No mide ni predice ningún valor de laboratorio.",
    date: "Fecha",
    notes: "Notas (opcional)",
    notesPlaceholder: "Cualquier matiz que quieras recordar.",
    save: "Guardar en mi memoria",
    secondaryQ: "¿También te reconoces en alguna de estas?",
    secondaryNone: "Solo la anterior",
    doshas: { vata: "Vāta", pitta: "Pitta", kapha: "Kapha" },
  },
  de: {
    metadata: "Konstitution (Ayurveda)",
    title: "Deine Konstitution nach dem Ayurveda",
    intro:
      "Wähle bei jeder Frage die Option, die dich gewöhnlich am besten beschreibt — nicht nur, wie du dich heute fühlst. Falls eine zweite auch zutrifft, kannst du sie angeben. Am Ende siehst du dein Vāta- · Pitta- · Kapha-Profil.",
    disclaimer:
      "Ein traditionelles Selbstbild zur Selbsterkenntnis, keine medizinische Diagnose. Es misst oder prognostiziert keinen Laborwert.",
    date: "Datum",
    notes: "Notizen (optional)",
    notesPlaceholder: "Jede Nuance, die du festhalten möchtest.",
    save: "In meinem Speicher ablegen",
    secondaryQ: "Erkennst du dich auch in einer dieser Beschreibungen?",
    secondaryNone: "Nur die obige",
    doshas: { vata: "Vāta", pitta: "Pitta", kapha: "Kapha" },
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

export default async function PrakritiForm() {
  if (!assessmentsEnabled()) notFound();
  await requireSubscribedUserId();
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const items = getPrakritiItems(locale);
  const provenance = localize(locale, PROVENANCE);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t.intro}</p>
        <p className="rounded-md border-l-4 border-[var(--color-accent)] bg-[var(--color-card)] px-3 py-2 text-sm">
          {t.disclaimer}
        </p>
      </header>

      <form action={savePrakritiAction} className="space-y-6">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {t.date}
          </label>
          <input
            type="date"
            name="observed_at"
            defaultValue={today}
            required
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-sm"
          />
        </div>

        <ol className="space-y-5">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="space-y-2 border-l-2 border-[var(--color-border)] pl-4"
            >
              <p className="text-sm font-medium">
                {idx + 1}. {item.prompt}
              </p>

              {/* Primary — obligatorio */}
              <div className="grid gap-2">
                {item.options.map((opt) => (
                  <label
                    key={opt.dosha}
                    className="flex items-center gap-2 rounded border border-[var(--color-border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-card)]"
                  >
                    <input
                      type="radio"
                      name={`q_${item.id}`}
                      value={opt.dosha}
                      required
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Secondary — opcional */}
              <div className="pl-2 border-l border-dashed border-[var(--color-border)] space-y-1 pt-1">
                <p className="text-xs text-[var(--color-muted)]">{t.secondaryQ}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <label className="flex items-center gap-1 text-xs text-[var(--color-muted)] cursor-pointer">
                    <input
                      type="radio"
                      name={`q_${item.id}_sec`}
                      value="none"
                      defaultChecked
                    />
                    {t.secondaryNone}
                  </label>
                  {(["vata", "pitta", "kapha"] as const).map((d) => (
                    <label key={d} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name={`q_${item.id}_sec`}
                        value={d}
                      />
                      {t.doshas[d]}
                    </label>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {t.notes}
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            placeholder={t.notesPlaceholder}
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {t.save}
        </button>

        <p className="text-xs text-[var(--color-muted)]">{provenance}</p>
      </form>
    </div>
  );
}
