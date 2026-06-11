import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { assessmentsEnabled } from "@/lib/flags";

const TEXT = {
  es: {
    title: "Cuestionarios",
    intro:
      "Responde un cuestionario y guarda el resultado en tu memoria para seguir su evolución. PHQ-9 y GAD-7 son escalas clínicas validadas; el de constitución es un retrato tradicional del Ayurveda, no un diagnóstico.",
    instruments: [
      {
        slug: "phq-9",
        title: "PHQ-9",
        description: "Escala clínica validada — depresión. 9 ítems, 5 min.",
      },
      {
        slug: "gad-7",
        title: "GAD-7",
        description: "Escala clínica validada — ansiedad generalizada. 7 ítems, 4 min.",
      },
      {
        slug: "prakriti",
        title: "Constitución (Ayurveda)",
        description:
          "Explora tu perfil Vāta · Pitta · Kapha. Tradición, no diagnóstico. 20 preguntas, 6–8 min.",
      },
    ],
  },
  de: {
    title: "Fragebögen",
    intro:
      "Beantworte einen Fragebogen und lege das Ergebnis in deinem Speicher ab, um den Verlauf zu verfolgen. PHQ-9 und GAD-7 sind validierte klinische Skalen; der Konstitutionsfragebogen ist ein traditionelles Selbstbild des Ayurveda, keine Diagnose.",
    instruments: [
      {
        slug: "phq-9",
        title: "PHQ-9",
        description: "Validierte klinische Skala — Depression. 9 Fragen, etwa 5 Minuten.",
      },
      {
        slug: "gad-7",
        title: "GAD-7",
        description: "Validierte klinische Skala — generalisierte Angst. 7 Fragen, etwa 4 Minuten.",
      },
      {
        slug: "prakriti",
        title: "Konstitution (Ayurveda)",
        description:
          "Erkunde dein Vāta- · Pitta- · Kapha-Profil. Tradition, keine Diagnose. 20 Fragen, etwa 6–8 Minuten.",
      },
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

export default async function AssessLandingPage() {
  if (!assessmentsEnabled()) notFound();
  await requireSubscribedUserId();
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
