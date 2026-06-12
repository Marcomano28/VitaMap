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
import { createStore, type QMDStore } from "@tobilu/qmd";
import { getEnv } from "./env";
import {
  readEvidenceFrontmatter,
  readPersonalFrontmatter,
} from "./frontmatter";
import { qmdHitSnippet, qmdRelativePath } from "./qmd-hit";
export { wrapForPrompt } from "./qmd-prompt";

// =====================================================================
// Tipos
// =====================================================================

export type SourceType = "personal" | "evidence";
export type EvidenceSourceKind =
  | "clinical-evidence"
  | "institutional-education"
  | "tradition-context";

export interface RetrievedChunk {
  source: SourceType;
  docId: string;
  path: string;
  title: string;
  context: string;
  snippet: string;
  score: number;
  sourceKind?: EvidenceSourceKind;
  sourceDocumentType?: string;
  limitations?: string[];
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

async function openUserStore(userId: string): Promise<QMDStore> {
  await ensureUserScaffold(userId);
  const dbPath = userIndexPath(userId);
  const store = (await createStore({
    dbPath,
    config: {
      collections: {
        memory: { path: userMemoryDir(userId), pattern: "**/*.md" },
      },
    },
  }));
  return store;
}

async function openKbStore(): Promise<QMDStore> {
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
  }));
  return store;
}

// =====================================================================
// Mapeo a RetrievedChunk con lectura de frontmatter
// =====================================================================

type RawHit = Awaited<ReturnType<QMDStore["search"]>>[number];

async function mapPersonalHit(userId: string, hit: RawHit): Promise<RetrievedChunk> {
  const rel = qmdRelativePath(hit, "memory");
  const abs = path.join(userMemoryDir(userId), rel);
  const fm = await readPersonalFrontmatter(abs);
  return {
    source: "personal",
    docId: hit.docid ?? rel,
    path: rel,
    title: hit.title ?? rel,
    context: hit.context ?? "",
    snippet: qmdHitSnippet(hit),
    score: hit.score,
    observedAt: typeof fm.observed_at === "string" ? fm.observed_at : undefined,
  };
}

async function mapEvidenceHit(hit: RawHit): Promise<RetrievedChunk> {
  const rel = qmdRelativePath(hit, "kb");
  const abs = path.join(kbDir(), rel);
  const fm = await readEvidenceFrontmatter(abs);
  return {
    source: "evidence",
    docId: hit.docid ?? rel,
    path: rel,
    title: hit.title ?? (typeof fm.title === "string" ? fm.title : rel),
    context: hit.context ?? "",
    snippet: qmdHitSnippet(hit),
    score: hit.score,
    sourceKind:
      fm.source_kind === "clinical-evidence" ||
      fm.source_kind === "institutional-education" ||
      fm.source_kind === "tradition-context"
        ? fm.source_kind
        : undefined,
    sourceDocumentType:
      typeof fm.source_type === "string" ? fm.source_type : undefined,
    limitations: Array.isArray(fm.limitations) ? fm.limitations : undefined,
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

function normalizedSearchQueries(query: string) {
  const normalizedQuery = query.replace(/\s+/g, " ").trim();
  return [
    { type: "lex" as const, query: normalizedQuery },
    { type: "vec" as const, query: normalizedQuery },
  ];
}

export async function queryKB(
  query: string,
  opts: QueryOptions = {},
): Promise<RetrievedChunk[]> {
  const limit = opts.limit ?? 5;
  const minScore = opts.minScore ?? 0.3;
  const kbStore = await openKbStore();

  try {
    const hits = await kbStore.search({
      queries: normalizedSearchQueries(query),
      rerank: false,
      limit,
      minScore,
      candidateLimit: 10,
    });
    return Promise.all(hits.map(mapEvidenceHit));
  } finally {
    await kbStore.close();
  }
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
    const searches = normalizedSearchQueries(query);
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
