import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildLabSeries,
  canonicalMarkerId,
  canonicalUnit,
  normalizeLabMarker,
  parseReferenceRange,
} from "../lib/lab-visualization";
import { buildMeasurementTracks } from "../lib/lab-tracks";

assert.equal(canonicalMarkerId("LDL"), "colesterol-ldl");
assert.equal(canonicalMarkerId("LDL Cholesterin"), "colesterol-ldl");
assert.equal(canonicalMarkerId("marcador inventado"), null);
assert.equal(canonicalUnit("mg/dl"), "mg/dL");
assert.equal(canonicalUnit("µmol/L"), "umol/L");
assert.equal(canonicalUnit("unidad rara"), null);
assert.deepEqual(parseReferenceRange("30 - 300", "ug/L"), {
  low: 30,
  high: 300,
  unitUcum: "ug/L",
});
assert.deepEqual(parseReferenceRange("< 116", "mg/dL"), {
  low: null,
  high: 116,
  unitUcum: "mg/dL",
});
assert.equal(parseReferenceRange("según edad", "mg/dL"), null);

const normalized = normalizeLabMarker({
  name: "LDL",
  value: 139,
  unit: "mg/dl",
  reference_range: "< 116",
  flag: "high",
  marker_id: null,
  unit_ucum: null,
  reference_range_structured: null,
  normalization_status: "raw",
});
assert.equal(normalized.marker_id, "colesterol-ldl");
assert.equal(normalized.normalization_status, "candidate");

const series = buildLabSeries(
  [
    {
      relPath: "labs/2026-01-01-a.md",
      frontmatter: {
        type: "lab_result",
        observed_at: "2026-01-01",
        lab_name: "A",
        markers: [{ ...normalized, value: 145 }],
      },
    },
    {
      relPath: "labs/2026-05-12-b.md",
      frontmatter: {
        type: "lab_result",
        observed_at: "2026-05-12",
        lab_name: "B",
        markers: [normalized],
      },
    },
  ],
  "colesterol-ldl",
);
assert.equal(series.points.length, 2);
assert.equal(series.comparability, "comparable");
assert.deepEqual(series.points.map((point) => point.observedAt), ["2026-01-01", "2026-05-12"]);
assert.equal(series.points[0].referenceOriginal, "< 116");

const partialSeries = buildLabSeries(
  [
    {
      relPath: "labs/a.md",
      frontmatter: {
        type: "lab_result",
        observed_at: "2026-01-01",
        markers: [{ ...normalized, value: 145 }],
      },
    },
    {
      relPath: "labs/b.md",
      frontmatter: {
        type: "lab_result",
        observed_at: "2026-05-12",
        markers: [{ ...normalized, value: 3.4, unit: "mmol/L", unit_ucum: "mmol/L" }],
      },
    },
  ],
  "colesterol-ldl",
);
assert.equal(partialSeries.comparability, "partial");
assert.match(partialSeries.warnings.join(" "), /unidades diferentes/);
const partialTracks = buildMeasurementTracks(partialSeries);
assert.equal(partialTracks.length, 2);
assert.equal(partialTracks.find((track) => track.unitKey === "mg/dL")?.connectable, false);
assert.equal(partialTracks.find((track) => track.unitKey === "mmol/L")?.connectable, false);

const invalidDateSeries = buildLabSeries(
  [
    {
      relPath: "labs/invalid.md",
      frontmatter: {
        type: "lab_result",
        observed_at: "2026-02-31",
        markers: [normalized],
      },
    },
  ],
  "colesterol-ldl",
);
assert.equal(invalidDateSeries.points.length, 0);

interface FixtureReport {
  id: string;
  lab_name: string;
  observed_at: string;
  markers: unknown[];
}

const fixturePath = path.resolve(
  process.cwd(),
  "../../test-data/longitudinal/expected.json",
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
  reports: FixtureReport[];
};
const fixtureDocuments = fixture.reports.map((report) => ({
  relPath: `labs/${report.id}.md`,
  frontmatter: {
    type: "lab_result",
    observed_at: report.observed_at,
    lab_name: report.lab_name,
    markers: report.markers,
  },
}));
const fixtureComparable = buildLabSeries(fixtureDocuments.slice(0, 3), "colesterol-ldl");
assert.equal(fixtureComparable.points.length, 3);
assert.equal(fixtureComparable.comparability, "comparable");
assert.deepEqual(fixtureComparable.points.map((point) => point.value), [151, 145, 139]);
const fixtureInterrupted = buildLabSeries(fixtureDocuments, "colesterol-ldl");
assert.equal(fixtureInterrupted.points.length, 4);
assert.equal(fixtureInterrupted.comparability, "partial");
assert.deepEqual([...new Set(fixtureInterrupted.points.map((point) => point.unitUcum))], [
  "mg/dL",
  "mmol/L",
]);
const interruptedTracks = buildMeasurementTracks(fixtureInterrupted);
assert.equal(interruptedTracks.find((track) => track.unitKey === "mg/dL")?.points.length, 3);
assert.equal(interruptedTracks.find((track) => track.unitKey === "mg/dL")?.connectable, true);
assert.equal(interruptedTracks.find((track) => track.unitKey === "mmol/L")?.points.length, 1);
assert.equal(canonicalMarkerId("HDL Cholesterin"), "colesterol-hdl");
assert.equal(canonicalMarkerId("Glukose nuechtern"), "glucosa-en-ayunas");

console.log("test-lab-visualization: OK");
