import assert from "node:assert/strict";
import { qmdHitSnippet, qmdRelativePath } from "../lib/qmd-hit";

const hit = {
  displayPath: "memory/labs/analitica-sintetica-01.md",
  bestChunk:
    "Glucosa en ayunas: 112 mg/dL (referencia 70-99)\nVitamina D: 18 ng/mL (referencia 30-100)",
  body: "contenido completo",
};

assert.equal(
  qmdRelativePath(hit, "memory"),
  "labs/analitica-sintetica-01.md",
);
assert.match(qmdHitSnippet(hit), /Glucosa en ayunas: 112/);
assert.match(qmdHitSnippet(hit), /Vitamina D: 18/);
assert.equal(
  qmdRelativePath({ path: "qmd://kb/glucosa.md" }, "kb"),
  "glucosa.md",
);
assert.equal(qmdHitSnippet({ snippet: "compatibilidad anterior" }), "compatibilidad anterior");
assert.equal(qmdHitSnippet({ body: "respaldo completo" }), "respaldo completo");

console.log("QMD hit: todas las pruebas pasaron.");
