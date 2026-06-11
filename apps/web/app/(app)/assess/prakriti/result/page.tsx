import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { assessmentsEnabled } from "@/lib/flags";
import { DOSHAS } from "@/lib/prakriti";

const TEXT = {
  es: {
    metadata: "Tu constitución",
    title: "Tu constitución",
    profile: "Perfil",
    doshas: { vata: "Vāta", pitta: "Pitta", kapha: "Kapha" },
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
  await requireSubscribedUserId();
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  const percentages = {
    vata: clampPct(sp.v),
    pitta: clampPct(sp.p),
    kapha: clampPct(sp.k),
  };
  const type = sp.t ? decodeURIComponent(sp.t) : "—";

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
              />
            </div>
          </div>
        ))}
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
