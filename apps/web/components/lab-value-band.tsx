export interface LabValueBandProps {
  displayName: string;
  value: number;
  unit: string;
  observedAt: string;
  labName?: string | null;
  reference?: { low: number | null; high: number | null } | null;
  referenceOriginal?: string | null;
  sourceHref?: string;
  locale?: "es" | "de";
}

function formatNumber(value: number, locale: "es" | "de") {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function LabValueBand({
  displayName,
  value,
  unit,
  observedAt,
  labName,
  reference,
  referenceOriginal,
  sourceHref,
  locale = "es",
}: LabValueBandProps) {
  const t = locale === "de"
    ? {
        reference: "Referenzbereich dieses Laborbefunds",
        noReference: "Kein strukturierter Referenzbereich verfügbar",
        measured: "Gemessener Wert",
        source: "Laborbefund öffnen",
      }
    : {
        reference: "Intervalo indicado en este informe",
        noReference: "No hay un intervalo estructurado disponible",
        measured: "Valor medido",
        source: "Abrir analítica de origen",
      };

  const low = reference?.low ?? null;
  const high = reference?.high ?? null;
  const hasRange = low !== null || high !== null;
  const anchors = [value, low, high].filter((v): v is number => v !== null);
  const rawMin = Math.min(...anchors);
  const rawMax = Math.max(...anchors);
  const spread = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.25, 1);
  const domainMin = Math.min(0, rawMin - spread * 0.35);
  const domainMax = rawMax + spread * 0.35;
  const x = (n: number) => 48 + ((n - domainMin) / (domainMax - domainMin)) * 604;
  const pointX = x(value);
  const bandStart = low === null ? 48 : x(low);
  const bandEnd = high === null ? 652 : x(high);
  const rangeText = referenceOriginal
    ? `${referenceOriginal} ${unit}`
    : hasRange
      ? low !== null && high !== null
      ? `${formatNumber(low, locale)}–${formatNumber(high, locale)} ${unit}`
      : low !== null
        ? `≥ ${formatNumber(low, locale)} ${unit}`
        : `≤ ${formatNumber(high as number, locale)} ${unit}`
      : t.noReference;
  const description = `${displayName}: ${formatNumber(value, locale)} ${unit}, ${observedAt}. ${rangeText}.`;

  return (
    <figure className="space-y-3" aria-label={description}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">{displayName}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {observedAt}{labName ? ` · ${labName}` : ""}
          </p>
        </div>
        <p className="text-xl font-medium tabular-nums">
          {formatNumber(value, locale)} <span className="text-sm text-[var(--color-muted)]">{unit}</span>
        </p>
      </div>

      <svg
        viewBox="0 0 700 128"
        role="img"
        aria-label={description}
        className="block h-auto w-full overflow-visible"
      >
        <title>{displayName}</title>
        <desc>{description}</desc>
        <line x1="48" x2="652" y1="64" y2="64" stroke="var(--color-border)" strokeWidth="2" />
        {hasRange && (
          <rect
            x={bandStart}
            y="48"
            width={Math.max(2, bandEnd - bandStart)}
            height="32"
            rx="16"
            fill="var(--chart-band)"
            stroke="var(--chart-band-edge)"
          />
        )}
        <g className="lab-mark-reveal" style={{ animationDelay: "0.2s" }}>
          <line
            x1={pointX}
            x2={pointX}
            y1="30"
            y2="92"
            stroke="var(--chart-recent)"
            strokeWidth="2"
          />
          <circle cx={pointX} cy="64" r="13" fill="var(--chart-recent-glow)" />
          <circle
            cx={pointX}
            cy="64"
            r="7"
            fill="var(--chart-recent)"
            stroke="var(--color-card)"
            strokeWidth="2.5"
          />
        </g>
        <text className="hidden sm:block" x={pointX} y="20" textAnchor="middle" fill="var(--color-foreground)" fontSize="13">
          {formatNumber(value, locale)} {unit}
        </text>
        {hasRange && low !== null && (
          <text className="hidden sm:block" x={bandStart} y="108" textAnchor="middle" fill="var(--color-muted)" fontSize="12">
            {formatNumber(low, locale)}
          </text>
        )}
        {hasRange && high !== null && (
          <text className="hidden sm:block" x={bandEnd} y="108" textAnchor="middle" fill="var(--color-muted)" fontSize="12">
            {formatNumber(high, locale)}
          </text>
        )}
      </svg>

      <figcaption className="flex flex-wrap items-start justify-between gap-2 text-xs text-[var(--color-muted)]">
        <span><span className="text-[var(--color-foreground)]">{t.measured}.</span> {hasRange ? `${t.reference}: ${rangeText}.` : rangeText}</span>
        {sourceHref && <a href={sourceHref} className="underline hover:text-[var(--color-foreground)]">{t.source}</a>}
      </figcaption>
    </figure>
  );
}
