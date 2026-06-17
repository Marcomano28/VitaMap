import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Relation {
  id?: unknown;
}

interface Topic {
  marker?: unknown;
  alias?: unknown;
  relacionado_con?: unknown;
  dominio?: unknown;
  area_de_salud?: unknown;
}

interface QueryGroup {
  aliases?: unknown;
  markers?: unknown;
}

interface HealthAreaRoute {
  aliases?: unknown;
  seed_markers?: unknown;
}

interface Taxonomy {
  version?: unknown;
  marker_aliases?: Record<string, unknown>;
  query_groups?: Record<string, QueryGroup>;
  health_area_routes?: Record<string, HealthAreaRoute>;
  topics?: Record<string, Topic>;
  document_overrides?: Record<string, { marker?: unknown; relacionado_con?: unknown }>;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appRoot, "../..");
const taxonomyPath = path.join(repoRoot, "corpus-preparation", "corpus-taxonomy.json");
const outputPath = path.join(appRoot, "lib", "generated", "marker-vocabulary.ts");
const checkOnly = process.argv.includes("--check");

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function relationArray(value: unknown): Relation[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Relation => Boolean(item) && typeof item === "object");
}

function uniqSorted(values: Iterable<string>): string[] {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function uniqStable(values: Iterable<string>): string[] {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))];
}

function addAliases(
  markerAliases: Map<string, Set<string>>,
  marker: string,
  aliases: Iterable<string>,
) {
  const values = markerAliases.get(marker) ?? new Set<string>();
  values.add(marker);
  for (const alias of aliases) values.add(alias);
  markerAliases.set(marker, values);
}

function collectTaxonomy(raw: string) {
  const taxonomy = JSON.parse(raw) as Taxonomy;
  const markerAliases = new Map<string, Set<string>>();
  const relatedIds: Array<{ where: string; id: string }> = [];
  // Marcadores "lente": perspectivas de tradición/práctica que modifican un tema
  // clínico en vez de cambiarlo (ver lib/marker-scope.ts `deriveScope`).
  const lensMarkers = new Set<string>();
  const healthAreaMarkers = new Map<string, Set<string>>();

  for (const [marker, aliases] of Object.entries(taxonomy.marker_aliases ?? {})) {
    addAliases(markerAliases, marker, stringArray(aliases));
  }

  for (const [topicId, topic] of Object.entries(taxonomy.topics ?? {})) {
    const markers = stringArray(topic.marker);
    const aliases = markers.length === 1 ? stringArray(topic.alias) : [];
    for (const marker of markers) addAliases(markerAliases, marker, aliases);
    if (topic.dominio === "tradiciones-practicas") {
      for (const marker of markers) lensMarkers.add(marker);
    }
    for (const area of stringArray(topic.area_de_salud)) {
      const values = healthAreaMarkers.get(area) ?? new Set<string>();
      for (const marker of markers) {
        if (marker !== "general") values.add(marker);
      }
      healthAreaMarkers.set(area, values);
    }
    for (const rel of relationArray(topic.relacionado_con)) {
      if (typeof rel.id === "string" && rel.id.trim()) relatedIds.push({ where: `topics.${topicId}`, id: rel.id.trim() });
    }
  }

  for (const [docPath, override] of Object.entries(taxonomy.document_overrides ?? {})) {
    for (const marker of stringArray(override.marker)) addAliases(markerAliases, marker, []);
    for (const rel of relationArray(override.relacionado_con)) {
      if (typeof rel.id === "string" && rel.id.trim()) {
        relatedIds.push({ where: `document_overrides.${docPath}`, id: rel.id.trim() });
      }
    }
  }

  const canonicalMarkers = new Set(markerAliases.keys());
  const queryGroups: Record<string, { aliases: string[]; markers: string[] }> = {};
  const healthAreas: Record<string, { aliases: string[]; markers: string[] }> = {};

  for (const [groupId, group] of Object.entries(taxonomy.query_groups ?? {})) {
    const markers = uniqSorted(stringArray(group.markers));
    const aliases = uniqSorted([groupId, ...stringArray(group.aliases)]);
    for (const marker of markers) {
      if (!canonicalMarkers.has(marker)) {
        throw new Error(`query_groups.${groupId} apunta a marker desconocido: ${marker}`);
      }
    }
    queryGroups[groupId] = { aliases, markers };
  }

  for (const [areaId, route] of Object.entries(taxonomy.health_area_routes ?? {})) {
    const derivedMarkers = healthAreaMarkers.get(areaId) ?? new Set<string>();
    if (derivedMarkers.size === 0) {
      throw new Error(`health_area_routes.${areaId} no tiene ningun topic con area_de_salud=${areaId}`);
    }

    const seeds = stringArray(route.seed_markers);
    const markers = seeds.length > 0 ? uniqStable(seeds) : uniqSorted(derivedMarkers);
    for (const marker of markers) {
      if (!canonicalMarkers.has(marker)) {
        throw new Error(`health_area_routes.${areaId} apunta a marker desconocido: ${marker}`);
      }
      if (!derivedMarkers.has(marker)) {
        throw new Error(`health_area_routes.${areaId} usa marker sin esa area_de_salud: ${marker}`);
      }
    }

    healthAreas[areaId] = {
      aliases: uniqSorted([areaId, areaId.replace(/-/g, " "), ...stringArray(route.aliases)]),
      markers,
    };
  }

  for (const { where, id } of relatedIds) {
    if (!canonicalMarkers.has(id)) throw new Error(`${where}.relacionado_con apunta a marker desconocido: ${id}`);
  }

  return {
    version: typeof taxonomy.version === "number" ? taxonomy.version : 0,
    markerAliases: Object.fromEntries(
      [...markerAliases.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([marker, aliases]) => [marker, uniqSorted(aliases)]),
    ),
    queryGroups: Object.fromEntries(
      Object.entries(queryGroups).sort(([left], [right]) => left.localeCompare(right)),
    ),
    healthAreas: Object.fromEntries(
      Object.entries(healthAreas).sort(([left], [right]) => left.localeCompare(right)),
    ),
    lensMarkers: uniqSorted(lensMarkers),
  };
}

function renderModule(data: ReturnType<typeof collectTaxonomy>): string {
  const aliases = JSON.stringify(data.markerAliases, null, 2);
  const groups = JSON.stringify(data.queryGroups, null, 2);
  const healthAreas = JSON.stringify(data.healthAreas, null, 2);
  const markers = JSON.stringify(Object.keys(data.markerAliases), null, 2);
  const lens = JSON.stringify(data.lensMarkers, null, 2);

  return `// Generated by apps/web/scripts/generate-marker-vocabulary.ts.
// Source of truth: corpus-preparation/corpus-taxonomy.json.
// Do not edit by hand.

export const TAXONOMY_VERSION = ${JSON.stringify(data.version)} as const;

export const MARKER_ALIASES = ${aliases} as const satisfies Record<string, readonly string[]>;

export const QUERY_GROUPS = ${groups} as const satisfies Record<
  string,
  { aliases: readonly string[]; markers: readonly string[] }
>;

export const HEALTH_AREAS = ${healthAreas} as const satisfies Record<
  string,
  { aliases: readonly string[]; markers: readonly string[] }
>;

export const CANONICAL_MARKERS = ${markers} as const;

export const LENS_MARKERS = ${lens} as const;
`;
}

const raw = fs.readFileSync(taxonomyPath, "utf8");
const next = renderModule(collectTaxonomy(raw));

if (checkOnly) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : "";
  if (current !== next) {
    throw new Error("marker-vocabulary.ts no esta sincronizado. Ejecuta npm run taxonomy:generate --workspace apps/web.");
  }
  console.log("generate-marker-vocabulary: OK (sincronizado)");
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, next, "utf8");
  console.log(`generate-marker-vocabulary: escrito ${path.relative(repoRoot, outputPath)}`);
}
