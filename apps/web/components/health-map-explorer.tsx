"use client";

import { useMemo, useState } from "react";
import { LabTimeline } from "@/components/lab-timeline";
import { LabValueBand } from "@/components/lab-value-band";
import type { HealthMapModel } from "@/lib/health-map";
import type { Locale } from "@/lib/i18n";

type Perspective = "systems" | "latest" | "evolution";

export function HealthMapExplorer({
  model,
  locale,
}: {
  model: HealthMapModel;
  locale: Locale;
}) {
  const de = locale === "de";
  const [perspective, setPerspective] = useState<Perspective>("systems");
  const [selectedId, setSelectedId] = useState(model.markers[0]?.id ?? "");
  const visibleMarkers = useMemo(() => {
    if (perspective === "latest") {
      return model.markers.filter(
        (marker) => marker.latest.observedAt === model.latestObservedAt,
      );
    }
    if (perspective === "evolution") {
      return model.markers.filter((marker) => marker.series.points.length > 1);
    }
    return model.markers;
  }, [model, perspective]);
  const selected =
    visibleMarkers.find((marker) => marker.id === selectedId) ?? visibleMarkers[0];
  const perspectives: Array<{ id: Perspective; label: string }> = [
    { id: "systems", label: de ? "Bereiche" : "Territorios" },
    { id: "latest", label: de ? "Letzter Befund" : "Última analítica" },
    { id: "evolution", label: de ? "Verlauf" : "Evolución" },
  ];

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={de ? "Kartenperspektive" : "Perspectiva del mapa"}
      >
        {perspectives.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={perspective === item.id}
            onClick={() => setPerspective(item.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition motion-reduce:transition-none ${
              perspective === item.id
                ? "border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        {model.territories.map((territory, territoryIndex) => {
          const markers = visibleMarkers.filter(
            (marker) => marker.territoryId === territory.id,
          );
          if (markers.length === 0) return null;
          const shapes = [
            "rounded-[2.5rem_1.5rem_2.25rem_1.25rem]",
            "rounded-[1.5rem_2.75rem_1.25rem_2.25rem]",
            "rounded-[2rem_1.25rem_2.5rem_1.75rem]",
          ];
          return (
            <section
              key={territory.id}
              className={`${shapes[territoryIndex % shapes.length]} min-h-44 border border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-card)_88%,transparent)] p-4 sm:p-5`}
              aria-labelledby={`territory-${territory.id}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={`territory-${territory.id}`} className="font-medium">
                  {territory.label}
                </h2>
                <span className="text-xs text-[var(--color-muted)]">
                  {markers.length} {de ? "Werte" : "marcadores"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {markers.map((marker, index) => {
                  const active = marker.id === selected?.id;
                  const measurementCount = marker.series.points.length;
                  return (
                    <button
                      key={marker.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(marker.id)}
                      className={`group flex min-h-20 min-w-20 max-w-28 flex-col items-center justify-center rounded-full border px-3 py-2 text-center transition motion-reduce:transition-none ${
                        active
                          ? "border-[var(--color-foreground)] bg-[color-mix(in_oklch,var(--color-accent)_20%,var(--color-card))]"
                          : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]"
                      } ${index % 2 ? "sm:translate-y-2" : ""}`}
                    >
                      <span className="text-xs font-medium leading-tight">
                        {marker.label}
                      </span>
                      <span className="mt-1 text-[10px] text-[var(--color-muted)]">
                        {measurementCount} {de ? "Messungen" : "mediciones"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selected ? (
        <section
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-7"
          aria-label={selected.label}
          aria-live="polite"
        >
          {perspective === "evolution" ? (
            <LabTimeline
              displayName={selected.label}
              series={selected.series}
              locale={locale}
              sourceHref={(point) => `/memory/view/${encodeURI(point.sourcePath)}`}
            />
          ) : (
            <LabValueBand
              displayName={selected.label}
              value={selected.latest.value}
              unit={selected.latest.unitOriginal ?? selected.latest.unitUcum ?? ""}
              observedAt={selected.latest.observedAt}
              labName={selected.latest.labName}
              reference={selected.latest.reference}
              referenceOriginal={selected.latest.referenceOriginal}
              sourceHref={`/memory/view/${encodeURI(selected.latest.sourcePath)}`}
              locale={locale}
            />
          )}
        </section>
      ) : null}

      <p className="text-xs text-[var(--color-muted)]">
        {de
          ? "Nähe auf dieser Karte bedeutet gemeinsame Darstellung in einem Laborbereich, nicht Ursache, Diagnose oder individuelles Ziel. Unterschiedliche Einheiten werden nicht verbunden."
          : "La cercanía en este mapa significa que los marcadores se presentan dentro de un mismo panel, no causalidad, diagnóstico ni objetivo individual. Las unidades diferentes no se conectan."}
      </p>
    </div>
  );
}
