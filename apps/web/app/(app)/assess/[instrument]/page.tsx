import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { saveAssessmentAction } from "./actions";
import { getLocale } from "@/lib/locale";
import { localize, type Locale } from "@/lib/i18n";

const TEXT = {
  es: {
    metadata: "Cuestionario",
    period:
      "En las últimas 2 semanas, ¿con qué frecuencia te ha molestado cada uno de los siguientes problemas?",
    date: "Fecha",
    notes: "Notas (opcional)",
    notesPlaceholder:
      "Contexto que quieras recordar (estrés en el trabajo, dormir mal esta semana, etc.)",
    save: "Guardar en mi memoria",
    options: ["Ningún día", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    phqIntro: "Cuestionario estandarizado de cribado de depresión.",
    gadIntro: "Cuestionario estandarizado de cribado de ansiedad generalizada.",
    phq: [
      "Poco interés o placer en hacer las cosas",
      "Sentirse desanimado/a, deprimido/a o sin esperanza",
      "Dificultad para dormir, mantener el sueño o dormir demasiado",
      "Sentirse cansado/a o con poca energía",
      "Poco apetito o comer en exceso",
      "Sentirse mal consigo mismo/a o sentir que ha decepcionado a su familia",
      "Dificultad para concentrarse, por ejemplo al leer o ver la televisión",
      "Moverse o hablar muy despacio, o estar mucho más inquieto/a de lo habitual",
      "Pensamientos de estar mejor muerto/a o de hacerse daño",
    ],
    gad: [
      "Sentirse nervioso/a, ansioso/a o muy alterado/a",
      "No ser capaz de parar o controlar la preocupación",
      "Preocuparse demasiado por diferentes cosas",
      "Tener dificultad para relajarse",
      "Estar tan inquieto/a que es difícil quedarse quieto/a",
      "Volverse fácilmente molesto/a o irritable",
      "Sentir miedo como si algo terrible pudiera pasar",
    ],
  },
  de: {
    metadata: "Fragebogen",
    period:
      "Wie oft haben dich die folgenden Beschwerden in den letzten 2 Wochen beeinträchtigt?",
    date: "Datum",
    notes: "Notizen (optional)",
    notesPlaceholder:
      "Zusammenhang, den du festhalten möchtest, etwa Arbeitsstress oder schlechter Schlaf.",
    save: "In meinem Speicher ablegen",
    options: ["Überhaupt nicht", "An einzelnen Tagen", "An mehr als der Hälfte der Tage", "Beinahe jeden Tag"],
    phqIntro: "Standardisierter Fragebogen zu depressiven Beschwerden.",
    gadIntro: "Standardisierter Fragebogen zu generalisierten Angstbeschwerden.",
    phq: [
      "Wenig Interesse oder Freude an Tätigkeiten",
      "Niedergeschlagenheit, Schwermut oder Hoffnungslosigkeit",
      "Schwierigkeiten ein- oder durchzuschlafen oder vermehrter Schlaf",
      "Müdigkeit oder wenig Energie",
      "Verminderter Appetit oder übermäßiges Bedürfnis zu essen",
      "Schlechte Meinung von dir selbst oder das Gefühl, versagt zu haben",
      "Schwierigkeiten, dich zu konzentrieren, etwa beim Lesen oder Fernsehen",
      "So langsame Bewegungen oder Sprache, dass es anderen auffällt, oder ungewöhnliche Unruhe",
      "Gedanken, lieber tot zu sein oder dir Leid zuzufügen",
    ],
    gad: [
      "Nervosität, Ängstlichkeit oder Anspannung",
      "Nicht in der Lage sein, Sorgen zu stoppen oder zu kontrollieren",
      "Übermäßige Sorgen bezüglich verschiedener Angelegenheiten",
      "Schwierigkeiten, dich zu entspannen",
      "Rastlosigkeit, sodass Stillsitzen schwerfällt",
      "Schnelle Verärgerung oder Gereiztheit",
      "Gefühl der Angst, als könnte etwas Schlimmes passieren",
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

interface PageProps {
  params: Promise<{ instrument: string }>;
}

export default async function AssessmentForm({ params }: PageProps) {
  const { instrument: slug } = await params;
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const cfg = pickInstrument(slug, locale);
  if (!cfg) notFound();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{cfg.label}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {cfg.intro} {t.period}
        </p>
      </header>

      <form action={saveAssessmentAction} className="space-y-6">
        <input type="hidden" name="instrument" value={cfg.label} />

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
          {cfg.questions.map((q, idx) => (
            <li key={idx} className="space-y-2 border-l-2 border-[var(--color-border)] pl-4">
              <p className="text-sm font-medium">
                {idx + 1}. {q}
              </p>
              <div className="grid sm:grid-cols-4 gap-2">
                {t.options.map((label, value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded border border-[var(--color-border)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-card)]"
                  >
                    <input
                      type="radio"
                      name={`q${idx + 1}`}
                      value={value}
                      defaultChecked={value === 0}
                      required
                    />
                    <span>{label}</span>
                  </label>
                ))}
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
      </form>
    </div>
  );
}

function pickInstrument(slug: string, locale: Locale) {
  const t = localize(locale, TEXT);
  if (slug === "phq-9")
    return {
      label: "PHQ-9" as const,
      intro: t.phqIntro,
      questions: t.phq,
    };
  if (slug === "gad-7")
    return {
      label: "GAD-7" as const,
      intro: t.gadIntro,
      questions: t.gad,
    };
  return null;
}
