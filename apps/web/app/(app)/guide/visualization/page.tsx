import type { Metadata } from "next";
import { LabValueBand } from "@/components/lab-value-band";
import { LabTimeline } from "@/components/lab-timeline";
import { getLocale } from "@/lib/locale";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { buildLabSeries } from "@/lib/lab-visualization";

export const metadata: Metadata = { title: "Visualización de analíticas" };

export default async function VisualizationPrototypePage() {
  await requireSubscribedUserId();
  const locale = await getLocale();
  const de = locale === "de";
  const syntheticSeries = buildLabSeries(
    [
      {
        relPath: "synthetic/2025-10.md",
        frontmatter: {
          type: "lab_result",
          observed_at: "2025-10-14",
          lab_name: "Labor Beispiel",
          markers: [{ name: "LDL", value: 151, unit: "mg/dL", reference_range: "< 116", flag: "high" }],
        },
      },
      {
        relPath: "synthetic/2026-01.md",
        frontmatter: {
          type: "lab_result",
          observed_at: "2026-01-22",
          lab_name: "Labor Beispiel",
          markers: [{ name: "LDL", value: 145, unit: "mg/dL", reference_range: "< 116", flag: "high" }],
        },
      },
      {
        relPath: "synthetic/2026-05.md",
        frontmatter: {
          type: "lab_result",
          observed_at: "2026-05-12",
          lab_name: "Labor Beispiel",
          markers: [{ name: "LDL", value: 139, unit: "mg/dL", reference_range: "< 116", flag: "high" }],
        },
      },
    ],
    "colesterol-ldl",
  );
  return (
    <div className="max-w-2xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
          {de ? "Interner Prototyp · synthetische Daten" : "Prototipo interno · datos sintéticos"}
        </p>
        <h1 className="text-2xl font-semibold">
          {de ? "Ein Messwert in seinem Kontext" : "Una medición en su contexto"}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {de
            ? "Die Fläche beschreibt den Referenzbereich des Berichts; sie ist weder Ziel noch Diagnose."
            : "La franja describe el intervalo del informe; no es un objetivo ni un diagnóstico."}
        </p>
      </header>
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7">
        <LabValueBand
          displayName={de ? "LDL-Cholesterin" : "Colesterol LDL"}
          value={139}
          unit="mg/dL"
          observedAt="2026-05-12"
          labName="Labor Beispiel"
          reference={{ low: null, high: 116 }}
          locale={locale}
        />
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">{de ? "Zeitlicher Pfad" : "Sendero temporal"}</h2>
          <p className="text-sm text-[var(--color-muted)]">
            {de
              ? "Nur Messungen mit derselben normalisierten Einheit werden verbunden."
              : "Solo se conectan mediciones con la misma unidad normalizada."}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7">
          <LabTimeline
            displayName={de ? "LDL-Cholesterin" : "Colesterol LDL"}
            series={syntheticSeries}
            locale={locale}
          />
        </div>
      </section>
    </div>
  );
}
