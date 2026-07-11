import type { LabSeries, LabSeriesPoint } from "@/lib/lab-visualization";

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
  if (range.low !== null && range.high !== null) {
    return `${formatNumber(range.low, locale)}–${formatNumber(range.high, locale)} ${unit}`;
  }
  if (range.low !== null) return `≥ ${formatNumber(range.low, locale)} ${unit}`;
  return `≤ ${formatNumber(range.high as number, locale)} ${unit}`;
}

export function LabTimeline({ displayName, series, locale = "es", sourceHref }: LabTimelineProps) {
  const t = locale === "de"
    ? {
        insufficient: "Für einen Verlauf werden mindestens zwei Messungen benötigt.",
        partial: "Die Messungen verwenden unterschiedliche oder nicht normalisierte Einheiten. Sie werden nicht als Verlaufslinie verbunden.",
        reference: "Referenzbereich der Berichte",
        date: "Datum",
        value: "Wert",
        range: "Bereich des Berichts",
        laboratory: "Labor",
        source: "Quelle",
        open: "Öffnen",
      }
    : {
        insufficient: "Se necesitan al menos dos mediciones para mostrar una evolución.",
        partial: "Las mediciones utilizan unidades diferentes o no normalizadas. No se conectan como una línea de evolución.",
        reference: "Intervalo de los informes",
        date: "Fecha",
        value: "Valor",
        range: "Intervalo del informe",
        laboratory: "Laboratorio",
        source: "Origen",
        open: "Abrir",
      };
  const points = series.points;
  const comparable = series.comparability === "comparable";
  const unit = comparable ? points[0]?.unitUcum ?? points[0]?.unitOriginal ?? "" : "";
  const dates = points.map((point) => new Date(`${point.observedAt.slice(0, 10)}T12:00:00Z`).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateSpread = Math.max(maxDate - minDate, 1);
  const commonRange = comparable ? commonReference(points) : null;
  const numericAnchors = comparable
    ? [
        ...points.map((point) => point.value),
        ...(commonRange?.low === null || commonRange?.low === undefined ? [] : [commonRange.low]),
        ...(commonRange?.high === null || commonRange?.high === undefined ? [] : [commonRange.high]),
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
          {commonRange && (
            <rect
              x="64"
              y={commonRange.high === null ? 48 : y(commonRange.high)}
              width="572"
              height={Math.max(
                2,
                (commonRange.low === null ? 200 : y(commonRange.low)) -
                  (commonRange.high === null ? 48 : y(commonRange.high)),
              )}
              rx="10"
              fill="color-mix(in oklch, var(--color-accent) 12%, transparent)"
            />
          )}
          <line x1="64" x2="636" y1="200" y2="200" stroke="var(--color-border)" strokeWidth="1" />
          <polyline
            points={points.map((point, index) => `${x(dates[index])},${y(point.value)}`).join(" ")}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, index) => {
            const px = x(dates[index]);
            const py = y(point.value);
            const latest = index === points.length - 1;
            return (
              <g key={`${point.sourcePath}-${point.observedAt}`}>
                <circle
                  cx={px}
                  cy={py}
                  r={latest ? 7 : 5}
                  fill="var(--color-card)"
                  stroke={latest ? "var(--color-foreground)" : "var(--color-accent)"}
                  strokeWidth={latest ? 3 : 2}
                />
                <text className="hidden sm:block" x={px} y={Math.max(18, py - 14)} textAnchor="middle" fill="var(--color-foreground)" fontSize="12">
                  {formatNumber(point.value, locale)}
                </text>
                <text className="hidden sm:block" x={px} y="222" textAnchor="middle" fill="var(--color-muted)" fontSize="11">
                  {formatDate(point.observedAt, locale)}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <svg viewBox="0 0 700 150" role="img" aria-label={summary} className="block h-auto w-full overflow-visible">
          <title>{displayName}</title>
          <desc>{summary}</desc>
          <line x1="64" x2="636" y1="72" y2="72" stroke="var(--color-border)" strokeWidth="1" />
          {points.map((point, index) => {
            const px = x(dates[index]);
            return (
              <g key={`${point.sourcePath}-${point.observedAt}`}>
                <circle cx={px} cy="72" r="6" fill="var(--color-card)" stroke="var(--color-foreground)" strokeWidth="2" />
                <text className="hidden sm:block" x={px} y="44" textAnchor="middle" fill="var(--color-foreground)" fontSize="12">
                  {formatNumber(point.value, locale)} {point.unitOriginal ?? point.unitUcum ?? ""}
                </text>
                <text className="hidden sm:block" x={px} y="106" textAnchor="middle" fill="var(--color-muted)" fontSize="11">
                  {formatDate(point.observedAt, locale)}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {commonRange && (
        <p className="text-xs text-[var(--color-muted)]">
          {t.reference}: {commonRange.low === null ? "" : `${formatNumber(commonRange.low, locale)}–`}
          {commonRange.high === null ? "" : formatNumber(commonRange.high, locale)} {unit}.
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
