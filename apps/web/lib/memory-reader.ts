/**
 * Lectura de la memoria del usuario para vistas de UI.
 *
 * Defensa en profundidad: cada función comprueba que la ruta solicitada
 * resuelve dentro de userMemoryDir(userId). Bloquea path traversal aunque
 * el caller le pase `../../etc/passwd` o un symlink hacia fuera.
 */

import path from "node:path";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { userMemoryDir } from "./qmd";

export interface MemoryItem {
  relPath: string; // "labs/2026-05-15-foo.md" relativo a userMemoryDir
  category: string; // primera carpeta: labs, observations, assessments, images
  type?: string;
  observedAt?: string;
  title?: string;
  tags?: string[];
  preview: string;
  frontmatter: Record<string, unknown>;
}

export interface MemoryFilter {
  type?: string;
  tag?: string;
  from?: string; // ISO date prefix
  to?: string;
}

/**
 * Lista toda la memoria del usuario, opcionalmente filtrada.
 * Ordenada por observed_at descendente.
 */
export async function listMemory(
  userId: string,
  filter: MemoryFilter = {},
): Promise<MemoryItem[]> {
  const root = userMemoryDir(userId);
  const items: MemoryItem[] = [];
  await walk(root, "", items);

  let filtered = items;
  if (filter.type) filtered = filtered.filter((i) => i.type === filter.type);
  if (filter.tag) filtered = filtered.filter((i) => i.tags?.includes(filter.tag!));
  if (filter.from) filtered = filtered.filter((i) => (i.observedAt ?? "") >= filter.from!);
  if (filter.to) filtered = filtered.filter((i) => (i.observedAt ?? "") <= filter.to!);

  filtered.sort((a, b) => (b.observedAt ?? "").localeCompare(a.observedAt ?? ""));
  return filtered;
}

async function walk(root: string, rel: string, out: MemoryItem[]) {
  let entries;
  try {
    entries = await fs.readdir(path.join(root, rel), { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const childRel = path.join(rel, e.name);
    if (e.isDirectory()) {
      await walk(root, childRel, out);
    } else if (e.name.endsWith(".md")) {
      try {
        const raw = await fs.readFile(path.join(root, childRel), "utf8");
        const parsed = matter(raw);
        const fm = (parsed.data ?? {}) as Record<string, unknown>;
        out.push({
          relPath: childRel.split(path.sep).join("/"),
          category: rel.split(path.sep)[0] || "root",
          type: typeof fm.type === "string" ? fm.type : undefined,
          observedAt: typeof fm.observed_at === "string" ? fm.observed_at : undefined,
          title: typeof fm.title === "string" ? fm.title : undefined,
          tags: Array.isArray(fm.tags)
            ? (fm.tags as unknown[]).filter((t): t is string => typeof t === "string")
            : undefined,
          preview: parsed.content.trim().replace(/\s+/g, " ").slice(0, 220),
          frontmatter: fm,
        });
      } catch {
        // fichero corrupto o parseo fallido: lo saltamos sin abortar la lista
      }
    }
  }
}

/**
 * Lee un item concreto. Devuelve null si no existe o si la ruta intenta
 * salir de userMemoryDir.
 */
export async function readMemoryItem(
  userId: string,
  relPath: string,
): Promise<{ frontmatter: Record<string, unknown>; body: string; relPath: string } | null> {
  const root = userMemoryDir(userId);
  const abs = path.resolve(root, relPath);
  if (!isInside(abs, root)) return null;
  try {
    const raw = await fs.readFile(abs, "utf8");
    const parsed = matter(raw);
    return {
      frontmatter: (parsed.data ?? {}) as Record<string, unknown>,
      body: parsed.content,
      relPath: relPath.split(path.sep).join("/"),
    };
  } catch {
    return null;
  }
}

/**
 * Borra un item de memoria. Defensa de path traversal aplicada.
 */
export async function deleteMemoryItem(userId: string, relPath: string): Promise<void> {
  const root = userMemoryDir(userId);
  const abs = path.resolve(root, relPath);
  if (!isInside(abs, root)) {
    throw new Error("path_traversal_denied");
  }
  await fs.rm(abs, { force: true });
}

function isInside(child: string, parent: string): boolean {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/**
 * Tags únicos presentes en la memoria, para popular filtros en UI.
 */
export async function listAllTags(userId: string): Promise<string[]> {
  const items = await listMemory(userId);
  const set = new Set<string>();
  for (const it of items) {
    for (const t of it.tags ?? []) set.add(t);
  }
  return [...set].sort();
}
