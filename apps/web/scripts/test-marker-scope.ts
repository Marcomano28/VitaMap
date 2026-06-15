import assert from "node:assert/strict";
import { markersIn, keepDoc, filterByMarkers } from "../lib/marker-scope";

// --- markersIn: detección por nombre, con acentos y separadores -------------
assert.deepEqual([...markersIn("LDL 139 mg/dL")], ["ldl"]);
assert.ok(markersIn("Glucosa en ayunas 112").has("glucosa"));
assert.ok(markersIn("Vitamina D 18 ng/mL").has("vitamina-d"));
assert.ok(markersIn("pruebas-hepaticas-alt-ast-alp-y-ggt").has("higado"));
// no debe confundir palabras que contienen el alias ("salt" no es "alt")
assert.equal(markersIn("resultado salt water").has("higado"), false);

// --- Conjunto de marcadores del panel sintético (los 11 de la analítica) -----
const analitica =
  "Hemoglobina 14.2 | Leucocitos 6.4 | Plaquetas 248 | Glucosa en ayunas 112 | " +
  "Creatinina 0.88 | Colesterol total 218 | HDL 62 | LDL 139 | " +
  "Trigliceridos 86 | TSH 2.10 | Vitamina D 18";
const allowed = markersIn(analitica);
assert.ok(allowed.has("ldl") && allowed.has("glucosa") && allowed.has("vitamina-d"));
assert.equal(allowed.has("higado"), false, "la analítica sintética no tiene hígado");

// --- keepDoc: el corazón del arreglo ----------------------------------------
// El doc hepático NO debe conservarse (el bug observado).
assert.equal(
  keepDoc("institutional-education/pruebas-hepaticas-alt-ast-alp-y-ggt-preparacion.md Pruebas hepáticas", allowed),
  false,
  "doc hepático debe filtrarse fuera de una analítica sin hígado",
);
// Los docs del marcador en juego SÍ se conservan.
assert.equal(
  keepDoc("markers/colesterol/colesterol-ldl-interpretacion-medlineplus.md Colesterol LDL", allowed),
  true,
);
assert.equal(
  keepDoc("glucosa/glucosa-plasmatica-en-ayunas-interpretacion.md Glucosa plasmática", allowed),
  true,
);
// Un doc transversal sin marcador conocido se conserva (no sobre-filtrar).
assert.equal(keepDoc("ayuno-antes-de-un-analisis-de-sangre.md Ayuno antes de un análisis", allowed), true);
assert.equal(keepDoc("interferencias-analiticas.md Interferencias analíticas", allowed), true);

// --- filterByMarkers: integración sobre una lista ---------------------------
const docs = [
  { path: "markers/colesterol/colesterol-ldl-interpretacion.md", title: "Colesterol LDL" },
  { path: "institutional-education/pruebas-hepaticas-alt-ast.md", title: "Pruebas hepáticas" },
  { path: "glucosa/glucosa-en-ayunas-interpretacion.md", title: "Glucosa en ayunas" },
];
const kept = filterByMarkers(docs, allowed).map((d) => d.title);
assert.deepEqual(kept, ["Colesterol LDL", "Glucosa en ayunas"], "el hepático queda fuera");

// Conservador: sin marcadores permitidos, no filtra.
assert.equal(filterByMarkers(docs, new Set()).length, 3);

console.log("test-marker-scope: OK (todas las aserciones pasaron)");
