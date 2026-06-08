import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const TEXT = {
  es: {
    title: "Escalas validadas",
    intro:
      "Cuestionarios estandarizados que producen una puntuación comparable en el tiempo. Las respuestas se guardan en tu memoria.",
    instruments: [
      {
        slug: "phq-9",
        title: "PHQ-9",
        description: "Cuestionario de salud del paciente — depresión. 9 ítems, 5 min.",
      },
      {
        slug: "gad-7",
        title: "GAD-7",
        description: "Cuestionario de ansiedad generalizada. 7 ítems, 4 min.",
      },
    ],
  },
  de: {
    title: "Standardisierte Fragebögen",
    intro:
      "Standardisierte Fragebögen liefern Werte, die im Zeitverlauf vergleichbar sind. Deine Antworten werden in deinem Speicher abgelegt.",
    instruments: [
      {
        slug: "phq-9",
        title: "PHQ-9",
        description: "Gesundheitsfragebogen zu depressiven Beschwerden. 9 Fragen, etwa 5 Minuten.",
      },
      {
        slug: "gad-7",
        title: "GAD-7",
        description: "Fragebogen zu generalisierter Angst. 7 Fragen, etwa 4 Minuten.",
      },
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

export default async function AssessLandingPage() {
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.intro}
        </p>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3">
        {t.instruments.map((i) => (
          <li key={i.slug}>
            <Link
              href={`/assess/${i.slug}`}
              className="block rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-accent)] transition"
            >
              <p className="font-medium">{i.title}</p>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {i.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
