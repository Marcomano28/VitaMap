#!/usr/bin/env tsx
/**
 * Comprueba el estado de la KB científica y ejecuta una búsqueda QMD real.
 *
 * Uso:
 *   npm run kb:check -- "vitamina D valores bajos"
 */

import { createStore } from "@tobilu/qmd";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const query =
  process.argv.slice(2).join(" ").trim() ||
  "vitamina D valores bajos";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..", "..", "..");
loadEnv({ path: path.join(workspaceRoot, ".env") });

function requiredPathEnv(name: "DATA_ROOT" | "KB_INDEX_PATH"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return path.isAbsolute(value) ? value : path.resolve(workspaceRoot, value);
}

function relativePath(hit: {
  displayPath?: string;
  path?: string;
}): string {
  const raw = (hit.displayPath ?? hit.path ?? "")
    .replace(/^qmd:\/\//, "")
    .replace(/^\/+/, "");
  return raw.startsWith("kb/") ? raw.slice(3) : raw;
}

function hitSnippet(hit: {
  bestChunk?: string;
  snippet?: string;
  body?: string;
}): string {
  return (hit.bestChunk ?? hit.snippet ?? hit.body ?? "").trim();
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(absolute)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolute);
    }
  }
  return files;
}

async function main() {
  const dataRoot = requiredPathEnv("DATA_ROOT");
  const indexPath = requiredPathEnv("KB_INDEX_PATH");
  const kbPath = path.join(dataRoot, "kb");
  await fs.mkdir(kbPath, { recursive: true });
  const markdownFiles = await listMarkdownFiles(kbPath);
  const realDocuments = markdownFiles.filter(
    (file) => path.basename(file) !== "example-seed.md",
  );

  console.log("[kb:check] documentos markdown:", markdownFiles.length);
  console.log("[kb:check] documentos no-placeholder:", realDocuments.length);
  if (realDocuments.length === 0) {
    console.error(
      "[kb:check] NO APTA: la KB no contiene documentos científicos reales",
    );
    process.exitCode = 3;
    return;
  }

  const store = await createStore({
    dbPath: indexPath,
    config: {
      collections: {
        kb: { path: kbPath, pattern: "**/*.md" },
      },
    },
  });

  try {
    const [status, health] = await Promise.all([
      store.getStatus(),
      store.getIndexHealth(),
    ]);

    console.log("[kb:check] directorio:", kbPath);
    console.log("[kb:check] índice:", indexPath);
    console.log("[kb:check] estado:", JSON.stringify(status, null, 2));
    console.log("[kb:check] salud:", JSON.stringify(health, null, 2));
    console.log("[kb:check] consulta:", query);

    const hits = await store.search({
      queries: [
        { type: "lex", query },
        { type: "vec", query },
      ],
      rerank: false,
      limit: 5,
      candidateLimit: 10,
    });

    if (hits.length === 0) {
      console.error("[kb:check] sin resultados");
      process.exitCode = 2;
      return;
    }

    console.log(`[kb:check] resultados: ${hits.length}`);
    for (const [index, hit] of hits.entries()) {
      console.log(`\n${index + 1}. ${hit.title ?? "(sin título)"}`);
      console.log("   ruta:", relativePath(hit));
      console.log("   score:", hit.score);
      console.log(
        "   fragmento:",
        hitSnippet(hit).replace(/\s+/g, " ").slice(0, 300),
      );
    }
  } finally {
    await store.close();
  }
}

main().catch((err) => {
  console.error("[kb:check] FALLO:", err);
  process.exit(1);
});
