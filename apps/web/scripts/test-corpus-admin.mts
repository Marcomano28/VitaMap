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

    const created = await createCorpusDraft(baseInput);
    assert.equal((await listCorpusDrafts()).length, 1);

    const updated = await updateCorpusDraft(created.id, {
      ...baseInput,
      title: "Updated clinical source",
      body: "This content is long enough to exercise the draft validation path.",
    });
    assert.equal(updated.title, "Updated clinical source");
    assert.equal((await listCorpusDrafts())[0]?.title, "Updated clinical source");

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
