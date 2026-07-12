"use client";

import { useState } from "react";
import type { LabSeries, LabSeriesPoint } from "@/lib/lab-visualization";
import { buildMeasurementTracks } from "@/lib/lab-tracks";

export interface LabTimelineProps {
  displayName: string;
  series: LabSeries;
  locale?: "es" | "de";
  sourceHref?: (point: LabSeriesPoint) => string | undefined;
}

function formatNumber(value: number, locale: "es" | "de") {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string, locale: "es" | "de") {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function commonReference(points: readonly LabSeriesPoint[]) {
  if (points.length === 0) return null;
  const first = points[0].reference;
  if (!first || (first.low === null && first.high === null)) return null;
  const same = points.every(
    (point) =>
      point.reference?.low === first.low &&
      point.reference?.high === first.high &&
      point.reference?.unitUcum === first.unitUcum,
  );
  return same ? first : null;
}

function rangeText(point: LabSeriesPoint, locale: "es" | "de") {
  const range = point.reference;
  if (!range || (range.low === null && range.high === null)) return "—";
  const unit = range.unitUcum ?? point.unitUcum ?? point.unitOriginal ?? "";
  if (point.referenceOriginal) return `${point.referenceOriginal} ${unit}`;
  if (range.low !== null && range.high !== null) {
    return `${formatNumber(range.low, locale)}–${formatNumber(range.high, locale)} ${unit}`;
  }
  if (range.low !== null) return `≥ ${formatNumber(range.low, locale)} ${unit}`;
  return `≤ ${formatNumber(range.high as number, locale)} ${unit}`;
}

function pointKey(point: LabSeriesPoint) {
  return `${point.sourcePath}-${point.observedAt}`;
}

export function LabTimeline({ displayName, series, locale = "es", sourceHref }: LabTimelineProps) {
  const t = locale === "de"
    ? {
        insufficient: "Für einen Verlauf werden mindestens zwei Messungen benötigt.",
        partial: "Unterschiedliche Einheiten erscheinen in getrennten Spuren. Nur Werte mit derselben normalisierten Einheit werden verbunden.",
        reference: "Referenzbereich der Berichte",
        referenceLatest: "Referenzbereich des letzten Befunds; frühere Befunde nennen abweichende Bereiche",
        date: "Datum",
        value: "Wert",
        range: "Bereich des Berichts",
        laboratory: "Labor",
        source: "Quelle",
        open: "Öffnen",
      }
    : {
        insufficient: "Se necesitan al menos dos mediciones para mostrar una evolución.",
        partial: "Las unidades diferentes aparecen en carriles separados. Solo se conectan valores con la misma unidad normalizada.",
        reference: "Intervalo de los informes",
        referenceLatest: "Intervalo del informe más reciente; informes anteriores declaran intervalos distintos",
        date: "Fecha",
        value: "Valor",
        range: "Intervalo del informe",
        laboratory: "Laboratorio",
        source: "Origen",
        open: "Abrir",
      };
  const points = series.points;
  const tracks = buildMeasurementTracks(series);
  const comparable = series.comparability === "comparable";
  const unit = comparable ? points[0]?.unitUcum ?? points[0]?.unitOriginal ?? "" : "";
  const dates = points.map((point) => new Date(`${point.observedAt.slice(0, 10)}T12:00:00Z`).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateSpread = Math.max(maxDate - minDate, 1);

  // La franja de calma: el intervalo compartido por todos los informes o, si
  // difieren, el del informe más reciente — siempre rotulado como tal.
  const commonRange = comparable ? commonReference(points) : null;
  const latestReference = points.at(-1)?.reference ?? null;
  const hasLatestReference =
    latestReference !== null && (latestReference.low !== null || latestReference.high !== null);
  const bandRange = commonRange ?? (comparable && hasLatestReference ? latestReference : null);
  const bandFromLatest = commonRange === null && bandRange !== null;
  const bandSourcePoint = bandFromLatest ? points.at(-1) : points[0];

  const numericAnchors = comparable
    ? [
        ...points.map((point) => point.value),
        ...(bandRange?.low === null || bandRange?.low === undefined ? [] : [bandRange.low]),
        ...(bandRange?.high === null || bandRange?.high === undefined ? [] : [bandRange.high]),
      ]
    : [];
  const rawMin = numericAnchors.length ? Math.min(...numericAnchors) : 0;
  const rawMax = numericAnchors.length ? Math.max(...numericAnchors) : 1;
  const valueSpread = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.15, 1);
  const minValue = rawMin - valueSpread * 0.25;
  const maxValue = rawMax + valueSpread * 0.25;
  const x = (time: number) => 64 + ((time - minDate) / dateSpread) * 572;
  const y = (value: number) => 184 - ((value - minValue) / (maxValue - minValue)) * 128;
  const summary = comparable
    ? `${displayName}: ${points.length} mediciones comparables en ${unit}.`
    : `${displayName}: ${points.length} mediciones sin una línea de evolución comparable.`;

  // Selección: por defecto, la medición más reciente (la que tiene luz propia).
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const activeKey = selectedKey ?? (points.length > 0 ? pointKey(points[points.length - 1]) : null);
  const active = points.find((point) => pointKey(point) === activeKey) ?? null;
  const activeHref = active ? sourceHref?.(active) : undefined;

  /** Un punto del sendero: penumbra por defecto, esmeralda si es el reciente. */
  const renderPoint = (
    point: LabSeriesPoint,
    px: number,
    py: number,
    opts: { latest: boolean; delay: number; labelFloor: number },
  ) => {
    const key = pointKey(point);
    const isActive = key === activeKey;
    return (
      <g key={key} className="lab-mark-reveal" style={{ animationDelay: `${opts.delay}s` }}>
        {opts.latest && <circle cx={px} cy={py} r="13" fill="var(--chart-recent-glow)" />}
        {isActive && (
          <circle
            cx={px}
            cy={py}
            r="10"
            fill="none"
            stroke="var(--chart-recent)"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
        )}
        <circle
          cx={px}
          cy={py}
          r={opts.latest ? 6.5 : 5}
          fill={opts.latest ? "var(--chart-recent)" : "var(--color-card)"}
          stroke={opts.latest ? "var(--color-card)" : "var(--chart-past)"}
          strokeWidth="2"
        />
        {opts.latest && (
          <text
            x={px}
            y={Math.max(opts.labelFloor, py - 18)}
            textAnchor="middle"
            fill="var(--color-foreground)"
            fontSize="13"
            fontWeight="500"
          >
            {formatNumber(point.value, locale)}
          </text>
        )}
        <circle
          cx={px}
          cy={py}
          r="16"
          fill="transparent"
          role="button"
          tabIndex={0}
          aria-label={`${point.observedAt.slice(0, 10)} · ${formatNumber(point.value, locale)} ${point.unitOriginal ?? point.unitUcum ?? ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => setSelectedKey(key)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelectedKey(key);
            }
          }}
        />
      </g>
    );
  };

  const revealDelay = (index: number, count: number) =>
    0.2 + (index / Math.max(count - 1, 1)) * 1.5;

  return (
    <figure className="space-y-4" aria-label={summary}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">{displayName}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {comparable ? `${points.length} · ${unit}` : t.partial}
          </p>
        </div>
        {points.length > 0 && (
          <p className="text-sm tabular-nums">
            {formatNumber(points.at(-1)!.value, locale)}{" "}
            <span className="text-[var(--color-muted)]">
              {points.at(-1)!.unitUcum ?? points.at(-1)!.unitOriginal ?? ""}
            </span>
          </p>
        )}
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t.insufficient}</p>
      ) : comparable ? (
        <svg viewBox="0 0 700 240" role="img" aria-label={summary} className="block h-auto w-full overflow-visible">
          <title>{displayName}</title>
          <desc>{summary}</desc>
          {bandRange && (
            <rect
              x="64"
              y={bandRange.high === null ? 48 : y(bandRange.high)}
              width="572"
              height={Math.max(
                2,
                (bandRange.low === null ? 200 : y(bandRange.low)) -
                  (bandRange.high === null ? 48 : y(bandRange.high)),
              )}
              rx="10"
              fill="var(--chart-band)"
            />
          )}
          <line x1="64" x2="636" y1="200" y2="200" stroke="var(--color-border)" strokeWidth="1" />
          <polyline
            className="lab-line-reveal"
            pathLength={1}
            points={points.map((point, index) => `${x(dates[index])},${y(point.value)}`).join(" ")}
            fill="none"
            stroke="var(--chart-past)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, index) =>
            renderPoint(point, x(dates[index]), y(point.value), {
              latest: index === points.length - 1,
              delay: revealDelay(index, points.length),
              labelFloor: 20,
            }),
          )}
          <text
            x={x(dates[0])}
            y="224"
            textAnchor="middle"
            fill="var(--color-muted)"
            fontSize="11"
          >
            {formatDate(points[0].observedAt, locale)}
          </text>
          {points.length > 1 && (
            <text
              x={x(dates[dates.length - 1])}
              y="224"
              textAnchor="middle"
              fill="var(--color-muted)"
              fontSize="11"
            >
              {formatDate(points[points.length - 1].observedAt, locale)}
            </text>
          )}
        </svg>
      ) : (
        <svg
          viewBox={`0 0 700 ${Math.max(150, tracks.length * 116 + 28)}`}
          role="img"
          aria-label={summary}
          className="block h-auto w-full overflow-visible"
        >
          <title>{displayName}</title>
          <desc>{summary}</desc>
          {tracks.map((track, trackIndex) => {
            const laneTop = 26 + trackIndex * 116;
            const laneBottom = laneTop + 72;
            const trackRange = commonReference(track.points);
            const anchors = [
              ...track.points.map((point) => point.value),
              ...(trackRange?.low === null || trackRange?.low === undefined ? [] : [trackRange.low]),
              ...(trackRange?.high === null || trackRange?.high === undefined ? [] : [trackRange.high]),
            ];
            const min = Math.min(...anchors);
            const max = Math.max(...anchors);
            const spread = Math.max(max - min, Math.abs(max) * 0.08, 1);
            const trackY = (value: number) =>
              laneBottom - 12 - ((value - min) / spread) * 44;
            const trackPoints = track.points.map((point) => {
              const time = new Date(`${point.observedAt.slice(0, 10)}T12:00:00Z`).getTime();
              return { point, px: x(time), py: trackY(point.value) };
            });
            const first = trackPoints[0];
            const last = trackPoints[trackPoints.length - 1];
            return (
              <g key={track.unitKey}>
                <text x="8" y={laneTop + 10} fill="var(--color-foreground)" fontSize="12">
                  {track.unitLabel}
                </text>
                {trackRange && (
                  <rect
                    x="64"
                    y={trackRange.high === null ? laneTop + 6 : trackY(trackRange.high)}
                    width="572"
                    height={Math.max(
                      2,
                      (trackRange.low === null ? laneBottom - 4 : trackY(trackRange.low)) -
                        (trackRange.high === null ? laneTop + 6 : trackY(trackRange.high)),
                    )}
                    rx="8"
                    fill="var(--chart-band)"
                  />
                )}
                <line
                  x1="64"
                  x2="636"
                  y1={laneBottom}
                  y2={laneBottom}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                {track.connectable ? (
                  <polyline
                    className="lab-line-reveal"
                    pathLength={1}
                    points={trackPoints.map(({ px, py }) => `${px},${py}`).join(" ")}
                    fill="none"
                    stroke="var(--chart-past)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {trackPoints.map(({ point, px, py }, index) =>
                  renderPoint(point, px, py, {
                    latest: index === trackPoints.length - 1,
                    delay: revealDelay(index, trackPoints.length),
                    labelFloor: laneTop + 12,
                  }),
                )}
                <text
                  x={first.px}
                  y={laneBottom + 17}
                  textAnchor="middle"
                  fill="var(--color-muted)"
                  fontSize="11"
                >
                  {formatDate(first.point.observedAt, locale)}
                </text>
                {trackPoints.length > 1 && (
                  <text
                    x={last.px}
                    y={laneBottom + 17}
                    textAnchor="middle"
                    fill="var(--color-muted)"
                    fontSize="11"
                  >
                    {formatDate(last.point.observedAt, locale)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {active && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-card)_75%,transparent)] px-4 py-2.5"
        >
          <span className="text-sm font-medium tabular-nums">
            {formatNumber(active.value, locale)} {active.unitOriginal ?? active.unitUcum ?? ""}
          </span>
          <span className="text-xs text-[var(--color-muted)]">{active.observedAt.slice(0, 10)}</span>
          <span className="text-xs text-[var(--color-muted)]">{rangeText(active, locale)}</span>
          {active.labName ? (
            <span className="text-xs text-[var(--color-muted)]">{active.labName}</span>
          ) : null}
          {activeHref ? (
            <a href={activeHref} className="text-xs underline hover:text-[var(--color-foreground)]">
              {t.open}
            </a>
          ) : null}
        </div>
      )}

      {bandRange && comparable && (
        <p className="text-xs text-[var(--color-muted)]">
          {bandFromLatest ? t.referenceLatest : t.reference}: {bandSourcePoint?.referenceOriginal
            ? `${bandSourcePoint.referenceOriginal} ${unit}`
            : `${bandRange.low === null ? "" : `${formatNumber(bandRange.low, locale)}–`}${bandRange.high === null ? "" : formatNumber(bandRange.high, locale)} ${unit}`}.
        </p>
      )}

      {points.length > 0 && (
        <>
          <ul className="space-y-2 text-xs sm:hidden">
            {points.map((point) => {
              const href = sourceHref?.(point);
              return (
                <li key={`${point.sourcePath}-mobile`} className="border-b border-[var(--color-border)] pb-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{point.observedAt.slice(0, 10)}</span>
                    <span className="font-medium tabular-nums">
                      {formatNumber(point.value, locale)} {point.unitUcum ?? point.unitOriginal ?? ""}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--color-muted)]">
                    {rangeText(point, locale)}{point.labName ? ` · ${point.labName}` : ""}
                    {href ? <> · <a href={href} className="underline hover:text-[var(--color-foreground)]">{t.open}</a></> : null}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="hidden sm:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="text-[var(--color-muted)]">
              <tr>
                <th className="border-b border-[var(--color-border)] py-2 pr-3 font-medium">{t.date}</th>
                <th className="border-b border-[var(--color-border)] py-2 pr-3 font-medium">{t.value}</th>
                <th className="border-b border-[var(--color-border)] py-2 pr-3 font-medium">{t.range}</th>
                <th className="border-b border-[var(--color-border)] py-2 pr-3 font-medium">{t.laboratory}</th>
                {sourceHref && <th className="border-b border-[var(--color-border)] py-2 font-medium">{t.source}</th>}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => {
                const href = sourceHref?.(point);
                return (
                  <tr key={`${point.sourcePath}-table`}>
                    <td className="border-b border-[var(--color-border)] py-2 pr-3">{point.observedAt.slice(0, 10)}</td>
                    <td className="border-b border-[var(--color-border)] py-2 pr-3 tabular-nums">
                      {formatNumber(point.value, locale)} {point.unitUcum ?? point.unitOriginal ?? ""}
                    </td>
                    <td className="border-b border-[var(--color-border)] py-2 pr-3">{rangeText(point, locale)}</td>
                    <td className="border-b border-[var(--color-border)] py-2 pr-3">{point.labName ?? "—"}</td>
                    {sourceHref && (
                      <td className="border-b border-[var(--color-border)] py-2">
                        {href ? <a href={href} className="underline hover:text-[var(--color-foreground)]">{t.open}</a> : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </figure>
  );
}
