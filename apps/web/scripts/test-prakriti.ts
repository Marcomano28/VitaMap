/**
 * Prueba de lógica del cuestionario de constitución (prakriti).
 *
 * Ejercita SOLO el cálculo del perfil — no escribe en la memoria de ningún
 * usuario ni toca el disco. Cumple "probar en local sin subir memoria".
 *
 *   node --import tsx scripts/test-prakriti.ts
 *
 * Sistema de scoring (20 ítems ponderados, primary+secondary opcional):
 *   físico (5×2) + fisiológico (6×1.5) + conductual (9×1) = 28 pts máx.
 *   primary recibe 100% del peso (sin secondary) o 75% (con secondary ≠ primary).
 *   secondary recibe 25% del peso si difiere de primary.
 *   tridóshico  si spread% ≤ 15   (max% − mín%)
 *   bidóshico   si lead%  ≤ 10    (1º% − 2º%, con spread > 15)
 *   monodóshico en el resto
 */

import assert from "node:assert/strict";
import {
  scorePrakriti,
  getPrakritiItems,
  PRAKRITI_ITEM_COUNT,
  ITEM_WEIGHTS,
  type Dosha,
  type ItemAnswer,
} from "../lib/prakriti";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/** 20 respuestas sin secondary: primeros v vata, luego p pitta, resto kapha. */
function answers(v: number, p: number, k: number): ItemAnswer[] {
  assert.equal(v + p + k, PRAKRITI_ITEM_COUNT, `answers() debe sumar ${PRAKRITI_ITEM_COUNT}`);
  return [
    ...Array<Dosha>(v).fill("vata"),
    ...Array<Dosha>(p).fill("pitta"),
    ...Array<Dosha>(k).fill("kapha"),
  ].map((d) => ({ primary: d, secondary: null }));
}

console.log("Cuestionario de constitución — pruebas de lógica (20 ítems, primary+secondary)\n");

// ── Estructura ────────────────────────────────────────────────────────────────

check("el cuestionario en es y de tiene exactamente 20 ítems", () => {
  assert.equal(PRAKRITI_ITEM_COUNT, 20);
  assert.equal(getPrakritiItems("es").length, 20);
  assert.equal(getPrakritiItems("de").length, 20);
});

check("cada ítem ofrece exactamente una opción por dosha", () => {
  for (const locale of ["es", "de"] as const) {
    for (const item of getPrakritiItems(locale)) {
      const doshas = item.options.map((o) => o.dosha).sort();
      assert.deepEqual(doshas, ["kapha", "pitta", "vata"], `ítem ${item.id} (${locale})`);
    }
  }
});

check("los 5 ítems físicos pesan 2 y el resto ≤ 1.5", () => {
  const physical = ["complexion", "piel", "ojos", "cabello", "unas"];
  for (const id of physical) assert.equal(ITEM_WEIGHTS[id], 2, `${id} debe pesar 2`);
  for (const [id, w] of Object.entries(ITEM_WEIGHTS)) {
    if (!physical.includes(id)) assert.ok(w <= 1.5, `${id} no es físico pero pesa ${w}`);
  }
});

check("el peso total de los 20 ítems es 28", () => {
  const items = getPrakritiItems("es");
  const total = items.reduce((acc, it) => acc + (ITEM_WEIGHTS[it.id] ?? 1), 0);
  assert.equal(total, 28);
});

// ── Monodóshico ───────────────────────────────────────────────────────────────

check("monodóshico claro: 20 vāta → Vāta, 100%", () => {
  const r = scorePrakriti(answers(20, 0, 0), "es");
  assert.equal(r.dominant, "vata");
  assert.equal(r.secondary, null);
  assert.equal(r.type, "Vāta");
  assert.equal(r.percentages.vata, 100);
  assert.equal(r.percentages.pitta, 0);
});

check("monodóshico con cola: 15/3/2 → Vāta, sin secundario", () => {
  // Vata items 0-14 → 5×2+6×1.5+4×1 = 23  (82.1%)
  // Pitta items 15-17 → 3×1 = 3             (10.7%)
  // Kapha items 18-19 → 2×1 = 2             (7.1%)
  const r = scorePrakriti(answers(15, 3, 2), "es");
  assert.equal(r.dominant, "vata");
  assert.equal(r.secondary, null);
  assert.equal(r.type, "Vāta");
});

check("monodóshico pitta: 0/20/0 → Pitta, 100%", () => {
  const r = scorePrakriti(answers(0, 20, 0), "es");
  assert.equal(r.dominant, "pitta");
  assert.equal(r.type, "Pitta");
  assert.equal(r.percentages.pitta, 100);
});

// ── Bidóshico ─────────────────────────────────────────────────────────────────

check("bidóshico Vāta-Pitta: 8/12/0 — físico vata compensa ventaja numérica pitta", () => {
  // Vata items 0-7  → 5×2+3×1.5 = 14.5  (51.8%)
  // Pitta items 8-19 → 3×1.5+9×1 = 13.5  (48.2%)
  // spread=51.8%>15, lead=3.6%≤10 → bidóshico
  // SIN pesos: 40% vs 60% → sería monodóshico Pitta. Los pesos cambian el resultado.
  const r = scorePrakriti(answers(8, 12, 0), "es");
  assert.equal(r.dominant, "vata");
  assert.equal(r.secondary, "pitta");
  assert.equal(r.type, "Vāta-Pitta");
});

check("bidóshico Pitta-Vāta: 7/13/0 — pitta ligeramente dominante (lead ~7%)", () => {
  // Vata items 0-6  → 5×2+2×1.5 = 13   (46.4%)
  // Pitta items 7-19 → 4×1.5+9×1 = 15  (53.6%)
  const r = scorePrakriti(answers(7, 13, 0), "es");
  assert.equal(r.dominant, "pitta");
  assert.equal(r.secondary, "vata");
  assert.equal(r.type, "Pitta-Vāta");
});

// ── Tridóshico ────────────────────────────────────────────────────────────────

check("tridóshico: 4/8/8 — spread=14.3% ≤ 15", () => {
  // Vata items 0-3  → 4×2 = 8                  (28.6%)
  // Pitta items 4-11 → 1×2+6×1.5+1×1 = 12      (42.9%)
  // Kapha items 12-19 → 8×1 = 8                 (28.6%)
  // spread=14.3% ≤ 15 → tridóshico
  const r = scorePrakriti(answers(4, 8, 8), "es");
  assert.equal(r.secondary, null);
  assert.match(r.type, /Trid/);
});

// ── Secondary scoring ─────────────────────────────────────────────────────────

check("secondary: primary recibe 75%, secondary 25% del peso del ítem", () => {
  // Todos los 20 ítems: primary=vata, secondary=pitta
  // Vata: 28×0.75 = 21 pts → 75%
  // Pitta: 28×0.25 = 7 pts → 25%
  const allWithSecondary: ItemAnswer[] = Array(20)
    .fill(null)
    .map(() => ({ primary: "vata" as Dosha, secondary: "pitta" as Dosha }));
  const r = scorePrakriti(allWithSecondary, "es");
  assert.equal(r.percentages.vata, 75);
  assert.equal(r.percentages.pitta, 25);
  assert.equal(r.percentages.kapha, 0);
  assert.equal(r.dominant, "vata");
  // lead=50% > 10% → monodóshico (secondary en el resultado es null)
  assert.equal(r.secondary, null);
});

check("secondary === primary se ignora: primary recibe el peso completo", () => {
  const allSame: ItemAnswer[] = Array(20)
    .fill(null)
    .map(() => ({ primary: "kapha" as Dosha, secondary: "kapha" as Dosha }));
  const r = scorePrakriti(allSame, "es");
  assert.equal(r.percentages.kapha, 100);
  assert.equal(r.percentages.vata, 0);
});

check("secondary null equivale a respuesta simple", () => {
  const withNull: ItemAnswer[] = Array(20)
    .fill(null)
    .map(() => ({ primary: "pitta" as Dosha, secondary: null }));
  const r = scorePrakriti(withNull, "es");
  assert.equal(r.percentages.pitta, 100);
});

// ── Localización ──────────────────────────────────────────────────────────────

check("etiqueta tridóshico en de: 'Tridoshisch'", () => {
  const r = scorePrakriti(answers(4, 8, 8), "de");
  assert.match(r.type, /Tridoshisch/);
});

check("etiqueta monodóshico en de: 'Kapha'", () => {
  const r = scorePrakriti(answers(0, 0, 20), "de");
  assert.equal(r.type, "Kapha");
});

console.log(`\n${passed} pruebas superadas. No se escribió memoria.`);
