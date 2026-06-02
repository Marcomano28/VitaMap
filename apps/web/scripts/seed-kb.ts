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
import { config as loadEnv } from "dotenv";
import { reindexKB } from "../lib/qmd";

const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
loadEnv({ path: path.join(workspaceRoot, ".env") });

const force = process.argv.includes("--force");

async function main() {
  console.log("[seed-kb] indexando data/kb/ ...");
  console.log("[seed-kb] force =", force);
  const t0 = Date.now();
  await reindexKB(force);
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[seed-kb] hecho en ${dt}s`);
}

main().catch((err) => {
  console.error("[seed-kb] FALLO:", err);
  process.exit(1);
});
