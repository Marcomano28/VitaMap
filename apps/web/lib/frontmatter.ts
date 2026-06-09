/**
 * Lectura de frontmatter YAML de los documentos markdown.
 *
 * Los documentos en `data/kb/` declaran `evidence_level`, `source_url`, etc.
 * Los documentos en `data/users/<id>/memory/` declaran `observed_at`, `type`,
 * `tags`. QMD no expone el frontmatter en sus resultados de búsqueda, así
 * que lo leemos aquí post-retrieval.
 */

import fs from "node:fs/promises";
import matter from "gray-matter";

export interface PersonalFrontmatter {
  type?: string;
  observed_at?: string;
  tags?: string[];
  instrument?: string; // p.ej. "PHQ-9", "GAD-7"
  score?: number;
  [key: string]: unknown;
}

export interface EvidenceFrontmatter {
  title?: string;
  source_url?: string;
  source_kind?: string;
  source_type?: string;
  limitations?: string[];
  category?: string;
  indexed_at?: string;
  [key: string]: unknown;
}

const CACHE = new Map<string, { mtimeMs: number; data: Record<string, unknown> }>();

async function readFrontmatter(absPath: string): Promise<Record<string, unknown>> {
  try {
    const stat = await fs.stat(absPath);
    const cached = CACHE.get(absPath);
    if (cached && cached.mtimeMs === stat.mtimeMs) return cached.data;

    const raw = await fs.readFile(absPath, "utf8");
    const parsed = matter(raw);
    const data = (parsed.data ?? {}) as Record<string, unknown>;
    CACHE.set(absPath, { mtimeMs: stat.mtimeMs, data });
    return data;
  } catch {
    return {};
  }
}

export async function readPersonalFrontmatter(absPath: string): Promise<PersonalFrontmatter> {
  return (await readFrontmatter(absPath)) as PersonalFrontmatter;
}

export async function readEvidenceFrontmatter(absPath: string): Promise<EvidenceFrontmatter> {
  return (await readFrontmatter(absPath)) as EvidenceFrontmatter;
}

/** Invalida la cache (útil tras escribir o reindexar). */
export function invalidateFrontmatterCache(absPath?: string) {
  if (absPath) CACHE.delete(absPath);
  else CACHE.clear();
}
