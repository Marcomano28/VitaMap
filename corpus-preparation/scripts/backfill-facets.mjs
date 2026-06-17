#!/usr/bin/env node
/**
 * Backfill facetado para tarjetas VitaMap.
 *
 * Por defecto es dry-run: calcula los metadatos que faltan y reporta cambios.
 * Usa --write para aplicar sobre los markdown.
 *
 *   node corpus-preparation/scripts/backfill-facets.mjs
 *   node corpus-preparation/scripts/backfill-facets.mjs --write
 *   node corpus-preparation/scripts/backfill-facets.mjs --root /data/kb --write
 *
 * El objetivo es enriquecer frontmatter, no reescribir contenido editorial.
 * La taxonomía vive en corpus-preparation/corpus-taxonomy.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const corpusPreparationDir = path.resolve(scriptDir, "..");
const defaultRoot = path.join(corpusPreparationDir, "approved-current-structure");
const taxonomyPath = path.join(corpusPreparationDir, "corpus-taxonomy.json");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const FORCE = args.includes("--force");
const rootArgIndex = args.indexOf("--root");
const ROOT = rootArgIndex >= 0 ? path.resolve(args[rootArgIndex + 1] ?? "") : defaultRoot;

if (!ROOT) {
  throw new Error("Uso: backfill-facets.mjs [--root path] [--write] [--force]");
}

const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

function fold(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return fold(value).replace(/\s+/g, "-");
}

function uniq(values) {
  return [...new Set(values.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim()))];
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" && v.trim());
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function scalarOrArray(values) {
  const unique = uniq(values);
  if (unique.length === 0) return undefined;
  return unique.length === 1 ? unique[0] : unique;
}

function asPosixPath(value) {
  return value.split(path.sep).join("/");
}

function inferSourceLocale(sourceUrl) {
  let url;
  try {
    url = new URL(String(sourceUrl ?? ""));
  } catch {
    return {};
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname.toLowerCase();

  if (
    host.endsWith(".de") ||
    host.includes("gesundheitsinformation.de") ||
    host.includes("iqwig.de") ||
    host.includes("rki.de") ||
    host.includes("bfarm.de") ||
    host.includes("bfr.bund.de")
  ) {
    return { source_language: "de", source_jurisdiction: ["DE"] };
  }
  if (host.includes("europa.eu") || host.includes("ema.europa.eu") || host.includes("efsa.europa.eu")) {
    return { source_language: pathname.includes("/de/") ? "de" : "en", source_jurisdiction: ["EU"] };
  }
  if (host.endsWith(".at")) return { source_language: "de", source_jurisdiction: ["AT"] };
  if (host.endsWith(".ch")) return { source_language: "de", source_jurisdiction: ["CH"] };
  if (host.endsWith(".es")) return { source_language: "es", source_jurisdiction: ["ES"] };
  if (host.endsWith(".uk") || host.includes("nhs.uk")) return { source_language: "en", source_jurisdiction: ["GB"] };
  if (
    host.endsWith(".gov") ||
    host.includes("nih.gov") ||
    host.includes("medlineplus.gov") ||
    host.includes("cdc.gov") ||
    host.includes("cancer.gov") ||
    host.includes("ncbi.nlm.nih.gov") ||
    host.includes("pubmed.ncbi.nlm.nih.gov")
  ) {
    return { source_language: "en", source_jurisdiction: ["US"] };
  }
  if (host.includes("who.int")) return { source_language: "en", source_jurisdiction: ["INT"] };
  if (host.includes("ctext.org")) return { source_language: "zh", source_jurisdiction: ["CN"] };
  if (host.includes("uchile.cl")) return { source_language: "es", source_jurisdiction: ["CL"] };
  return {};
}

function relationKey(rel) {
  if (!rel || typeof rel !== "object") return "";
  return `${rel.id ?? ""}:${rel.relacion ?? ""}`;
}

function mergeRelations(existing, inferred) {
  const base = Array.isArray(existing) ? existing.filter((r) => r && typeof r === "object") : [];
  const seen = new Set(base.map(relationKey));
  for (const rel of inferred ?? []) {
    if (!rel || typeof rel !== "object") continue;
    const key = relationKey(rel);
    if (!key || seen.has(key)) continue;
    base.push(rel);
    seen.add(key);
  }
  return base;
}

function firstFolder(relativePath) {
  return relativePath.split(path.sep)[0];
}

function markdownFiles(root) {
  const files = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(abs);
    }
  }
  walk(root);
  return files.sort();
}

function sourceSection(sourceType, filename) {
  const mapped = taxonomy.sections_by_source_type?.[sourceType];
  if (mapped) return mapped;
  if (/lectura-conjunta|panel/i.test(filename)) return "lectura-conjunta";
  if (/seguimiento/i.test(filename)) return "seguimiento";
  if (/curiosidad/i.test(filename)) return "curiosidad";
  if (/alimentacion|factores/i.test(filename)) return "alimentacion-factores";
  if (/interpretacion/i.test(filename)) return "interpretacion";
  return undefined;
}

function markerAliases() {
  const aliases = [];
  for (const [marker, values] of Object.entries(taxonomy.marker_aliases ?? {})) {
    aliases.push({ marker, alias: marker, folded: ` ${fold(marker)} ` });
    for (const value of values ?? []) aliases.push({ marker, alias: value, folded: ` ${fold(value)} ` });
  }
  for (const [topicId, topic] of Object.entries(taxonomy.topics ?? {})) {
    const markers = asArray(topic?.marker);
    for (const marker of markers) {
      aliases.push({ marker, alias: marker, folded: ` ${fold(marker)} ` });
      aliases.push({ marker, alias: topicId, folded: ` ${fold(topicId)} ` });
      for (const value of asArray(topic?.alias)) {
        aliases.push({ marker, alias: value, folded: ` ${fold(value)} ` });
      }
    }
  }
  return aliases;
}

const MARKER_ALIASES = markerAliases();

function topicsByMarker() {
  const byMarker = new Map();
  for (const topic of Object.values(taxonomy.topics ?? {})) {
    for (const marker of asArray(topic?.marker)) {
      if (!byMarker.has(marker)) byMarker.set(marker, topic);
    }
  }
  return byMarker;
}

const TOPICS_BY_MARKER = topicsByMarker();

function markersFromText(text) {
  const padded = ` ${fold(text)} `;
  const found = [];
  for (const candidate of MARKER_ALIASES) {
    if (padded.includes(candidate.folded)) found.push(candidate.marker);
  }
  return uniq(found);
}

function inferMarkers(entry, relativePath, data, parsed) {
  const existing = asArray(data.marker);
  if (existing.length && !FORCE) return existing;

  const sourceType = String(data.source_type ?? "");
  const title = String(data.title ?? "");
  const filename = path.basename(relativePath);
  const searchText = `${relativePath} ${title}`;
  const found = markersFromText(searchText);

  if (found.length > 1) return found;
  if (found.length === 1) {
    const section = sourceSection(sourceType, filename);
    if (["lectura-conjunta", "seguimiento"].includes(section)) {
      const headingText = parsed.content
        .split(/\n/)
        .filter((line) => /^#{1,3}\s/.test(line))
        .join(" ");
      return uniq([...found, ...markersFromText(headingText)]);
    }
    return found;
  }

  return asArray(entry?.marker);
}

function inferEntryFromMarkers(markers) {
  const entries = [];
  const seen = new Set();
  for (const marker of markers) {
    const entry = TOPICS_BY_MARKER.get(marker);
    if (!entry || seen.has(entry)) continue;
    entries.push(entry);
    seen.add(entry);
  }
  if (entries.length === 0) return undefined;
  if (entries.length === 1) return entries[0];

  return {
    dominio: scalarOrArray(entries.map((entry) => entry.dominio)),
    tipo: uniq(entries.flatMap((entry) => asArray(entry.tipo))),
    marker: uniq(entries.flatMap((entry) => asArray(entry.marker))),
    categoria: uniq(entries.flatMap((entry) => asArray(entry.categoria))),
    muestra: uniq(entries.flatMap((entry) => asArray(entry.muestra))),
    sistema: uniq(entries.flatMap((entry) => asArray(entry.sistema))),
    area_de_salud: uniq(entries.flatMap((entry) => asArray(entry.area_de_salud))),
    alias: uniq(entries.flatMap((entry) => asArray(entry.alias))),
    relacionado_con: entries.flatMap((entry) =>
      Array.isArray(entry.relacionado_con) ? entry.relacionado_con : [],
    ),
    tradicion: scalarOrArray(entries.map((entry) => entry.tradicion)),
  };
}

function inferTradition(entry, relativePath, data) {
  if (typeof data.tradicion === "string" && data.tradicion.trim() && !FORCE) {
    return data.tradicion.trim();
  }
  if (typeof entry?.tradicion === "string") return entry.tradicion;

  const text = fold(`${relativePath} ${data.title ?? ""} ${data.source_type ?? ""}`);
  if (text.includes("ayurveda") || text.includes("susruta") || text.includes("caraka") || text.includes("prakriti")) {
    return "ayurveda";
  }
  if (text.includes("mtc") || text.includes("neijing") || text.includes("suwen") || text.includes("lingshu")) {
    return "mtc";
  }
  if (text.includes("acupuntura") || text.includes("acupuncture")) return "acupuntura";
  return undefined;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function setFacet(data, field, value, changes, opts = {}) {
  if (value === undefined) return;
  if (Array.isArray(value) && value.length === 0) return;
  if (sameValue(data[field], value)) return;
  if (field in data && !FORCE && !opts.override) return;
  data[field] = value;
  changes.push(field);
}

function inferFacets(absPath) {
  const relativePath = path.relative(ROOT, absPath);
  const relativeKey = asPosixPath(relativePath);
  const folder = firstFolder(relativePath);
  const override = taxonomy.document_overrides?.[relativeKey] ?? {};
  const raw = fs.readFileSync(absPath, "utf8");
  const parsed = matter(raw);
  const data = { ...(parsed.data ?? {}) };
  const changes = [];
  const review = [];
  const filename = path.basename(relativePath);
  const sourceType = String(data.source_type ?? "");

  const suppressReview = new Set(asArray(override.suppress_review));
  function addReview(code, message) {
    if (suppressReview.has("all") || suppressReview.has(code)) return;
    review.push(message);
  }

  const overrideTopic = typeof override.topic === "string" ? override.topic.trim() : "";
  const overrideEntry = overrideTopic ? taxonomy.topics?.[overrideTopic] : undefined;
  if (overrideTopic && !overrideEntry) {
    addReview("unknown-topic-override", `topic override desconocido: ${overrideTopic}`);
  }

  const folderEntry = taxonomy.topics?.[folder];
  const inferredMarkers = override.marker ?? inferMarkers(overrideEntry ?? folderEntry, relativePath, data, parsed);
  const entry = overrideEntry ?? folderEntry ?? inferEntryFromMarkers(asArray(inferredMarkers));

  if (!entry) addReview("missing-topic", `sin entrada en corpus-taxonomy.json para carpeta "${folder}"`);
  if (!sourceSection(sourceType, filename)) addReview("unmapped-source-type", `source_type no mapeado: ${sourceType || "(vacío)"}`);

  const sourceLocale = inferSourceLocale(data.source_url);
  setFacet(data, "source_language", sourceLocale.source_language, changes);
  setFacet(data, "source_jurisdiction", sourceLocale.source_jurisdiction, changes);
  setFacet(data, "facets_version", taxonomy.version, changes);
  setFacet(data, "tarjeta_id", slug(relativePath.replace(/\.md$/i, "")), changes);
  setFacet(data, "dominio", entry?.dominio, changes);
  setFacet(data, "tipo", entry?.tipo, changes);
  setFacet(data, "marker", inferredMarkers, changes, {
    override: "marker" in override,
  });
  setFacet(data, "categoria", entry?.categoria, changes);
  setFacet(data, "muestra", entry?.muestra, changes);
  setFacet(data, "sistema", entry?.sistema, changes);
  setFacet(data, "area_de_salud", entry?.area_de_salud, changes);
  setFacet(data, "seccion", override.seccion ?? sourceSection(sourceType, filename), changes, {
    override: "seccion" in override,
  });
  setFacet(data, "tradicion", override.tradicion ?? inferTradition(entry, relativePath, data), changes, {
    override: "tradicion" in override,
  });
  setFacet(data, "alias", entry?.alias, changes);

  const inferredRelated = [
    ...(Array.isArray(entry?.relacionado_con) ? entry.relacionado_con : []),
    ...(Array.isArray(override.relacionado_con) ? override.relacionado_con : []),
  ];
  const related = mergeRelations(data.relacionado_con, inferredRelated);
  if (related.length && !sameValue(data.relacionado_con, related)) {
    data.relacionado_con = related;
    changes.push("relacionado_con");
  }

  const markers = asArray(data.marker);
  const section = data.seccion;
  if (section === "lectura-conjunta" && markers.length <= 1 && markers[0] !== "general") {
    addReview("single-marker-lectura-conjunta", "posible multi-marcador: revisar marker como lista");
  }
  if (section === "tradicion" && data.source_kind === "tradition-context" && !data.tradicion) {
    addReview("missing-tradition", "seccion tradicion sin tradicion inferida");
  }

  return {
    relativePath,
    raw,
    nextRaw: matter.stringify(parsed.content.trim() + "\n", data),
    changes,
    review,
    marker: data.marker,
    seccion: data.seccion,
  };
}

const files = markdownFiles(ROOT);
const results = files.map(inferFacets);
const changed = results.filter((r) => r.changes.length > 0);
const review = results.filter((r) => r.review.length > 0);

if (WRITE) {
  for (const item of changed) {
    fs.writeFileSync(path.join(ROOT, item.relativePath), item.nextRaw, "utf8");
  }
}

console.log(WRITE ? "[backfill-facets] APLICADO" : "[backfill-facets] DRY-RUN (usa --write para aplicar)");
console.log(`Root: ${ROOT}`);
console.log(`Documentos leídos: ${files.length}`);
console.log(`Documentos con cambios: ${changed.length}`);

const byField = {};
for (const item of changed) {
  for (const field of item.changes) byField[field] = (byField[field] ?? 0) + 1;
}
console.log("Campos a añadir/modificar:");
for (const [field, count] of Object.entries(byField).sort()) console.log(`  ${field}: ${count}`);

const bySection = {};
for (const item of results) {
  const key = item.seccion ?? "(sin seccion)";
  bySection[key] = (bySection[key] ?? 0) + 1;
}
console.log("Secciones inferidas:");
for (const [section, count] of Object.entries(bySection).sort()) console.log(`  ${section}: ${count}`);

if (review.length) {
  console.log(`\nRevisión manual sugerida (${review.length}):`);
  for (const item of review.slice(0, 80)) {
    console.log(`  - ${item.relativePath}: ${item.review.join("; ")}`);
  }
  if (review.length > 80) console.log(`  ... y ${review.length - 80} más`);
}

if (!WRITE && changed.length) {
  console.log("\nEjemplos de cambios:");
  for (const item of changed.slice(0, 8)) {
    console.log(`  - ${item.relativePath}: ${item.changes.join(", ")}`);
  }
}
