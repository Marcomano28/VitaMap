import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  CANONICAL_MARKERS,
  HEALTH_AREAS,
  MARKER_ALIASES,
  QUERY_GROUPS,
} from "../lib/generated/marker-vocabulary";

interface Relation {
  id?: unknown;
  direccion?: unknown;
}

interface Topic {
  marker?: unknown;
  relacionado_con?: unknown;
  area_de_salud?: unknown;
}

interface Taxonomy {
  marker_aliases?: Record<string, unknown>;
  query_groups?: Record<string, { markers?: unknown }>;
  health_area_routes?: Record<string, { seed_markers?: unknown }>;
  topics?: Record<string, Topic>;
  document_overrides?: Record<string, { marker?: unknown; relacionado_con?: unknown }>;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const taxonomyPath = path.join(repoRoot, "corpus-preparation", "corpus-taxonomy.json");
const corpusRoot = path.join(repoRoot, "corpus-preparation", "approved-current-structure");

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// Contrato mínimo de evidencia (v0). Vocabulario controlado. Ver
// corpus-preparation/PROMPT-INVESTIGACION-RAG.md §3 bis y
// docs/vision/DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md (Tramo 2). La validación
// comprueba la FORMA cuando el campo existe; no exige presencia (backfill
// oportunista), así que es aditiva: tarjetas sin estos campos siguen pasando.
const CERTEZA = new Set(["alta", "moderada", "baja", "muy-baja"]);
const DIRECCION_EFECTO = new Set(["a-favor", "en-contra", "incierta"]);
const MOTIVOS_DESCENSO = new Set([
  "riesgo-de-sesgo",
  "inconsistencia",
  "evidencia-indirecta",
  "imprecision",
  "sesgo-de-publicacion",
]);
const DIRECCION_RELACION = new Set(["simetrica", "dirigida"]);

/** Una arista con `direccion` presente pero fuera del vocabulario. */
function relationDireccionViolation(rel: Relation): boolean {
  return rel.direccion !== undefined && !DIRECCION_RELACION.has(String(rel.direccion));
}

/** Valida el bloque `evidence` de una tarjeta. Devuelve los problemas hallados. */
function evidenceProblems(relPath: string, evidence: unknown): string[] {
  if (evidence === undefined) return [];
  if (!isRecord(evidence)) return [`${relPath} -> evidence debe ser un objeto`];
  const problems: string[] = [];
  const { certeza, direccion, motivos_descenso } = evidence;
  if (certeza === undefined) {
    problems.push(`${relPath} -> evidence sin certeza (campo requerido del bloque)`);
  } else if (!CERTEZA.has(String(certeza))) {
    problems.push(`${relPath} -> certeza invalida: ${String(certeza)}`);
  }
  if (direccion !== undefined && !DIRECCION_EFECTO.has(String(direccion))) {
    problems.push(`${relPath} -> evidence.direccion invalida: ${String(direccion)}`);
  }
  for (const motivo of stringArray(motivos_descenso)) {
    if (!MOTIVOS_DESCENSO.has(motivo)) problems.push(`${relPath} -> motivo_descenso invalido: ${motivo}`);
  }
  return problems;
}

function markdownFiles(root: string): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(abs);
    }
  }
  walk(root);
  return files.sort();
}

function collectCanonicalMarkers(taxonomy: Taxonomy): Set<string> {
  const markers = new Set<string>(Object.keys(taxonomy.marker_aliases ?? {}));
  for (const topic of Object.values(taxonomy.topics ?? {})) {
    for (const marker of stringArray(topic.marker)) markers.add(marker);
  }
  for (const override of Object.values(taxonomy.document_overrides ?? {})) {
    for (const marker of stringArray(override.marker)) markers.add(marker);
  }
  return markers;
}

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8")) as Taxonomy;
const taxonomyMarkers = collectCanonicalMarkers(taxonomy);
const generatedMarkers = new Set<string>(CANONICAL_MARKERS);

assert.deepEqual(
  [...generatedMarkers].sort(),
  [...taxonomyMarkers].sort(),
  "el vocabulario generado debe coincidir con la taxonomia canonica",
);
assert.deepEqual(
  Object.keys(MARKER_ALIASES).sort(),
  [...taxonomyMarkers].sort(),
  "MARKER_ALIASES debe cubrir exactamente los markers canonicos",
);
assert.equal(generatedMarkers.has("higado"), false, "higado debe seguir siendo grupo de consulta, no marker");

const unknownQueryGroupTargets: string[] = [];
for (const [groupId, group] of Object.entries(QUERY_GROUPS)) {
  for (const marker of group.markers) {
    if (!generatedMarkers.has(marker)) unknownQueryGroupTargets.push(`${groupId} -> ${marker}`);
  }
}
assert.deepEqual(unknownQueryGroupTargets, [], "query_groups solo puede expandir a markers canonicos");

const topicAreas = new Map<string, Set<string>>();
for (const topic of Object.values(taxonomy.topics ?? {})) {
  const markers = stringArray(topic.marker).filter((marker) => marker !== "general");
  for (const area of stringArray(topic.area_de_salud)) {
    const values = topicAreas.get(area) ?? new Set<string>();
    for (const marker of markers) values.add(marker);
    topicAreas.set(area, values);
  }
}

assert.deepEqual(
  Object.keys(HEALTH_AREAS).sort(),
  Object.keys(taxonomy.health_area_routes ?? {}).sort(),
  "HEALTH_AREAS debe cubrir exactamente las rutas activas de area_de_salud",
);

const unknownHealthAreaTargets: string[] = [];
const detachedHealthAreaTargets: string[] = [];
for (const [areaId, route] of Object.entries(HEALTH_AREAS)) {
  const topicMarkers = topicAreas.get(areaId) ?? new Set<string>();
  for (const marker of route.markers) {
    if (!generatedMarkers.has(marker)) unknownHealthAreaTargets.push(`${areaId} -> ${marker}`);
    if (!topicMarkers.has(marker)) detachedHealthAreaTargets.push(`${areaId} -> ${marker}`);
  }
}
assert.deepEqual(unknownHealthAreaTargets, [], "health_area_routes solo puede expandir a markers canonicos");
assert.deepEqual(
  detachedHealthAreaTargets,
  [],
  "health_area_routes debe usar markers que ya declaran esa area_de_salud",
);

const unknownRelations: string[] = [];
const badRelationDireccion: string[] = [];
for (const [topicId, topic] of Object.entries(taxonomy.topics ?? {})) {
  for (const rel of relationArray(topic.relacionado_con)) {
    if (typeof rel.id === "string" && !generatedMarkers.has(rel.id)) {
      unknownRelations.push(`topics.${topicId} -> ${rel.id}`);
    }
    if (relationDireccionViolation(rel)) badRelationDireccion.push(`topics.${topicId} -> ${String(rel.direccion)}`);
  }
}
for (const [docPath, override] of Object.entries(taxonomy.document_overrides ?? {})) {
  for (const rel of relationArray(override.relacionado_con)) {
    if (typeof rel.id === "string" && !generatedMarkers.has(rel.id)) {
      unknownRelations.push(`document_overrides.${docPath} -> ${rel.id}`);
    }
    if (relationDireccionViolation(rel)) {
      badRelationDireccion.push(`document_overrides.${docPath} -> ${String(rel.direccion)}`);
    }
  }
}
assert.deepEqual(unknownRelations, [], "relacionado_con debe apuntar a markers canonicos");

const unknownCorpusMarkers: string[] = [];
const unknownCorpusRelations: string[] = [];
const corpusEvidenceProblems: string[] = [];
for (const file of markdownFiles(corpusRoot)) {
  const relPath = path.relative(corpusRoot, file).split(path.sep).join("/");
  const data = matter(fs.readFileSync(file, "utf8")).data as Record<string, unknown>;
  for (const marker of stringArray(data.marker)) {
    if (!generatedMarkers.has(marker)) unknownCorpusMarkers.push(`${relPath} -> ${marker}`);
  }
  for (const rel of relationArray(data.relacionado_con)) {
    if (typeof rel.id === "string" && !generatedMarkers.has(rel.id)) {
      unknownCorpusRelations.push(`${relPath} -> ${rel.id}`);
    }
    if (relationDireccionViolation(rel)) badRelationDireccion.push(`${relPath} -> ${String(rel.direccion)}`);
  }
  corpusEvidenceProblems.push(...evidenceProblems(relPath, data.evidence));
}

assert.deepEqual(unknownCorpusMarkers, [], "las tarjetas locales no deben usar markers fuera de taxonomia");
assert.deepEqual(unknownCorpusRelations, [], "las tarjetas locales no deben enlazar relacionado_con fuera de taxonomia");
assert.deepEqual(
  badRelationDireccion,
  [],
  "relacionado_con.direccion solo admite 'simetrica' o 'dirigida' (Contrato mínimo v0)",
);
assert.deepEqual(corpusEvidenceProblems, [], "el bloque evidence debe seguir el Contrato mínimo de evidencia v0");

console.log("test-marker-taxonomy: OK (taxonomia, runtime y corpus reconciliados)");
