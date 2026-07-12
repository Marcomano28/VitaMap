import {
  CANONICAL_MARKERS,
  QUERY_GROUPS,
  TAXONOMY_VERSION,
} from "./generated/marker-vocabulary";
import type { Locale } from "./i18n";
import type { LabSeries, LabSeriesPoint } from "./lab-visualization";

type QueryGroupId = keyof typeof QUERY_GROUPS;

interface TerritoryDefinition {
  id: string;
  labels: Record<Locale, string>;
  groups: readonly QueryGroupId[];
}

const TERRITORIES: readonly TerritoryDefinition[] = [
  {
    id: "metabolic",
    labels: { es: "Metabolismo y glucosa", de: "Stoffwechsel und Glukose" },
    groups: ["glucemia-insulina"],
  },
  {
    id: "cardiovascular",
    labels: { es: "Perfil cardiovascular", de: "Herz-Kreislauf-Profil" },
    groups: ["perfil-lipidico", "marcadores-cardiovasculares-avanzados", "perfil-acidos-grasos"],
  },
  {
    id: "blood",
    labels: { es: "Sangre, hierro e inflamación", de: "Blut, Eisen und Entzündung" },
    groups: ["hematologia", "anemia", "inflamacion"],
  },
  {
    id: "organs",
    labels: { es: "Hígado, riñón y electrolitos", de: "Leber, Niere und Elektrolyte" },
    groups: ["perfil-hepatico", "perfil-renal", "electrolitos"],
  },
  {
    id: "regulation",
    labels: { es: "Tiroides y metabolismo óseo", de: "Schilddrüse und Knochenstoffwechsel" },
    groups: ["perfil-tiroideo", "metabolismo-oseo"],
  },
] as const;

const MARKER_LABELS: Record<string, Record<Locale, string>> = {
  "colesterol-hdl": { es: "Colesterol HDL", de: "HDL-Cholesterin" },
  "colesterol-ldl": { es: "Colesterol LDL", de: "LDL-Cholesterin" },
  "colesterol-total": { es: "Colesterol total", de: "Gesamtcholesterin" },
  "glucosa-en-ayunas": { es: "Glucosa en ayunas", de: "Nüchternglukose" },
  "hba1c": { es: "HbA1c", de: "HbA1c" },
  "proteina-c-reactiva": { es: "Proteína C reactiva", de: "C-reaktives Protein" },
  "tsh": { es: "TSH", de: "TSH" },
  "vitamina-d": { es: "Vitamina D", de: "Vitamin D" },
};

export interface HealthMapMarker {
  id: string;
  label: string;
  territoryId: string;
  series: LabSeries;
  latest: LabSeriesPoint;
}

export interface HealthMapTerritory {
  id: string;
  label: string;
  basis: "query-group" | "unclassified";
  semanticMeaning: "navigation-membership";
  markerIds: string[];
  reportCount: number;
}

export interface HealthMapViewModel {
  schemaVersion: 1;
  taxonomyVersion: number;
  latestObservedAt: string | null;
  reportCount: number;
  markers: HealthMapMarker[];
  territories: HealthMapTerritory[];
  edges: [];
  policy: {
    convertsUnits: false;
    infersDiagnosis: false;
    referenceMeaning: "report-specific";
    relationshipMeaning: "navigation-only";
  };
}

export type HealthMapModel = HealthMapViewModel;

export function displayMarker(markerId: string, locale: Locale): string {
  const explicit = MARKER_LABELS[markerId]?.[locale];
  if (explicit) return explicit;
  const words = markerId.split("-");
  return words
    .map((word, index) => {
      if (["ldl", "hdl", "tsh", "pcr", "hba1c", "egfr", "ggt"].includes(word)) {
        return word.toUpperCase();
      }
      return index === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word;
    })
    .join(" ");
}

/**
 * Selecciona el payload visual del chat sin mezclar fechas en una petición de
 * "última analítica". No convierte ni recalcula puntos.
 */
export function selectInlineLabSeries(
  seriesSet: readonly LabSeries[],
  latestOnly: boolean,
  limit = 3,
): LabSeries[] {
  let selected = seriesSet
    .filter((series) => series.points.length > 0)
    .map((series) => ({ ...series, points: [...series.points] }));
  if (latestOnly) {
    const latestDate = selected
      .flatMap((series) => series.points.map((point) => point.observedAt))
      .sort()
      .at(-1);
    selected = latestDate
      ? selected
          .map((series) => ({
            ...series,
            points: series.points.filter((point) => point.observedAt === latestDate),
            comparability: "insufficient" as const,
            warnings: [],
          }))
          .filter((series) => series.points.length > 0)
      : [];
  }
  return selected
    .sort((a, b) => {
      const byDate = b.points.at(-1)!.observedAt.localeCompare(
        a.points.at(-1)!.observedAt,
      );
      return byDate || a.markerId.localeCompare(b.markerId);
    })
    .slice(0, Math.max(0, Math.floor(limit)));
}

function markerTerritory(markerId: string): string {
  for (const territory of TERRITORIES) {
    const belongs = territory.groups.some((groupId) =>
      (QUERY_GROUPS[groupId].markers as readonly string[]).includes(markerId),
    );
    if (belongs) return territory.id;
  }
  return "other";
}

export function buildHealthMapModel(
  seriesSet: readonly LabSeries[],
  locale: Locale,
): HealthMapModel {
  const canonical = new Set<string>(CANONICAL_MARKERS);
  const usable = seriesSet.filter(
    (series) => canonical.has(series.markerId) && series.points.length > 0,
  );
  const markers: HealthMapMarker[] = usable.map((series) => ({
    id: series.markerId,
    label: displayMarker(series.markerId, locale),
    territoryId: markerTerritory(series.markerId),
    series,
    latest: series.points.at(-1)!,
  }));
  const dates = new Set(
    markers.flatMap((marker) => marker.series.points.map((point) => point.observedAt)),
  );
  const reports = new Set(
    markers.flatMap((marker) => marker.series.points.map((point) => point.sourcePath)),
  );
  const territoryDefinitions: TerritoryDefinition[] = [
    ...TERRITORIES,
    {
      id: "other",
      labels: { es: "Otros datos", de: "Weitere Werte" },
      groups: [],
    },
  ];
  const territories = territoryDefinitions
    .map((definition) => {
      const territoryMarkers = markers.filter(
        (marker) => marker.territoryId === definition.id,
      );
      return {
        id: definition.id,
        label: definition.labels[locale],
        basis: definition.groups.length > 0 ? "query-group" as const : "unclassified" as const,
        semanticMeaning: "navigation-membership" as const,
        markerIds: territoryMarkers.map((marker) => marker.id),
        reportCount: new Set(
          territoryMarkers.flatMap((marker) =>
            marker.series.points.map((point) => point.sourcePath),
          ),
        ).size,
      };
    })
    .filter((territory) => territory.markerIds.length > 0);
  const latestObservedAt = [...dates].sort().at(-1) ?? null;
  return {
    schemaVersion: 1,
    taxonomyVersion: TAXONOMY_VERSION,
    latestObservedAt,
    reportCount: reports.size,
    markers: markers.sort((a, b) => a.label.localeCompare(b.label, locale)),
    territories,
    edges: [],
    policy: {
      convertsUnits: false,
      infersDiagnosis: false,
      referenceMeaning: "report-specific",
      relationshipMeaning: "navigation-only",
    },
  };
}
