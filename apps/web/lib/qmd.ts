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
import { markersIn, filterByMarkers } from "./marker-scope";
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
// Stores persistentes
//
// Abrir un store es caro (~varios segundos: carga del modelo de
// embeddings en CPU). Abrir/cerrar por petición costaba 8-9 s de
// retrieval por pregunta del chat. Los stores se cachean por proceso:
// el de KB de forma permanente y los de usuario con expiración por
// inactividad (libera RAM cuando un usuario deja de usar la app).
// =====================================================================

const USER_STORE_TTL_MS = 15 * 60_000;

interface CachedStore {
  promise: Promise<QMDStore>;
  lastUsed: number;
}

const userStoreCache = new Map<string, CachedStore>();
let kbStoreCache: Promise<QMDStore> | null = null;

async function closeQuietly(promise: Promise<QMDStore>) {
  try {
    const store = await promise;
    await store.close();
  } catch (err) {
    console.error("[qmd] error cerrando store", err);
  }
}

function evictIdleUserStores() {
  const now = Date.now();
  for (const [userId, cached] of userStoreCache) {
    if (now - cached.lastUsed > USER_STORE_TTL_MS) {
      userStoreCache.delete(userId);
      void closeQuietly(cached.promise);
    }
  }
}

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

function getUserStore(userId: string): Promise<QMDStore> {
  evictIdleUserStores();
  const cached = userStoreCache.get(userId);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.promise;
  }
  const promise = openUserStore(userId).catch((err) => {
    // No cachear aperturas fallidas.
    userStoreCache.delete(userId);
    throw err;
  });
  userStoreCache.set(userId, { promise, lastUsed: Date.now() });
  return promise;
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

function getKbStore(): Promise<QMDStore> {
  if (!kbStoreCache) {
    kbStoreCache = openKbStore().catch((err) => {
      kbStoreCache = null;
      throw err;
    });
  }
  return kbStoreCache;
}

/** Cierra el store cacheado de un usuario (p. ej. al purgar su cuenta). */
export async function closeUserStore(userId: string): Promise<void> {
  const cached = userStoreCache.get(userId);
  if (!cached) return;
  userStoreCache.delete(userId);
  await closeQuietly(cached.promise);
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
  const kbStore = await getKbStore();

  const hits = await kbStore.search({
    queries: normalizedSearchQueries(query),
    rerank: false,
    limit,
    minScore,
    candidateLimit: 10,
  });
  return Promise.all(hits.map(mapEvidenceHit));
}

export async function queryMemoryAndKB(
  userId: string,
  query: string,
  opts: QueryOptions = {},
): Promise<RagResult> {
  const limit = opts.limit ?? 5;
  const minScore = opts.minScore ?? 0.3;

  const [userStore, kbStore] = await Promise.all([
    getUserStore(userId),
    getKbStore(),
  ]);

  // Evitar expansión y reranking locales, demasiado costosos en el VPS
  // CPU-only, manteniendo recuperación híbrida BM25 + vector.
  const searches = normalizedSearchQueries(query);

  // Acotación por marcador (flag KB_MARKER_SCOPE, default off). Sin reranking
  // el score de QMD es posicional, no de relevancia, y un documento de otro
  // marcador puede colarse (ver lib/marker-scope.ts). Cuando está activa,
  // pedimos más candidatos de KB para tener margen al filtrar.
  const markerScope = process.env.KB_MARKER_SCOPE === "true";
  const kbLimit = markerScope ? Math.max(limit * 3, 10) : limit;

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
      limit: kbLimit,
      minScore,
      candidateLimit: 10,
    }),
  ]);

  const [personal, evidence] = await Promise.all([
    Promise.all(personalHits.map((h) => mapPersonalHit(userId, h))),
    Promise.all(evidenceHits.map(mapEvidenceHit)),
  ]);

  if (!markerScope) return { personal, evidence: evidence.slice(0, limit) };

  // Marcadores en juego: los de la analítica del usuario (su memoria) más los
  // de la pregunta. Si no se detecta ninguno, filterByMarkers no filtra.
  const contextText = [query, ...personal.map((p) => `${p.title} ${p.snippet}`)].join(" ");
  const allowed = markersIn(contextText);
  const scopedEvidence = filterByMarkers(evidence, allowed).slice(0, limit);
  console.info("[chat] marker scope", {
    before: evidence.length,
    after: scopedEvidence.length,
    markers: allowed.size,
  });
  return { personal, evidence: scopedEvidence };
}

export async function reindexUser(userId: string): Promise<void> {
  const store = await getUserStore(userId);
  await store.update({ collections: ["memory"] });
  await store.embed({ force: false });
}

export async function reindexKB(force = false): Promise<void> {
  const store = await getKbStore();
  await store.update({ collections: ["kb"] });
  await store.embed({ force });
}
