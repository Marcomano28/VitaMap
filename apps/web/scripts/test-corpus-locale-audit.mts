import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { auditCorpusLocales } from "../lib/corpus-locale-audit";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-locale-audit-"));
try {
  await fs.writeFile(path.join(root, "README.md"), "# Not a card\n", "utf8");
  await fs.writeFile(
    path.join(root, "legacy.md"),
    "---\ntarjeta_id: legacy-card\nsource_kind: institutional-education\nsource_language: en\n---\nLegacy body.\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "de.md"),
    "---\ntarjeta_id: card-de\ncanonical_card_id: card\ncontent_locale: de\nlocalization_kind: translation\nlocalization_status: reviewed\neditorial_schema_version: 2\nsource_kind: institutional-education\nsource_language: de\n---\nDeutsch.\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(root, "en.md"),
    "---\ntarjeta_id: card-en\ncanonical_card_id: card\ncontent_locale: en\nlocalization_kind: translation\nlocalization_status: draft\neditorial_schema_version: 2\nsource_kind: institutional-education\nsource_language: en\n---\nEnglish.\n",
    "utf8",
  );
  const before = await fs.readFile(path.join(root, "legacy.md"), "utf8");
  const report = await auditCorpusLocales([root]);
  const after = await fs.readFile(path.join(root, "legacy.md"), "utf8");

  assert.equal(report.markdownFiles, 4);
  assert.equal(report.cards, 3);
  assert.equal(report.explicitByLocale.de, 1);
  assert.equal(report.explicitByLocale.en, 1);
  assert.equal(report.legacyAssumedBase, 1);
  assert.equal(report.backfillCandidates, 1);
  assert.deepEqual(report.sourceLanguages, { de: 1, en: 2 });
  assert.equal(before, after, "the audit must never mutate corpus files");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}

console.log("Auditoría de locales: inventario de solo lectura verificado.");
