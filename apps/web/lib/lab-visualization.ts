import { LabMarker, type LabMarker as LabMarkerValue } from "./extraction";
import { MARKER_ALIASES } from "./generated/marker-vocabulary";

export interface StructuredReferenceRange {
  low: number | null;
  high: number | null;
  unitUcum: string | null;
}

export interface LabSeriesPoint {
  markerId: string;
  value: number;
  unitOriginal: string | null;
  unitUcum: string | null;
  observedAt: string;
  labName: string | null;
  sourcePath: string;
  reference: StructuredReferenceRange | null;
  normalizationStatus: LabMarkerValue["normalization_status"];
}

export interface LabSeries {
  markerId: string;
  points: LabSeriesPoint[];
  comparability: "comparable" | "partial" | "insufficient";
  warnings: string[];
}

export interface LabMemoryDocument {
  relPath: string;
  frontmatter: Record<string, unknown>;
}

function normalizedLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

const EXACT_ALIAS_INDEX = (() => {
  const candidates = new Map<string, Set<string>>();
  for (const [markerId, aliases] of Object.entries(MARKER_ALIASES)) {
    for (const alias of [markerId, ...aliases]) {
      const key = normalizedLabel(alias);
      const ids = candidates.get(key) ?? new Set<string>();
      ids.add(markerId);
      candidates.set(key, ids);
    }
  }
  return new Map(
    [...candidates.entries()]
      .filter(([, ids]) => ids.size === 1)
      .map(([key, ids]) => [key, [...ids][0]]),
  );
})();

const UNIT_UCUM = new Map<string, string>([
  ["%", "%"],
  ["g/l", "g/L"],
  ["g/dl", "g/dL"],
  ["mg/l", "mg/L"],
  ["mg/dl", "mg/dL"],
  ["ng/ml", "ng/mL"],
  ["pg/ml", "pg/mL"],
  ["mmol/l", "mmol/L"],
  ["µmol/l", "umol/L"],
  ["μmol/l", "umol/L"],
  ["umol/l", "umol/L"],
  ["miu/l", "m[IU]/L"],
  ["iu/l", "[IU]/L"],
  ["u/l", "U/L"],
  ["10^9/l", "10*9/L"],
  ["10*9/l", "10*9/L"],
]);

export function canonicalMarkerId(name: string): string | null {
  return EXACT_ALIAS_INDEX.get(normalizedLabel(name)) ?? null;
}

export function canonicalUnit(unit: string | null | undefined): string | null {
  if (!unit) return null;
  return UNIT_UCUM.get(unit.trim().toLowerCase().replace(/\s+/g, "")) ?? null;
}

function decimal(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Conservador: solo estructura rangos simples; el texto original siempre se conserva. */
export function parseReferenceRange(
  input: string | null | undefined,
  unitUcum: string | null,
): StructuredReferenceRange | null {
  if (!input) return null;
  const text = input.trim();
  const between = text.match(/^(-?\d+(?:[.,]\d+)?)\s*[-–—]\s*(-?\d+(?:[.,]\d+)?)$/);
  if (between) {
    const low = decimal(between[1]);
    const high = decimal(between[2]);
    if (low === null || high === null || low > high) return null;
    return { low, high, unitUcum };
  }
  const upper = text.match(/^(?:<|<=|≤)\s*(-?\d+(?:[.,]\d+)?)$/);
  if (upper) return { low: null, high: decimal(upper[1]), unitUcum };
  const lower = text.match(/^(?:>|>=|≥)\s*(-?\d+(?:[.,]\d+)?)$/);
  if (lower) return { low: decimal(lower[1]), high: null, unitUcum };
  return null;
}

export function normalizeLabMarker(marker: LabMarkerValue): LabMarkerValue {
  const parsed = LabMarker.parse(marker);
  if (parsed.normalization_status === "reviewed") return parsed;
  const markerId = canonicalMarkerId(parsed.name);
  const unitUcum = canonicalUnit(parsed.unit);
  const structured = parseReferenceRange(parsed.reference_range, unitUcum);
  return {
    ...parsed,
    marker_id: markerId,
    unit_ucum: unitUcum,
    reference_range_structured: structured
      ? { low: structured.low, high: structured.high, unit_ucum: structured.unitUcum }
      : null,
    normalization_status: markerId && unitUcum ? "candidate" : "unresolved",
  };
}

export function buildLabSeries(
  documents: readonly LabMemoryDocument[],
  markerId: string,
): LabSeries {
  const points: LabSeriesPoint[] = [];
  for (const document of documents) {
    const fm = document.frontmatter;
    if (fm.type !== "lab_result" || typeof fm.observed_at !== "string") continue;
    const labName = typeof fm.lab_name === "string" ? fm.lab_name : null;
    const markers = Array.isArray(fm.markers) ? fm.markers : [];
    for (const raw of markers) {
      const parsed = LabMarker.safeParse(raw);
      if (!parsed.success) continue;
      const marker = normalizeLabMarker(parsed.data);
      if (marker.marker_id !== markerId || marker.value === null) continue;
      const rr = marker.reference_range_structured;
      points.push({
        markerId,
        value: marker.value,
        unitOriginal: marker.unit,
        unitUcum: marker.unit_ucum,
        observedAt: fm.observed_at,
        labName,
        sourcePath: document.relPath,
        reference: rr
          ? { low: rr.low, high: rr.high, unitUcum: rr.unit_ucum }
          : null,
        normalizationStatus: marker.normalization_status,
      });
    }
  }
  points.sort((a, b) => a.observedAt.localeCompare(b.observedAt));

  const units = new Set(points.map((point) => point.unitUcum).filter(Boolean));
  const unresolved = points.some((point) => !point.unitUcum);
  const comparability =
    points.length < 2
      ? "insufficient"
      : units.size === 1 && !unresolved
        ? "comparable"
        : "partial";
  const warnings: string[] = [];
  if (points.length < 2) warnings.push("Se necesitan al menos dos mediciones para mostrar evolución.");
  if (units.size > 1) warnings.push("La serie contiene unidades diferentes y no debe dibujarse como una línea continua.");
  if (unresolved) warnings.push("Hay mediciones cuya unidad no se ha normalizado.");
  return { markerId, points, comparability, warnings };
}
