import type { LabSeries, LabSeriesPoint } from "./lab-visualization";

export interface LabMeasurementTrack {
  unitKey: string;
  unitLabel: string;
  points: LabSeriesPoint[];
  connectable: boolean;
}

export function buildMeasurementTracks(series: LabSeries): LabMeasurementTrack[] {
  const groups = new Map<string, LabSeriesPoint[]>();
  for (const point of series.points) {
    const unitLabel = point.unitOriginal ?? point.unitUcum ?? "?";
    const unitKey = point.unitUcum ?? `unresolved:${unitLabel}`;
    const points = groups.get(unitKey) ?? [];
    points.push(point);
    groups.set(unitKey, points);
  }
  return [...groups.entries()].map(([unitKey, points]) => ({
    unitKey,
    unitLabel: points[0].unitOriginal ?? points[0].unitUcum ?? "?",
    points,
    connectable: points.length > 1 && !unitKey.startsWith("unresolved:"),
  }));
}
