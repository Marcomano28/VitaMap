import assert from "node:assert/strict";
import { buildLabMarkerAnswer } from "../lib/lab-chat-fallback";
import type { LabSeries } from "../lib/lab-visualization";

const series: LabSeries = {
  markerId: "colesterol-ldl",
  comparability: "partial",
  warnings: [],
  points: [
    {
      markerId: "colesterol-ldl",
      value: 139,
      unitOriginal: "mg/dL",
      unitUcum: "mg/dL",
      observedAt: "2026-05-12",
      labName: null,
      sourcePath: "labs/may.md",
      reference: { low: null, high: 116, unitUcum: "mg/dL" },
      normalizationStatus: "candidate",
    },
    {
      markerId: "colesterol-ldl",
      value: 3.4,
      unitOriginal: "mmol/L",
      unitUcum: "mmol/L",
      observedAt: "2026-07-03",
      labName: null,
      sourcePath: "labs/july.md",
      reference: { low: null, high: 3, unitUcum: "mmol/L" },
      normalizationStatus: "candidate",
    },
  ],
};

const answer = buildLabMarkerAnswer(series, "es");
assert.match(answer ?? "", /139 mg\/dL/);
assert.match(answer ?? "", /3,4 mmol\/L/);
assert.match(answer ?? "", /unidades diferentes/);
assert.doesNotMatch(answer ?? "", /131 mg\/dL|equivale|rango normal|saludable/i);

const latest = buildLabMarkerAnswer(series, "es", true);
assert.doesNotMatch(latest ?? "", /139 mg\/dL/);
assert.match(latest ?? "", /3,4 mmol\/L/);

console.log("Lab chat fallback: todas las pruebas pasaron.");
