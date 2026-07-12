import Link from "next/link";
import type { Metadata } from "next";
import { HealthMapExplorer } from "@/components/health-map-explorer";
import { buildHealthMapModel } from "@/lib/health-map";
import { getLabSeriesSet } from "@/lib/memory-reader";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: localize(locale, {
      es: "Mapa de salud",
      de: "Gesundheitskarte",
    }),
  };
}

export default async function HealthMapPage({
  searchParams,
}: {
  searchParams: Promise<{ marker?: string }>;
}) {
  noStore();
  const userId = await requireSubscribedUserId();
  const locale = await getLocale();
  const { marker } = await searchParams;
  const series = await getLabSeriesSet(userId);
  const model = buildHealthMapModel(series, locale);
  const de = locale === "de";

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
          {de ? "Privater Speicher · strukturierte Werte" : "Memoria privada · valores estructurados"}
        </p>
        <h1 className="text-3xl font-semibold vital-reveal-text">
          {de ? "Deine Gesundheitskarte" : "Tu mapa de salud"}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted)]">
          {de
            ? "Erkunde deine Laborwerte nach Bereich, letztem Befund oder zeitlichem Verlauf. Die Karte wird deterministisch aus deinen bestätigten Daten erzeugt; ein Sprachmodell setzt keine Messwerte."
            : "Explora tus analíticas por territorio, última fecha o evolución. El mapa se genera de forma determinista desde tus datos confirmados; ningún modelo de lenguaje coloca los valores."}
        </p>
        {model.latestObservedAt ? (
          <p className="text-xs text-[var(--color-muted)]">
            {de ? "Letzter Befund" : "Última analítica"}: {model.latestObservedAt.slice(0, 10)} · {model.reportCount} {de ? "Befunde" : "informes"}
          </p>
        ) : null}
      </header>

      {model.markers.length > 0 ? (
        <HealthMapExplorer model={model} locale={locale} initialMarkerId={marker} />
      ) : (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <p className="text-sm">
            {de
              ? "Es gibt noch keine bestätigten strukturierten Laborwerte für die Karte."
              : "Todavía no hay valores estructurados confirmados para construir el mapa."}
          </p>
          <Link href="/upload" className="mt-3 inline-block text-sm underline">
            {de ? "Laborbefund hinzufügen" : "Añadir una analítica"} →
          </Link>
        </section>
      )}
    </div>
  );
}
