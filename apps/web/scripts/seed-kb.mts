#!/usr/bin/env tsx
/**
 * Indexa la base de conocimiento científica en data/kb/ contra el store
 * compartido KB_INDEX_PATH.
 *
 * Uso:
 *   npm run seed-kb              # incremental
 *   npm run seed-kb -- --force   # reembed completo
 *
 * Lee .env desde la raíz del workspace.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStore } from "@tobilu/qmd";
import { config as loadEnv } from "dotenv";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..", "..", "..");
loadEnv({ path: path.join(workspaceRoot, ".env") });

const force = process.argv.includes("--force");

function requiredPathEnv(name: "DATA_ROOT" | "KB_INDEX_PATH"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return path.isAbsolute(value) ? value : path.resolve(workspaceRoot, value);
}

async function main() {
  const dataRoot = requiredPathEnv("DATA_ROOT");
  const indexPath = requiredPathEnv("KB_INDEX_PATH");
  const kbPath = path.join(dataRoot, "kb");

  console.log("[seed-kb] indexando data/kb/ ...");
  console.log("[seed-kb] force =", force);
  const t0 = Date.now();
  const store = await createStore({
    dbPath: indexPath,
    config: {
      collections: {
        kb: { path: kbPath, pattern: "**/*.md" },
      },
    },
  });

  try {
    const update = await store.update({ collections: ["kb"] });
    const embed = await store.embed({ force });
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log("[seed-kb] update:", JSON.stringify(update));
    console.log("[seed-kb] embed:", JSON.stringify(embed));
    console.log(`[seed-kb] hecho en ${dt}s`);
  } finally {
    await store.close();
  }
}

main().catch((err) => {
  console.error("[seed-kb] FALLO:", err);
  process.exit(1);
});
