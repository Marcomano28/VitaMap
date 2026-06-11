import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize, type Locale } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { assessmentsEnabled } from "@/lib/flags";

const TEXT = {
  es: {
    metadata: "Resultado",
    result: "Resultado",
    score: "Puntuación",
    band: "Banda orientativa",
    bands: {
      minimal: "mínima",
      mild: "leve",
      moderate: "moderada",
      moderatelySevere: "moderadamente severa",
      severe: "severa",
    },
    explanation:
      "El resultado se ha guardado en tu memoria como una observación. La puntuación aislada tiene valor limitado; lo útil es ver su evolución y conversarlo con un profesional cuando corresponda.",
    support:
      "En la pregunta 9 has señalado pensamientos de hacerte daño o de estar mejor sin estar aquí. Si te preocupan o existe un peligro inmediato, busca ayuda ahora.",
    supportNumbers:
      "En Alemania: TelefonSeelsorge 116 123, 0800 1110111 o 0800 1110222. En una emergencia inmediata, llama al 112.",
    memory: "Ver mi memoria",
    another: "Otro cuestionario",
  },
  de: {
    metadata: "Ergebnis",
    result: "Ergebnis",
    score: "Punktzahl",
    band: "Orientierungsbereich",
    bands: {
      minimal: "minimal",
      mild: "leicht",
      moderate: "mittelgradig",
      moderatelySevere: "mittelschwer bis schwer",
      severe: "schwer",
    },
    explanation:
      "Das Ergebnis wurde als Beobachtung in deinem Speicher abgelegt. Ein einzelner Wert ist nur begrenzt aussagekräftig; sinnvoller sind der Verlauf und ein Gespräch mit medizinischem Fachpersonal.",
    support:
      "Bei Frage 9 hast du Gedanken angegeben, lieber tot zu sein oder dir Leid zuzufügen. Wenn dich diese Gedanken belasten oder unmittelbare Gefahr besteht, hole dir jetzt Unterstützung.",
    supportNumbers:
      "In Deutschland erreichst du die TelefonSeelsorge unter 116 123, 0800 1110111 oder 0800 1110222. In einer akuten Notlage rufe 112 an.",
    memory: "Meinen Speicher ansehen",
    another: "Weiterer Fragebogen",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

interface PageProps {
  params: Promise<{ instrument: string }>;
  searchParams: Promise<{ score?: string; q9?: string }>;
}

function phq9Band(score: number, locale: Locale) {
  const bands = localize(locale, TEXT).bands;
  if (score <= 4) return bands.minimal;
  if (score <= 9) return bands.mild;
  if (score <= 14) return bands.moderate;
  if (score <= 19) return bands.moderatelySevere;
  return bands.severe;
}

function gad7Band(score: number, locale: Locale) {
  const bands = localize(locale, TEXT).bands;
  if (score <= 4) return bands.minimal;
  if (score <= 9) return bands.mild;
  if (score <= 14) return bands.moderate;
  return bands.severe;
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  if (!assessmentsEnabled()) notFound();
  await requireSubscribedUserId();
  const { instrument } = await params;
  const sp = await searchParams;
  const score = Number(sp.score ?? "0");
  const q9 = Number(sp.q9 ?? "0");
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  const cfg =
    instrument === "phq-9"
      ? { label: "PHQ-9", max: 27, band: phq9Band(score, locale) }
      : instrument === "gad-7"
        ? { label: "GAD-7", max: 21, band: gad7Band(score, locale) }
        : null;
  if (!cfg) notFound();

  const showSupportNote = instrument === "phq-9" && q9 > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.result} {cfg.label}</h1>
      </header>

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-2">
        <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
          {t.score}
        </p>
        <p className="text-4xl font-semibold">
          {score} <span className="text-base text-[var(--color-muted)]">/ {cfg.max}</span>
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          {t.band}: <strong>{cfg.band}</strong>.
        </p>
      </section>

      <p className="text-sm">
        {t.explanation}
      </p>

      {showSupportNote && (
        <section className="rounded-md border-l-4 border-[var(--color-warning)] bg-[var(--color-card)] p-4 text-sm">
          <p>
            {t.support}
          </p>
          <p className="mt-2">
            {t.supportNumbers}
          </p>
        </section>
      )}

      <div className="flex gap-3">
        <Link
          href="/memory"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
        >
          {t.memory}
        </Link>
        <Link
          href="/assess"
          className="text-sm self-center text-[var(--color-muted)] hover:underline"
        >
          {t.another}
        </Link>
      </div>
    </div>
  );
}
