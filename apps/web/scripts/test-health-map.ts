import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildHealthMapModel, selectInlineLabSeries } from "../lib/health-map";
import { buildLabSeries } from "../lib/lab-visualization";

const fixturePath = path.resolve(process.cwd(), "../../test-data/longitudinal/expected.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
  reports: Array<{ id: string; observed_at: string; lab_name: string; markers: unknown[] }>;
};
const documents = fixture.reports.map((report) => ({
  relPath: `labs/${report.id}.md`,
  frontmatter: {
    type: "lab_result",
    observed_at: report.observed_at,
    lab_name: report.lab_name,
    markers: report.markers,
  },
}));
const markerIds = [
  "glucosa-en-ayunas",
  "colesterol-ldl",
  "ferritina",
  "proteina-c-reactiva",
  "tsh",
  "vitamina-d",
];
const model = buildHealthMapModel(
  markerIds.map((markerId) => buildLabSeries(documents, markerId)),
  "es",
);

assert.equal(model.latestObservedAt, "2026-07-03");
assert.equal(model.schemaVersion, 1);
assert.equal(model.policy.convertsUnits, false);
assert.deepEqual(model.edges, []);
assert.equal(model.reportCount, 4);
assert.equal(
  model.markers.find((marker) => marker.id === "colesterol-ldl")?.territoryId,
  "cardiovascular",
);
assert.equal(
  model.markers.find((marker) => marker.id === "glucosa-en-ayunas")?.territoryId,
  "metabolic",
);
assert.equal(
  model.markers.find((marker) => marker.id === "ferritina")?.territoryId,
  "blood",
);
assert.equal(
  model.markers.find((marker) => marker.id === "colesterol-ldl")?.series.comparability,
  "partial",
);
assert.ok(model.territories.every((territory) => territory.markerIds.length > 0));
assert.ok(model.territories.every((territory) => territory.semanticMeaning === "navigation-membership"));
const serialized = JSON.stringify(model);
assert.doesNotMatch(serialized, /original_document|frontmatter|userId|notes|ocr/i);

const inlineLatest = selectInlineLabSeries(
  markerIds.map((markerId) => buildLabSeries(documents, markerId)),
  true,
  3,
);
assert.equal(inlineLatest.length, 3);
assert.ok(
  inlineLatest.every(
    (series) =>
      series.points.length === 1 &&
      series.points[0].observedAt === "2026-07-03",
  ),
);
const inlineEvolution = selectInlineLabSeries(
  [buildLabSeries(documents, "colesterol-ldl")],
  false,
  3,
);
assert.equal(inlineEvolution[0].points.length, 4);

console.log("Health map: todas las pruebas pasaron.");
