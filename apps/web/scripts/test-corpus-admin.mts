import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function markdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(absolute);
    }
  }

  await walk(root);
  return files.sort();
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-corpus-admin-"));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = path.resolve(scriptDir, "..", "..", "..");

  process.env.LLM_BASE_URL = "http://localhost:8080/v1";
  process.env.LLM_MODEL = "test-model";
  process.env.LLM_API_KEY = "test-key";
  process.env.QMD_EMBED_MODEL = "test-embedding";
  process.env.DATA_ROOT = root;
  process.env.KB_INDEX_PATH = path.join(root, "kb-index.sqlite");
  process.env.AUTH_DB_PATH = path.join(root, "auth.sqlite");
  process.env.MASTER_KEY = "a".repeat(64);
  process.env.BETTER_AUTH_SECRET = "b".repeat(64);
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  process.env.ADMIN_EMAILS = "Admin@Example.com, second@example.com";
  process.env["NODE_ENV"] = "test";

  const { isAdminEmail, parseAdminEmails } = await import("../lib/admin");
  const {
    CorpusDraftInputSchema,
    createCorpusDraft,
    deleteCorpusDraft,
    listCorpusDrafts,
    listPublishedCorpus,
    isSameCorpusRendition,
    publishCorpusDraft,
    retireCorpusDocument,
    updateCorpusDraft,
  } = await import("../lib/corpus-admin");
  const { corpusDraftInputFromForm } = await import("../lib/corpus-import");

  const baseInput = {
    title: "Clinical source under review",
    sourceUrl: "https://example.org/guideline",
    doi: undefined,
    pmid: undefined,
    publicationDate: "2026-01-15",
    sourceKind: "clinical-evidence" as const,
    sourceType: "clinical-guideline",
    rightsStatus: "metadata-only" as const,
    limitations: ["Example fixture"],
    body: "",
  };

  try {
    assert.deepEqual(
      [...parseAdminEmails(process.env.ADMIN_EMAILS)].sort(),
      ["admin@example.com", "second@example.com"],
    );
    assert.equal(isAdminEmail("ADMIN@example.com"), true);
    assert.equal(isAdminEmail("reader@example.com"), false);
    assert.equal(
      CorpusDraftInputSchema.safeParse({
        ...baseInput,
        publicationDate: "2022-07",
      }).success,
      true,
    );
    assert.equal(
      CorpusDraftInputSchema.safeParse({
        ...baseInput,
        publicationDate: "2022-13",
      }).success,
      false,
    );
    assert.equal(
      isSameCorpusRendition(
        { extraFrontmatter: { tarjeta_id: "legacy-card" } },
        {
          extraFrontmatter: {
            tarjeta_id: "legacy-card",
            canonical_card_id: "legacy-card",
            content_locale: "es",
          },
        },
      ),
      true,
    );
    assert.equal(
      isSameCorpusRendition(
        { extraFrontmatter: { tarjeta_id: "legacy-card" } },
        {
          extraFrontmatter: {
            tarjeta_id: "legacy-card",
            canonical_card_id: "legacy-card",
            content_locale: "de",
          },
        },
      ),
      false,
    );
    const localizedMetadata = {
      tarjeta_id: "fixture-localized-es",
      canonical_card_id: "fixture-localized",
      content_locale: "es",
      localization_kind: "original",
      localization_status: "draft",
      editorial_schema_version: 2,
    };
    assert.equal(
      CorpusDraftInputSchema.safeParse({
        ...baseInput,
        extraFrontmatter: localizedMetadata,
      }).success,
      true,
    );
    assert.equal(
      CorpusDraftInputSchema.safeParse({
        ...baseInput,
        extraFrontmatter: {
          ...localizedMetadata,
          tarjeta_id: "fixture-localized-de",
          content_locale: "de",
          localization_kind: "translation",
          localized_from: "fixture-localized-es",
          localized_from_version: 1,
        },
      }).success,
      false,
    );

    const preparedDir = path.join(
      workspaceRoot,
      "corpus-preparation",
      "approved-current-structure",
    );
    const preparedFiles = await markdownFiles(preparedDir);
    assert.ok(preparedFiles.length > 0);
    for (const file of preparedFiles) {
      const markdown = await fs.readFile(file, "utf8");
      const imported = corpusDraftInputFromForm(new FormData(), markdown);
      const validated = CorpusDraftInputSchema.parse(imported);
      assert.ok(validated.title.length > 3);
      assert.ok(validated.sourceUrl?.startsWith("https://"));
      assert.ok(validated.body.length > 20);
      assert.ok(validated.limitations.length > 0);
    }
    const layeredDraftDir = path.join(
      workspaceRoot,
      "corpus-preparation",
      "source-material",
      "borradores",
      "migracion-multinivel",
    );
    const layeredDraftFiles = (await markdownFiles(layeredDraftDir)).filter(
      (file) => path.basename(file).toLowerCase() !== "readme.md",
    );
    assert.ok(layeredDraftFiles.length >= 3);
    for (const file of layeredDraftFiles) {
      const imported = corpusDraftInputFromForm(
        new FormData(),
        await fs.readFile(file, "utf8"),
      );
      const validated = CorpusDraftInputSchema.parse(imported);
      assert.ok(validated.extraFrontmatter?.tarjeta_id);
      assert.ok(validated.body.includes("## Límites de la explicación"));
      assert.ok(validated.body.includes("## Fuentes"));
    }
    const germanLayeredDraftDir = path.join(
      workspaceRoot,
      "corpus-preparation",
      "source-material",
      "borradores",
      "migracion-multinivel-de",
    );
    const germanLayeredDraftFiles = (await markdownFiles(germanLayeredDraftDir)).filter(
      (file) => path.basename(file).toLowerCase() !== "readme.md",
    );
    assert.equal(germanLayeredDraftFiles.length, 3);
    for (const file of germanLayeredDraftFiles) {
      const imported = corpusDraftInputFromForm(
        new FormData(),
        await fs.readFile(file, "utf8"),
      );
      const validated = CorpusDraftInputSchema.parse(imported);
      assert.equal(validated.extraFrontmatter?.content_locale, "de");
      assert.equal(validated.extraFrontmatter?.localization_kind, "translation");
      assert.equal(validated.extraFrontmatter?.localization_status, "draft");
      assert.match(
        String(validated.extraFrontmatter?.localized_from_checksum),
        /^sha256:[a-f0-9]{64}$/,
      );
      assert.ok(validated.body.includes("<!-- vitamap:block summary -->"));
      assert.ok(validated.body.includes("## Grenzen dieser Erklärung"));
      assert.ok(validated.body.includes("## Quellen"));
    }
    const englishLayeredDraftDir = path.join(
      workspaceRoot,
      "corpus-preparation",
      "source-material",
      "borradores",
      "migracion-multinivel-en",
    );
    const englishLayeredDraftFiles = (await markdownFiles(englishLayeredDraftDir)).filter(
      (file) => path.basename(file).toLowerCase() !== "readme.md",
    );
    assert.equal(englishLayeredDraftFiles.length, 3);
    for (const file of englishLayeredDraftFiles) {
      const imported = corpusDraftInputFromForm(
        new FormData(),
        await fs.readFile(file, "utf8"),
      );
      const validated = CorpusDraftInputSchema.parse(imported);
      assert.equal(validated.extraFrontmatter?.content_locale, "en");
      assert.equal(validated.extraFrontmatter?.localization_kind, "translation");
      assert.equal(validated.extraFrontmatter?.localization_status, "draft");
      assert.match(
        String(validated.extraFrontmatter?.localized_from_checksum),
        /^sha256:[a-f0-9]{64}$/,
      );
      assert.ok(validated.body.includes("<!-- vitamap:block summary -->"));
      assert.ok(validated.body.includes("## Limits of this explanation"));
      assert.ok(validated.body.includes("## Sources"));
    }
    const importedWithEvidence = corpusDraftInputFromForm(
      new FormData(),
      `---
title: Evidence preservation fixture
source_url: https://example.org/evidence
source_kind: clinical-evidence
source_type: natural-product-evidence-summary
rights_status: permitted
limitations:
  - Fixture only
evidence:
  certeza: moderada
  direccion: a-favor
  poblacion: adultos
  motivos_descenso:
    - imprecision
---

Body long enough to pass corpus draft validation.
`,
    );
    const validatedWithEvidence = CorpusDraftInputSchema.parse(importedWithEvidence);
    assert.deepEqual(validatedWithEvidence.extraFrontmatter?.evidence, {
      certeza: "moderada",
      direccion: "a-favor",
      poblacion: "adultos",
      motivos_descenso: ["imprecision"],
    });

    const curiosityReserveDir = path.join(
      workspaceRoot,
      "corpus-preparation",
      "source-material",
      "borradores",
      "pausa-curiosa-general",
    );
    const curiosityReserveFiles = (await markdownFiles(curiosityReserveDir)).filter(
      (file) => !["README.md", "AUDITORIA-FUENTES.md", "PROPUESTA-TAXONOMIA.md"].includes(
        path.basename(file),
      ),
    );
    assert.equal(curiosityReserveFiles.length, 7);
    for (const file of curiosityReserveFiles) {
      const imported = corpusDraftInputFromForm(
        new FormData(),
        await fs.readFile(file, "utf8"),
      );
      const validated = CorpusDraftInputSchema.parse(imported);
      assert.equal(validated.sourceType, "science-curiosity-summary");
      assert.equal(validated.extraFrontmatter?.taxonomy_status, "proposed");
      assert.ok(Array.isArray(validated.extraFrontmatter?.topic));
      assert.ok(validated.limitations.length >= 3);
      assert.match(validated.body, /## Fuente principal/);
    }

    const created = await createCorpusDraft(baseInput);
    assert.equal((await listCorpusDrafts()).length, 1);

    const updated = await updateCorpusDraft(created.id, {
      ...baseInput,
      title: "Updated clinical source",
      body: "This content is long enough to exercise the draft validation path.",
    });
    assert.equal(updated.title, "Updated clinical source");
    assert.equal((await listCorpusDrafts())[0]?.title, "Updated clinical source");

    const evidenceDraft = await createCorpusDraft({
      ...baseInput,
      title: "Draft with imported evidence",
      rightsStatus: "permitted",
      body: "This imported content is long enough to keep extra frontmatter.",
      extraFrontmatter: {
        marker: ["berberina"],
        evidence: {
          certeza: "baja",
          direccion: "a-favor",
          motivos_descenso: ["riesgo-de-sesgo"],
        },
      },
    });
    await updateCorpusDraft(evidenceDraft.id, {
      ...baseInput,
      title: "Draft with edited title",
      rightsStatus: "permitted",
      body: "This edited content keeps the imported extra frontmatter.",
    });
    const editedEvidenceDraft = (await listCorpusDrafts()).find(
      (document) => document.id === evidenceDraft.id,
    );
    assert.deepEqual(editedEvidenceDraft?.extraFrontmatter?.evidence, {
      certeza: "baja",
      direccion: "a-favor",
      motivos_descenso: ["riesgo-de-sesgo"],
    });
    await deleteCorpusDraft(evidenceDraft.id);

    const versionedInput = {
      ...baseInput,
      title: "Versioned educational card",
      rightsStatus: "permitted" as const,
      body: "First published version with enough reviewed educational content.",
      extraFrontmatter: {
        tarjeta_id: "fixture-versioned-card",
        marker: ["glucosa-en-ayunas"],
      },
    };
    const firstVersion = await createCorpusDraft(versionedInput);
    const firstPublished = await publishCorpusDraft(firstVersion.id, "admin@example.com", {
      reindex: async () => undefined,
    });
    assert.equal((await listPublishedCorpus()).length, 1);

    const secondVersion = await createCorpusDraft({
      ...versionedInput,
      body: "Second published version replaces the first without duplicate retrieval.",
    });
    await assert.rejects(
      publishCorpusDraft(secondVersion.id, "admin@example.com", {
        reindex: async () => undefined,
      }),
      /explicit replacement required/,
    );
    const replacement = await publishCorpusDraft(secondVersion.id, "admin@example.com", {
      replaceExisting: true,
      reindex: async () => undefined,
    });
    assert.equal(replacement.replacedRelativePath, firstPublished.relativePath);
    const afterReplacement = await listPublishedCorpus();
    assert.equal(afterReplacement.length, 1);
    assert.match(afterReplacement[0].body, /Second published version/);
    const replacementRaw = await fs.readFile(
      path.join(root, "kb", afterReplacement[0].relativePath),
      "utf8",
    );
    assert.match(replacementRaw, /version: 2/);
    assert.match(replacementRaw, /replaces:/);
    assert.equal((await markdownFiles(path.join(root, "kb-retired"))).length, 1);

    const failedVersion = await createCorpusDraft({
      ...versionedInput,
      body: "This replacement must roll back when the index update fails.",
    });
    await assert.rejects(
      publishCorpusDraft(failedVersion.id, "admin@example.com", {
        replaceExisting: true,
        reindex: async () => {
          throw new Error("simulated reindex failure");
        },
      }),
      /simulated reindex failure/,
    );
    const afterRollback = await listPublishedCorpus();
    assert.equal(afterRollback.length, 1);
    assert.match(afterRollback[0].body, /Second published version/);
    assert.ok((await listCorpusDrafts()).some((item) => item.id === failedVersion.id));
    await deleteCorpusDraft(failedVersion.id);

    const localizedEs = await createCorpusDraft({
      ...baseInput,
      title: "Localized concept in Spanish",
      rightsStatus: "permitted",
      body: "Contenido editorial español revisado y suficientemente extenso.",
      extraFrontmatter: localizedMetadata,
    });
    const publishedEs = await publishCorpusDraft(localizedEs.id, "admin@example.com", {
      reindex: async () => undefined,
    });
    assert.equal(publishedEs.extraFrontmatter?.localization_status, "reviewed");

    const localizedDe = await createCorpusDraft({
      ...baseInput,
      title: "Lokalisiertes Konzept auf Deutsch",
      rightsStatus: "permitted",
      body: "Geprüfter deutscher Inhalt mit ausreichender Länge für die Veröffentlichung.",
      extraFrontmatter: {
        ...localizedMetadata,
        tarjeta_id: "fixture-localized-de",
        content_locale: "de",
        localization_kind: "translation",
        localized_from: "fixture-localized-es",
        localized_from_version: 1,
        localized_from_checksum: `sha256:${"a".repeat(64)}`,
      },
    });
    assert.equal(isSameCorpusRendition(localizedEs, localizedDe), false);
    const publishedDe = await publishCorpusDraft(localizedDe.id, "admin@example.com", {
      reindex: async () => undefined,
    });
    assert.equal(publishedDe.extraFrontmatter?.localization_status, "reviewed");
    const localizedPublished = (await listPublishedCorpus()).filter(
      (document) =>
        document.extraFrontmatter?.canonical_card_id === "fixture-localized",
    );
    assert.equal(localizedPublished.length, 2);

    const machineDraft = await createCorpusDraft({
      ...baseInput,
      title: "Machine draft must stay unpublished",
      rightsStatus: "permitted",
      body: "This machine-generated localization has not received human review yet.",
      extraFrontmatter: {
        ...localizedMetadata,
        tarjeta_id: "fixture-machine-de",
        canonical_card_id: "fixture-machine",
        content_locale: "de",
        localization_kind: "translation",
        localization_status: "machine-draft",
        localized_from: "fixture-machine-es",
        localized_from_version: 1,
        localized_from_checksum: `sha256:${"b".repeat(64)}`,
      },
    });
    await assert.rejects(
      publishCorpusDraft(machineDraft.id, "admin@example.com", {
        reindex: async () => undefined,
      }),
      /localization must be reviewed and current/,
    );
    await deleteCorpusDraft(machineDraft.id);

    const englishReserveDraft = await createCorpusDraft({
      ...baseInput,
      title: "English content-locale reserve",
      rightsStatus: "permitted",
      body: "Reviewed English rendition stored before English becomes a public locale.",
      extraFrontmatter: {
        ...localizedMetadata,
        tarjeta_id: "fixture-reserve-en",
        canonical_card_id: "fixture-reserve",
        content_locale: "en",
        localization_kind: "translation",
        localization_status: "draft",
        localized_from: "fixture-reserve-es",
        localized_from_version: 1,
        localized_from_checksum: `sha256:${"c".repeat(64)}`,
      },
    });
    await assert.rejects(
      publishCorpusDraft(englishReserveDraft.id, "admin@example.com", {
        reindex: async () => undefined,
      }),
      /content locale is stored but not enabled for publication/,
    );
    await deleteCorpusDraft(englishReserveDraft.id);

    await assert.rejects(
      publishCorpusDraft(created.id, "admin@example.com"),
      /rights do not permit publication/,
    );
    const proposedTaxonomyDraft = await createCorpusDraft({
      ...versionedInput,
      title: "Reserved curiosity with proposed taxonomy",
      body: "This curiosity must remain blocked until its taxonomy is canonical.",
      extraFrontmatter: {
        tarjeta_id: "fixture-proposed-curiosity",
        taxonomy_status: "proposed",
        topic: ["proposed-topic"],
      },
    });
    await assert.rejects(
      publishCorpusDraft(proposedTaxonomyDraft.id, "admin@example.com", {
        reindex: async () => undefined,
      }),
      /proposed taxonomy must be approved/,
    );
    assert.ok((await listCorpusDrafts()).some((item) => item.id === proposedTaxonomyDraft.id));
    await deleteCorpusDraft(proposedTaxonomyDraft.id);
    const traditionDraft = await createCorpusDraft({
      ...baseInput,
      title: "Institutional overview of a traditional system",
      sourceKind: "tradition-context",
    });
    assert.equal(traditionDraft.sourceKind, "tradition-context");
    await deleteCorpusDraft(traditionDraft.id);
    await assert.rejects(
      retireCorpusDocument("../outside.md"),
      /invalid corpus path|escapes its root/,
    );

    await deleteCorpusDraft(created.id);
    assert.equal((await listCorpusDrafts()).length, 0);
    console.log("corpus admin tests: ok");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
