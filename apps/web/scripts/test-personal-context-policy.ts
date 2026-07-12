import assert from "node:assert/strict";
import {
  isLatestLabRequest,
  isPersonalLabValueRequest,
  selectLatestLabItem,
} from "../lib/personal-context-policy";
import type { MemoryItem } from "../lib/memory-reader";

assert.equal(isLatestLabRequest("¿Qué resultados contiene mi última analítica?"), true);
assert.equal(isLatestLabRequest("Explícame el informe más reciente"), true);
assert.equal(isLatestLabRequest("Was steht in meinem neuesten Laborbericht?"), true);
assert.equal(isLatestLabRequest("Compara mis dos últimas analíticas"), false);
assert.equal(isLatestLabRequest("¿Cómo evolucionó mi LDL?"), false);
assert.equal(isPersonalLabValueRequest("¿Cómo está mi LDL?"), true);
assert.equal(isPersonalLabValueRequest("Compara mis valores de glucosa"), true);
assert.equal(isPersonalLabValueRequest("¿Qué es el colesterol LDL?"), false);
assert.equal(isPersonalLabValueRequest("¿Qué es el LDL?"), false);
assert.equal(isPersonalLabValueRequest("¿Qué alimentos afectan al LDL?"), false);

const item = (observedAt: string, type = "lab_result"): MemoryItem => ({
  relPath: `labs/${observedAt}.md`,
  category: "labs",
  type,
  observedAt,
  preview: "",
  frontmatter: {},
});

assert.equal(
  selectLatestLabItem([
    item("2026-05-12"),
    item("2026-07-03"),
    item("2026-01-22"),
    item("2027-01-01", "observation"),
  ])?.observedAt,
  "2026-07-03",
);
assert.equal(selectLatestLabItem([]), null);

console.log("Personal context policy: todas las pruebas pasaron.");
