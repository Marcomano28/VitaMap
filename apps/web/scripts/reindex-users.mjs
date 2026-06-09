import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "@tobilu/qmd";

const SAFE_USER_ID = /^[a-zA-Z0-9_-]{8,64}$/;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..", "..", "..");

async function reindexUser(dataRoot, userId) {
  const memoryDir = path.join(dataRoot, "users", userId, "memory");
  const dbPath = path.join(dataRoot, "users", userId, "index.sqlite");
  await fs.mkdir(memoryDir, { recursive: true });
  const store = await createStore({
    dbPath,
    config: {
      collections: {
        memory: { path: memoryDir, pattern: "**/*.md" },
      },
    },
  });
  try {
    await store.update({ collections: ["memory"] });
    await store.embed({ force: false });
  } finally {
    await store.close();
  }
}

async function main() {
  const configuredDataRoot = process.env.DATA_ROOT;
  if (!configuredDataRoot) throw new Error("DATA_ROOT is not set");
  const dataRoot = path.isAbsolute(configuredDataRoot)
    ? configuredDataRoot
    : path.resolve(workspaceRoot, configuredDataRoot);
  const usersRoot = path.join(dataRoot, "users");
  const entries = await fs.readdir(usersRoot, { withFileTypes: true }).catch(
    (err) => {
      if (err?.code === "ENOENT") return [];
      throw err;
    },
  );
  const userIds = entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        SAFE_USER_ID.test(entry.name),
    )
    .map((entry) => entry.name);

  if (userIds.length === 0) {
    console.log("[reindex-users] no hay usuarios para indexar");
    return;
  }

  let failed = 0;
  for (const userId of userIds) {
    try {
      await reindexUser(dataRoot, userId);
      console.log(`[reindex-users] OK ${userId}`);
    } catch (err) {
      failed += 1;
      console.error(`[reindex-users] FALLO ${userId}`, err);
    }
  }

  if (failed > 0) {
    throw new Error(`[reindex-users] ${failed} usuario(s) no indexados`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
