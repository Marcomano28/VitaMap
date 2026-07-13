import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  composeEditorialCard,
  composeRetrievedEvidence,
  inferEditorialDepth,
  parseEditorialCard,
  readEditorialCard,
  serializeEditorialSections,
  serializeEditorialSectionsForPrompt,
} from "../lib/editorial-composition";

const CARD = `---
title: Glucosa en ayunas
source_kind: institutional-education
---

# Glucosa en ayunas

## En una frase

Mide la glucosa presente en la sangre después de varias horas sin comer.

## Una imagen para empezar

Imagina una ciudad que observa cómo circula su combustible cuando no llegan suministros de una comida.

## Qué significa realmente

El organismo sigue regulando y liberando glucosa durante el ayuno.

## Cómo se relaciona

Puede leerse junto con HbA1c, siempre atendiendo al contexto de cada prueba.

## Límites de la explicación

La metáfora no describe toda la fisiología y un valor aislado no establece una causa.

## Si quieres profundizar

El hígado, el páncreas y varias hormonas participan en la regulación.

## Fuentes

- Fuente institucional identificada.
`;

const parsed = parseEditorialCard(CARD, "markers/glucosa.md");
assert.ok(parsed);
assert.equal(parsed.schemaVersion, 1);

const GERMAN_V2_CARD = `---
title: LDL-Cholesterin verstehen
tarjeta_id: colesterol-ldl-interpretacion-de
canonical_card_id: colesterol-ldl-interpretacion
content_locale: de
localization_kind: translation
localization_status: reviewed
editorial_schema_version: 2
---

# LDL-Cholesterin

<!-- vitamap:block summary -->
## Kurz gesagt

LDL ist ein Transportpartikel für Cholesterin und andere Lipide.

<!-- vitamap:block analogy -->
## Ein Bild zum Einstieg

Man kann es sich wie ein Transportfahrzeug vorstellen.

<!-- vitamap:block literal -->
## Was es genau bedeutet

Der Laborwert beschreibt das in LDL-Partikeln transportierte Cholesterin.

<!-- vitamap:block relations -->
## Wie es zusammenhängt

LDL wird zusammen mit weiteren Werten des Lipidprofils betrachtet.

<!-- vitamap:block limitations -->
## Grenzen dieser Erklärung

Ein einzelner Wert bestimmt weder das Gesamtrisiko noch eine Behandlung.

<!-- vitamap:block deep_dive -->
## Wenn du tiefer einsteigen möchtest

Partikelzahl und Cholesteringehalt sind verwandte, aber verschiedene Größen.

<!-- vitamap:block sources -->
## Quellen

- Geprüfte institutionelle Quelle.
`;

const germanV2 = parseEditorialCard(GERMAN_V2_CARD, "markers/ldl-de.md");
assert.ok(germanV2);
assert.equal(germanV2.schemaVersion, 2);
assert.equal(germanV2.frontmatter.content_locale, "de");
assert.match(germanV2.sections.summary?.body ?? "", /Transportpartikel/);
assert.match(germanV2.sections.deepDive?.heading ?? "", /tiefer/);
for (const depth of ["discover", "understand", "deep"] as const) {
  assert.ok(composeEditorialCard(germanV2, depth));
}

const invalidV2 = parseEditorialCard(
  `---\neditorial_schema_version: 2\n---\n\n## Kurz gesagt\n\nOhne Anchor.`,
  "invalid-v2.md",
);
assert.equal(invalidV2, null);

const discover = composeEditorialCard(parsed, "discover");
assert.ok(discover);
const discoverText = serializeEditorialSections(discover);
assert.match(discoverText, /Una imagen para empezar/);
assert.match(discoverText, /Límites de la explicación/);
assert.match(discoverText, /Fuentes/);
assert.doesNotMatch(discoverText, /Qué significa realmente/);
assert.doesNotMatch(discoverText, /Cómo se relaciona/);
assert.doesNotMatch(discoverText, /Si quieres profundizar/);

const understand = composeEditorialCard(parsed, "understand");
assert.ok(understand);
const understandText = serializeEditorialSections(understand);
assert.match(understandText, /Cómo se relaciona/);
assert.doesNotMatch(understandText, /Una imagen para empezar/);
assert.doesNotMatch(understandText, /Si quieres profundizar/);

const deep = composeEditorialCard(parsed, "deep");
assert.ok(deep);
const deepText = serializeEditorialSections(deep);
assert.match(deepText, /Si quieres profundizar/);
assert.doesNotMatch(deepText, /En una frase/);
assert.doesNotMatch(deepText, /Una imagen para empezar/);
const bounded = serializeEditorialSectionsForPrompt([
  { id: "literal", heading: "Qué significa realmente", body: "dato ".repeat(1_000) },
  { id: "limitations", heading: "Límites de la explicación", body: "Límite obligatorio." },
  { id: "sources", heading: "Fuentes", body: "https://example.test/source" },
]);
assert.ok(bounded.length < 3_000);
assert.match(bounded, /Límite obligatorio/);
assert.match(bounded, /https:\/\/example\.test\/source/);
assert.equal(inferEditorialDepth("Explícamelo más fácil", "deep"), "discover");
assert.equal(inferEditorialDepth("Quiero más detalle", "discover"), "deep");
assert.equal(inferEditorialDepth("Was bedeutet LDL?", "understand"), "understand");

const incomplete = parseEditorialCard(`## En una frase\n\nSolo un bloque.`, "incomplete.md");
assert.ok(incomplete);
assert.equal(composeEditorialCard(incomplete, "discover"), null);

const duplicate = parseEditorialCard(
  `## En una frase\n\nUno.\n\n## En una frase\n\nDos.`,
  "duplicate.md",
);
assert.equal(duplicate, null);

async function testSafeReread() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-editorial-"));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-editorial-outside-"));
  try {
    await fs.mkdir(path.join(root, "markers"), { recursive: true });
    await fs.writeFile(path.join(root, "markers", "glucosa.md"), CARD, "utf8");
    const reread = await readEditorialCard(root, "markers/glucosa.md");
    assert.ok(reread);
    assert.equal(reread.relativePath, "markers/glucosa.md");

    await fs.writeFile(path.join(outside, "secret.md"), CARD, "utf8");
    assert.equal(
      await readEditorialCard(root, path.join("..", path.basename(outside), "secret.md")),
      null,
    );

    await fs.symlink(path.join(outside, "secret.md"), path.join(root, "markers", "link.md"));
    assert.equal(await readEditorialCard(root, "markers/link.md"), null);
    assert.equal(await readEditorialCard(root, "markers/glucosa.txt"), null);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await fs.rm(outside, { recursive: true, force: true });
  }
}

async function testPilotDrafts() {
  const drafts = [
    "colesterol-ldl/colesterol-ldl-interpretacion-medlineplus.md",
    "glucosa-en-ayunas/glucosa-en-ayunas-interpretacion-niddk.md",
    "glucosa-en-ayunas/glucosa-hba1c-lectura-conjunta-niddk.md",
  ];
  const root = path.resolve(
    process.cwd(),
    "../../corpus-preparation/source-material/borradores/migracion-multinivel",
  );

  for (const relativePath of drafts) {
    const card = await readEditorialCard(root, relativePath);
    assert.ok(card, `${relativePath}: debe releerse y parsearse`);
    for (const depth of ["discover", "understand", "deep"] as const) {
      const sections = composeEditorialCard(card, depth);
      assert.ok(sections, `${relativePath}: debe componer ${depth}`);
      const text = serializeEditorialSections(sections);
      assert.match(text, /## Límites de la explicación/);
      assert.match(text, /## Fuentes/);
    }
  }

  const jointCard = await readEditorialCard(root, drafts[2]);
  assert.ok(jointCard);
  assert.equal(jointCard.frontmatter.seccion, "lectura-conjunta");
  assert.deepEqual(jointCard.frontmatter.marker, ["glucosa-en-ayunas", "hba1c"]);

  const retrieved = await composeRetrievedEvidence(
    root,
    [
      {
        source: "evidence",
        docId: "ldl",
        path: drafts[0],
        title: "LDL",
        context: "",
        snippet: "CHUNK_INTERMEDIO",
        score: 1,
      },
      {
        source: "evidence",
        docId: "glucosa",
        path: drafts[1],
        title: "Glucosa",
        context: "",
        snippet: "SEGUNDO_CHUNK",
        score: 0.9,
      },
    ],
    "discover",
  );
  assert.equal(retrieved.composedPath, drafts[0]);
  assert.match(retrieved.chunks[0].snippet, /## En una frase/);
  assert.match(retrieved.chunks[0].snippet, /## Límites de la explicación/);
  assert.equal(retrieved.chunks[0].editorialDepth, "discover");
  assert.equal(retrieved.chunks[1].snippet, "SEGUNDO_CHUNK");

  const primaryClassic = await composeRetrievedEvidence(
    root,
    [
      {
        source: "evidence",
        docId: "lectura-conjunta-antigua",
        path: "no-estructurada.md",
        title: "Lectura conjunta",
        context: "",
        snippet: "CHUNK_D_PRINCIPAL",
        score: 1,
      },
      {
        source: "evidence",
        docId: "ldl-secundaria",
        path: drafts[0],
        title: "LDL",
        context: "",
        snippet: "CHUNK_A_SECUNDARIO",
        score: 0.9,
      },
    ],
    "deep",
  );
  assert.equal(primaryClassic.composedPath, undefined);
  assert.equal(primaryClassic.chunks[0].snippet, "CHUNK_D_PRINCIPAL");
  assert.equal(primaryClassic.chunks[1].snippet, "CHUNK_A_SECUNDARIO");
}

async function testGermanPilotDrafts() {
  const workspaceRoot = path.resolve(process.cwd(), "../..");
  const spanishRoot = path.join(
    workspaceRoot,
    "corpus-preparation/source-material/borradores/migracion-multinivel",
  );
  const germanRoot = path.join(
    workspaceRoot,
    "corpus-preparation/source-material/borradores/migracion-multinivel-de",
  );
  const pairs = [
    {
      source: "colesterol-ldl/colesterol-ldl-interpretacion-medlineplus.md",
      translation:
        "colesterol-ldl/colesterol-ldl-interpretacion-medlineplus-de.md",
    },
    {
      source: "glucosa-en-ayunas/glucosa-en-ayunas-interpretacion-niddk.md",
      translation:
        "glucosa-en-ayunas/glucosa-en-ayunas-interpretacion-niddk-de.md",
    },
    {
      source: "glucosa-en-ayunas/glucosa-hba1c-lectura-conjunta-niddk.md",
      translation:
        "glucosa-en-ayunas/glucosa-hba1c-lectura-conjunta-niddk-de.md",
    },
  ];

  for (const pair of pairs) {
    const sourceRaw = await fs.readFile(path.join(spanishRoot, pair.source), "utf8");
    const expectedChecksum = `sha256:${crypto
      .createHash("sha256")
      .update(sourceRaw, "utf8")
      .digest("hex")}`;
    const card = await readEditorialCard(germanRoot, pair.translation);
    assert.ok(card, `${pair.translation}: German rendition must parse`);
    assert.equal(card.schemaVersion, 2);
    assert.equal(card.frontmatter.content_locale, "de");
    assert.equal(card.frontmatter.localization_kind, "translation");
    assert.equal(card.frontmatter.localization_status, "draft");
    assert.equal(card.frontmatter.localized_from_version, 1);
    assert.equal(card.frontmatter.localized_from_checksum, expectedChecksum);
    assert.match(card.sections.summary?.heading ?? "", /Kurz gesagt/);
    assert.match(card.sections.limitations?.heading ?? "", /Grenzen/);
    for (const depth of ["discover", "understand", "deep"] as const) {
      const sections = composeEditorialCard(card, depth);
      assert.ok(sections, `${pair.translation}: must compose ${depth}`);
      const text = serializeEditorialSections(sections);
      assert.match(text, /## Quellen/);
      assert.match(text, /## Grenzen dieser Erklärung/);
    }
  }
}

async function testEnglishPilotDrafts() {
  const workspaceRoot = path.resolve(process.cwd(), "../..");
  const spanishRoot = path.join(
    workspaceRoot,
    "corpus-preparation/source-material/borradores/migracion-multinivel",
  );
  const englishRoot = path.join(
    workspaceRoot,
    "corpus-preparation/source-material/borradores/migracion-multinivel-en",
  );
  const pairs = [
    {
      source: "colesterol-ldl/colesterol-ldl-interpretacion-medlineplus.md",
      translation:
        "colesterol-ldl/colesterol-ldl-interpretacion-medlineplus-en.md",
    },
    {
      source: "glucosa-en-ayunas/glucosa-en-ayunas-interpretacion-niddk.md",
      translation:
        "glucosa-en-ayunas/glucosa-en-ayunas-interpretacion-niddk-en.md",
    },
    {
      source: "glucosa-en-ayunas/glucosa-hba1c-lectura-conjunta-niddk.md",
      translation:
        "glucosa-en-ayunas/glucosa-hba1c-lectura-conjunta-niddk-en.md",
    },
  ];

  for (const pair of pairs) {
    const sourceRaw = await fs.readFile(path.join(spanishRoot, pair.source), "utf8");
    const expectedChecksum = `sha256:${crypto
      .createHash("sha256")
      .update(sourceRaw, "utf8")
      .digest("hex")}`;
    const card = await readEditorialCard(englishRoot, pair.translation);
    assert.ok(card, `${pair.translation}: English rendition must parse`);
    assert.equal(card.schemaVersion, 2);
    assert.equal(card.frontmatter.content_locale, "en");
    assert.equal(card.frontmatter.localization_kind, "translation");
    assert.equal(card.frontmatter.localization_status, "draft");
    assert.equal(card.frontmatter.localized_from_checksum, expectedChecksum);
    assert.match(card.sections.summary?.heading ?? "", /In one sentence/);
    assert.match(card.sections.limitations?.heading ?? "", /Limits/);
    for (const depth of ["discover", "understand", "deep"] as const) {
      const sections = composeEditorialCard(card, depth);
      assert.ok(sections, `${pair.translation}: must compose ${depth}`);
      const text = serializeEditorialSections(sections);
      assert.match(text, /## Sources/);
      assert.match(text, /## Limits of this explanation/);
    }
  }
}

Promise.all([
  testSafeReread(),
  testPilotDrafts(),
  testGermanPilotDrafts(),
  testEnglishPilotDrafts(),
])
  .then(() => {
    console.log("Composición editorial: relectura segura y profundidades verificadas.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
