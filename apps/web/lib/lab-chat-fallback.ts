import type { Locale } from "./i18n";
import type { LabSeries, LabSeriesPoint } from "./lab-visualization";

function markerLabel(markerId: string): string {
  return markerId
    .split("-")
    .map((part) =>
      ["ldl", "hdl", "tsh", "pcr", "hba1c"].includes(part)
        ? part.toUpperCase()
        : part,
    )
    .join(" ");
}

function number(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "es-ES", {
    maximumFractionDigits: 4,
  }).format(value);
}

function date(value: string, locale: Locale): string {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "es-ES", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsed);
}

function referenceText(point: LabSeriesPoint, locale: Locale): string | null {
  const reference = point.reference;
  const unit = point.unitOriginal ?? reference?.unitUcum;
  if (!reference || !unit) return null;
  if (reference.low !== null && reference.high !== null) {
    return `${number(reference.low, locale)}–${number(reference.high, locale)} ${unit}`;
  }
  if (reference.high !== null) return `< ${number(reference.high, locale)} ${unit}`;
  if (reference.low !== null) return `> ${number(reference.low, locale)} ${unit}`;
  return null;
}

function positionText(point: LabSeriesPoint, locale: Locale): string | null {
  const reference = point.reference;
  if (!reference) return null;
  if (reference.high !== null && point.value > reference.high) {
    return locale === "de"
      ? "Der Wert liegt über der im Befund angegebenen Obergrenze."
      : "El valor queda por encima del límite superior indicado en ese informe.";
  }
  if (reference.low !== null && point.value < reference.low) {
    return locale === "de"
      ? "Der Wert liegt unter der im Befund angegebenen Untergrenze."
      : "El valor queda por debajo del límite inferior indicado en ese informe.";
  }
  return locale === "de"
    ? "Der Wert liegt innerhalb des in diesem Befund angegebenen Referenzbereichs."
    : "El valor queda dentro del intervalo de referencia indicado en ese informe.";
}

/** Respuesta factual desde el mismo dato estructurado usado por la gráfica. */
export function buildLabMarkerAnswer(
  series: LabSeries,
  locale: Locale,
  latestOnly = false,
): string | null {
  const selected = latestOnly ? series.points.slice(-1) : series.points;
  if (selected.length === 0) return null;

  const label = markerLabel(series.markerId);
  const intro =
    locale === "de"
      ? `Für **${label}** sind folgende Werte gespeichert:`
      : `Para **${label}** aparecen estos valores:`;
  const lines = selected.map((point) => {
    const unit = point.unitOriginal ?? point.unitUcum ?? "";
    const reference = referenceText(point, locale);
    const position = positionText(point, locale);
    const reportReference = reference
      ? locale === "de"
        ? ` Der Befund gibt **${reference}** als Referenz an.`
        : ` El informe indica **${reference}** como referencia.`
      : "";
    return `- ${date(point.observedAt, locale)}: **${number(point.value, locale)} ${unit}**.${reportReference}${position ? ` ${position}` : ""}`;
  });

  const units = new Set(selected.map((point) => point.unitUcum ?? point.unitOriginal));
  const unitNote =
    units.size > 1
      ? locale === "de"
        ? "\n\nDie Befunde verwenden unterschiedliche Einheiten. Deshalb werden die Werte getrennt gezeigt und hier weder umgerechnet noch als direkte Veränderung interpretiert."
        : "\n\nLos informes usan unidades diferentes. Por eso muestro cada valor por separado, sin convertirlos ni interpretarlos aquí como una variación directa."
      : "";

  return `${intro}\n\n${lines.join("\n")}${unitNote}`;
}
