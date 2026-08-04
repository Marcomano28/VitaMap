import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireDataSubject } from "@/lib/data-access-guards";
import { assessmentsEnabled } from "@/lib/flags";
import { DOSHAS } from "@/lib/prakriti";

const TEXT = {
  es: {
    metadata: "Tu constitución",
    title: "Tu constitución",
    profile: "Perfil",
    doshas: { vata: "Vāta", pitta: "Pitta", kapha: "Kapha" },
    interpretationTitle: "Cómo leer este resultado",
    interpretation:
      "Los porcentajes indican qué grupos de rasgos elegiste con más frecuencia. Un porcentaje mayor no significa que sea mejor ni peor.",
    balanced:
      "Los tres grupos aparecen con una presencia similar en tus respuestas.",
    paired:
      "Dos grupos aparecen con una presencia parecida y claramente mayor que el tercero.",
    dominant:
      "Un grupo de rasgos aparece con más frecuencia que los otros.",
    flexible:
      "Tómalo como una orientación para conocerte, no como una identidad fija. Tus hábitos, tu salud y tu contexto pueden influir en cómo respondes.",
    meaningsTitle: "Qué significan los nombres",
    meanings: {
      vata:
        "Movimiento y variabilidad: ritmo rápido, cambios, ligereza y sensibilidad al frío o la sequedad.",
      pitta:
        "Intensidad y transformación: energía enfocada, calor, apetito marcado y tendencia a la precisión.",
      kapha:
        "Estabilidad y resistencia: ritmo pausado, constancia, estructura sólida y preferencia por la calma.",
    },
    saved:
      "Tu perfil se ha guardado en tu memoria. Es un retrato según el Ayurveda, no un diagnóstico médico, y no mide ni predice ningún valor de laboratorio.",
    chat:
      "Si quieres, pregunta en el chat por la perspectiva ayurvédica de algún resultado tuyo; el asistente la presentará como tradición, junto a la información clínica.",
    memory: "Ver mi memoria",
    another: "Otro cuestionario",
  },
  de: {
    metadata: "Deine Konstitution",
    title: "Deine Konstitution",
    profile: "Profil",
    doshas: { vata: "Vāta", pitta: "Pitta", kapha: "Kapha" },
    interpretationTitle: "So liest du dieses Ergebnis",
    interpretation:
      "Die Prozentwerte zeigen, welche Merkmalsgruppen du am häufigsten gewählt hast. Ein höherer Wert ist weder besser noch schlechter.",
    balanced:
      "Alle drei Gruppen kommen in deinen Antworten ähnlich häufig vor.",
    paired:
      "Zwei Gruppen kommen ähnlich häufig und deutlich stärker als die dritte vor.",
    dominant:
      "Eine Merkmalsgruppe kommt häufiger als die anderen vor.",
    flexible:
      "Verstehe das Ergebnis als Orientierung zur Selbsterkenntnis, nicht als feste Identität. Gewohnheiten, Gesundheit und Lebensumstände können deine Antworten beeinflussen.",
    meaningsTitle: "Was die Namen bedeuten",
    meanings: {
      vata:
        "Bewegung und Veränderlichkeit: schnelles Tempo, Wechsel, Leichtigkeit und Empfindlichkeit gegenüber Kälte oder Trockenheit.",
      pitta:
        "Intensität und Umwandlung: fokussierte Energie, Wärme, deutlicher Appetit und eine Neigung zu Präzision.",
      kapha:
        "Stabilität und Ausdauer: ruhiges Tempo, Beständigkeit, kräftige Struktur und ein Bedürfnis nach Ruhe.",
    },
    saved:
      "Dein Profil wurde in deinem Speicher abgelegt. Es ist ein Selbstbild nach dem Ayurveda, keine medizinische Diagnose, und misst oder prognostiziert keinen Laborwert.",
    chat:
      "Frag im Chat gern nach der ayurvedischen Sichtweise zu einem deiner Werte; der Assistent stellt sie als Tradition neben die klinische Information.",
    memory: "Meinen Speicher ansehen",
    another: "Weiterer Fragebogen",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

interface PageProps {
  searchParams: Promise<{ v?: string; p?: string; k?: string; t?: string }>;
}

function clampPct(s: string | undefined): number {
  const n = Number(s ?? "0");
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
}

export default async function PrakritiResultPage({ searchParams }: PageProps) {
  if (!assessmentsEnabled()) notFound();
  await requireDataSubject("read");
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  const percentages = {
    vata: clampPct(sp.v),
    pitta: clampPct(sp.p),
    kapha: clampPct(sp.k),
  };
  const type = sp.t ? decodeURIComponent(sp.t) : "—";
  const ranked = [...DOSHAS].sort(
    (a, b) =>
      percentages[b] - percentages[a] || DOSHAS.indexOf(a) - DOSHAS.indexOf(b),
  );
  const spread = percentages[ranked[0]] - percentages[ranked[2]];
  const lead = percentages[ranked[0]] - percentages[ranked[1]];
  const interpretation = spread <= 15 ? t.balanced : lead <= 10 ? t.paired : t.dominant;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-3xl font-semibold">{type}</p>
      </header>

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-3">
        <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
          {t.profile}
        </p>
        {DOSHAS.map((d) => (
          <div key={d} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{t.doshas[d]}</span>
              <span className="text-[var(--color-muted)]">
                {percentages[d]}%
              </span>
            </div>
            <div className="h-2 rounded bg-[var(--color-background)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)]"
                style={{ width: `${percentages[d]}%` }}
                role="progressbar"
                aria-label={`${t.doshas[d]} ${percentages[d]}%`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentages[d]}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t.interpretationTitle}</h2>
        <p className="text-sm">{t.interpretation}</p>
        <p className="text-sm font-medium">{interpretation}</p>
        <p className="text-sm text-[var(--color-muted)]">{t.flexible}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.meaningsTitle}</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          {DOSHAS.map((d) => (
            <div
              key={d}
              className="rounded-md border border-[var(--color-border)] p-3"
            >
              <dt className="font-medium">{t.doshas[d]}</dt>
              <dd className="mt-1 text-sm text-[var(--color-muted)]">
                {t.meanings[d]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-sm">{t.saved}</p>
      <p className="text-sm text-[var(--color-muted)]">{t.chat}</p>

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
