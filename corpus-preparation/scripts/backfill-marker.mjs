#!/usr/bin/env node
/**
 * Rellena el campo `marker:` en el frontmatter de las tarjetas del corpus,
 * derivándolo de la CARPETA en la que está cada documento (que ya es el
 * marcador). No interpreta el contenido: solo ordena lo que ya sabes.
 *
 *   node corpus-preparation/scripts/backfill-marker.mjs            # dry-run
 *   node corpus-preparation/scripts/backfill-marker.mjs --write    # aplica
 *
 * Reglas:
 * - marker = nombre de la carpeta (p. ej. colesterol-ldl/ -> marker: colesterol-ldl).
 * - Carpetas transversales -> marker: general (siempre relevantes).
 * - Archivos "lectura conjunta" / "panel" / "seguimiento" cubren varios
 *   marcadores: se marcan con el de la carpeta y se REPORTAN para revisión
 *   manual (puede convenir una lista).
 * - Si el documento ya tiene `marker:`, no se toca.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "approved-current-structure",
);
const WRITE = process.argv.includes("--write");

// Carpetas que no son un marcador concreto: relevantes para cualquier consulta.
const TRANSVERSAL = new Set(["ayuno", "interferencias-analiticas", "micronutrientes"]);
const MULTI = /lectura-conjunta|panel|seguimiento/i;

function markerForFolder(folder) {
  return TRANSVERSAL.has(folder) ? "general" : folder;
}

/** Inserta `marker:` en el frontmatter si falta. Devuelve el nuevo contenido o null. */
function withMarker(content, marker) {
  if (!content.startsWith("---")) return null; // sin frontmatter
  const end = content.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = content.slice(0, end);
  if (/^marker:/m.test(block)) return null; // ya tiene
  // Insertar tras source_kind si existe, si no al final del bloque.
  const lines = block.split("\n");
  const at = lines.findIndex((l) => /^source_kind:/.test(l));
  const markerLine = `marker: ${marker}`;
  if (at >= 0) lines.splice(at + 1, 0, markerLine);
  else lines.push(markerLine);
  return lines.join("\n") + content.slice(end);
}

const summary = {};
const flagged = [];
let changed = 0;

for (const folder of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  const marker = markerForFolder(folder);
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const abs = path.join(dir, file);
    const content = fs.readFileSync(abs, "utf8");
    const next = withMarker(content, marker);
    if (!next) continue; // ya tenía marker o sin frontmatter
    summary[marker] = (summary[marker] ?? 0) + 1;
    if (MULTI.test(file)) flagged.push(`${folder}/${file}  (revisar: ¿lista de marcadores?)`);
    if (WRITE) fs.writeFileSync(abs, next);
    changed++;
  }
}

console.log(WRITE ? "[backfill-marker] APLICADO" : "[backfill-marker] DRY-RUN (usa --write para aplicar)");
console.log(`Documentos a etiquetar: ${changed}`);
console.log("Por marcador:");
for (const [m, n] of Object.entries(summary).sort()) console.log(`  ${m}: ${n}`);
if (flagged.length) {
  console.log(`\nRevisión manual (multi-marcador, ${flagged.length}):`);
  for (const f of flagged) console.log(`  - ${f}`);
}
