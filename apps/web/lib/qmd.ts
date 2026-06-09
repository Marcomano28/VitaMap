/**
 * Capa de acceso a QMD (https://github.com/tobi/qmd).
 *
 * Cada usuario tiene su propio store en data/users/<id>/index.sqlite.
 * La base de conocimiento científica vive en data/kb-index.sqlite y se
 * comparte entre todos los usuarios.
 *
 * Esta capa abstrae @tobilu/qmd para que el resto de la app no dependa
 * de su superficie concreta.
 */

import path from "node:path";
import fs from "node:fs/promises";
import { createStore } from "@tobilu/qmd";
import { getEnv } from "./env";
import {
  readEvidenceFrontmatter,
  readPersonalFrontmatter,
} from "./frontmatter";

// =====================================================================
// Tipos
// =====================================================================

export type SourceType = "personal" | "evidence";

export type EvidenceLevel =
  | "cochrane-a"
  | "cochrane-b"
  | "grade-a"
  | "grade-b"
  | "grade-c"
  | "grade-d"
  | "guideline"
  | "tradition"
  | "unrated";

export interface RetrievedChunk {
  source: SourceType;
  docId: string;
  path: string;
  title: string;
  context: string;
  snippet: string;
  score: number;
  evidenceLevel?: EvidenceLevel;
  sourceUrl?: string;
  observedAt?: string;
}

export interface RagResult {
  personal: RetrievedChunk[];
  evidence: RetrievedChunk[];
}

// =====================================================================
// Rutas por usuario
// =====================================================================

export function userMemoryDir(userId: string): string {
  return path.join(getEnv().DATA_ROOT, "users", userId, "memory");
}

export function userIndexPath(userId: string): string {
  return path.join(getEnv().DATA_ROOT, "users", userId, "index.sqlite");
}

export function userDocumentsDir(userId: string): string {
  return path.join(getEnv().DATA_ROOT, "users", userId, "documents");
}

export function kbDir(): string {
  return path.join(getEnv().DATA_ROOT, "kb");
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function ensureUserScaffold(userId: string) {
  await Promise.all([
    ensureDir(userMemoryDir(userId)),
    ensureDir(userDocumentsDir(userId)),
    ensureDir(path.dirname(userIndexPath(userId))),
  ]);
}

// =====================================================================
// Apertura/cierre de stores
// =====================================================================

interface OpenedStore {
  search(opts: {
    queries: Array<{ type: "lex" | "vec"; query: string }>;
    rerank: false;
    limit?: number;
    minScore?: number;
    candidateLimit?: number;
  }): Promise<Array<{
    title?: string;
    displayPath?: string;
    path?: string;
    context?: string;
    snippet?: string;
    score: number;
    docid?: string;
  }>>;
  update(opts?: { collections?: string[] }): Promise<unknown>;
  embed(opts?: { force?: boolean }): Promise<unknown>;
  addCollection(name: string, cfg: { path: string; pattern?: string; ignore?: string[] }): Promise<unknown>;
  listCollections(): Promise<Array<{ name: string }>>;
  close(): Promise<void>;
}

async function openUserStore(userId: string): Promise<OpenedStore> {
  await ensureUserScaffold(userId);
  const dbPath = userIndexPath(userId);
  const store = (await createStore({
    dbPath,
    config: {
      collections: {
        memory: { path: userMemoryDir(userId), pattern: "**/*.md" },
      },
    },
  })) as unknown as OpenedStore;
  return store;
}

async function openKbStore(): Promise<OpenedStore> {
  const env = getEnv();
  await ensureDir(path.dirname(env.KB_INDEX_PATH));
  await ensureDir(kbDir());
  const store = (await createStore({
    dbPath: env.KB_INDEX_PATH,
    config: {
      collections: {
        kb: { path: kbDir(), pattern: "**/*.md" },
      },
    },
  })) as unknown as OpenedStore;
  return store;
}

// =====================================================================
// Mapeo a RetrievedChunk con lectura de frontmatter
// =====================================================================

type RawHit = Awaited<ReturnType<OpenedStore["search"]>>[number];

async function mapPersonalHit(userId: string, hit: RawHit): Promise<RetrievedChunk> {
  const rel = hit.displayPath ?? hit.path ?? "";
  const abs = path.join(userMemoryDir(userId), rel);
  const fm = await readPersonalFrontmatter(abs);
  return {
    source: "personal",
    docId: hit.docid ?? rel,
    path: rel,
    title: hit.title ?? rel,
    context: hit.context ?? "",
    snippet: hit.snippet ?? "",
    score: hit.score,
    observedAt: typeof fm.observed_at === "string" ? fm.observed_at : undefined,
  };
}

async function mapEvidenceHit(hit: RawHit): Promise<RetrievedChunk> {
  const rel = hit.displayPath ?? hit.path ?? "";
  const abs = path.join(kbDir(), rel);
  const fm = await readEvidenceFrontmatter(abs);
  return {
    source: "evidence",
    docId: hit.docid ?? rel,
    path: rel,
    title: hit.title ?? (typeof fm.title === "string" ? fm.title : rel),
    context: hit.context ?? "",
    snippet: hit.snippet ?? "",
    score: hit.score,
    evidenceLevel: fm.evidence_level ?? "unrated",
    sourceUrl: typeof fm.source_url === "string" ? fm.source_url : undefined,
  };
}

// =====================================================================
// API pública
// =====================================================================

export interface QueryOptions {
  limit?: number;
  minScore?: number;
}

export async function queryMemoryAndKB(
  userId: string,
  query: string,
  opts: QueryOptions = {},
): Promise<RagResult> {
  const limit = opts.limit ?? 5;
  const minScore = opts.minScore ?? 0.3;

  const [userStore, kbStore] = await Promise.all([
    openUserStore(userId),
    openKbStore(),
  ]);

  try {
    // Evitar expansión y reranking locales, demasiado costosos en el VPS
    // CPU-only, manteniendo recuperación híbrida BM25 + vector.
    const normalizedQuery = query.replace(/\s+/g, " ").trim();
    const searches = [
      { type: "lex" as const, query: normalizedQuery },
      { type: "vec" as const, query: normalizedQuery },
    ];
    const [personalHits, evidenceHits] = await Promise.all([
      userStore.search({
        queries: searches,
        rerank: false,
        limit,
        minScore,
        candidateLimit: 10,
      }),
      kbStore.search({
        queries: searches,
        rerank: false,
        limit,
        minScore,
        candidateLimit: 10,
      }),
    ]);

    const [personal, evidence] = await Promise.all([
      Promise.all(personalHits.map((h) => mapPersonalHit(userId, h))),
      Promise.all(evidenceHits.map(mapEvidenceHit)),
    ]);

    return { personal, evidence };
  } finally {
    await Promise.allSettled([userStore.close(), kbStore.close()]);
  }
}

export async function reindexUser(userId: string): Promise<void> {
  const store = await openUserStore(userId);
  try {
    await store.update({ collections: ["memory"] });
    await store.embed({ force: false });
  } finally {
    await store.close();
  }
}

export async function reindexKB(force = false): Promise<void> {
  const store = await openKbStore();
  try {
    await store.update({ collections: ["kb"] });
    await store.embed({ force });
  } finally {
    await store.close();
  }
}

// =====================================================================
// Helper para envolver los chunks en el formato que ve el LLM
// =====================================================================

export function wrapForPrompt(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c) => {
      if (c.source === "personal") {
        return `<source type="personal" observed_at="${c.observedAt ?? "unknown"}" doc="${c.path}">\n${c.snippet}\n</source>`;
      }
      return `<source type="evidence" level="${c.evidenceLevel ?? "unrated"}" url="${c.sourceUrl ?? ""}" doc="${c.path}">\n${c.snippet}\n</source>`;
    })
    .join("\n\n");
}
