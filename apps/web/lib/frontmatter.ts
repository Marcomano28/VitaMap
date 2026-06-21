/**
 * Lectura de frontmatter YAML de los documentos markdown.
 *
 * Los documentos en `data/kb/` declaran `source_url`, `evidence` (Contrato
 * mínimo v0), etc.
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
  source_language?: string;
  source_jurisdiction?: string | string[];
  source_kind?: string;
  source_type?: string;
  facets_version?: number;
  tarjeta_id?: string;
  dominio?: string;
  tipo?: string[];
  marker?: string | string[];
  categoria?: string[];
  muestra?: string[];
  sistema?: string[];
  area_de_salud?: string[];
  seccion?: string;
  tradicion?: string;
  alias?: string[];
  relacionado_con?: Array<{
    id?: string;
    relacion?: string;
    /** "simetrica" | "dirigida" (Contrato mínimo v0). Validado en test-marker-taxonomy. */
    direccion?: string;
    /** Condición en la que la relación aplica (texto libre, opcional). */
    contexto?: string;
  }>;
  limitations?: string[];
  /**
   * Contrato mínimo de evidencia (v0). Inerte hasta el Tramo 2 (no se consume
   * todavía); se captura al investigar para evitar backfill. Forma validada en
   * scripts/test-marker-taxonomy.ts. Ver
   * corpus-preparation/PROMPT-INVESTIGACION-RAG.md §3 bis.
   */
  evidence?: {
    certeza?: "alta" | "moderada" | "baja" | "muy-baja";
    direccion?: "a-favor" | "en-contra" | "incierta";
    poblacion?: string;
    motivos_descenso?: string[];
  };
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
