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

    await assert.rejects(
      publishCorpusDraft(created.id, "admin@example.com"),
      /rights do not permit publication/,
    );
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
