import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { isPathInside, isSafeRegularFile } from "./memory-path-safety";

const MAX_CURIOSITY_FILE_BYTES = 128_000;
const MAX_CURIOSITY_BODY_CHARS = 8_000;
const MAX_CATALOG_FILES = 1_000;

export const PILOT_CURIOSITY_IDS = [
  "colesterol-ldl-colesterol-curiosidad-ldl-hdl-transportadores-nhlbi",
  "glucosa-en-ayunas-glucosa-en-ayunas-curiosidad-fenomeno-del-alba-wang2021",
  "hemoglobina-glicosilada-hba1c-hba1c-curiosidad-promedio-tres-meses-niddk",
  "cortisol-curiosidad-ritmo-circadiano-medlineplus",
  "vitamina-d-vitamina-d-curiosidad-hormona-ods",
  "hemoglobina-hematocrito-hematocrito-curiosidad-plasma-hidratacion-medlineplus",
  "creatinina-creatinina-curiosidad-no-mide-directamente-el-rinon-kdigo",
  "plaquetas-plaquetas-curiosidad-recuento-falsamente-bajo-lardinois2021",
  "magnesio-curiosidad-sangre-no-refleja-reserva--es",
  "tsh-curiosidad-varia-segun-hora-extraccion--es",
  "pcr-vsg-curiosidad-cinetica-inflamacion--es",
] as const;

export interface CuriosityCard {
  id: string;
  title: string;
  body: string;
  sourceUrl: string;
  publicationDate?: string;
  limitations: string[];
  markers: string[];
  related: boolean;
}

interface StoredCuriosity extends Omit<CuriosityCard, "related"> {
  relativePath: string;
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

async function markdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    if (files.length >= MAX_CATALOG_FILES) return;
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= MAX_CATALOG_FILES) break;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(absolute);
    }
  }

  await walk(root);
  return files;
}

async function readCuriosity(root: string, absolutePath: string): Promise<StoredCuriosity | null> {
  if (!isPathInside(absolutePath, root)) return null;
  if (!(await isSafeRegularFile(root, absolutePath))) return null;
  try {
    const stat = await fs.stat(absolutePath);
    if (stat.size > MAX_CURIOSITY_FILE_BYTES) return null;
    const parsed = matter(await fs.readFile(absolutePath, "utf8"));
    const data = parsed.data as Record<string, unknown>;
    if (
      data.source_type !== "science-curiosity-summary" ||
      data.seccion !== "curiosidad" ||
      !["permitted", "licensed"].includes(String(data.rights_status ?? "")) ||
      typeof data.source_url !== "string" ||
      !/^https?:\/\//.test(data.source_url) ||
      !parsed.content.trim()
    ) {
      return null;
    }
    const relativePath = path.relative(root, absolutePath).split(path.sep).join("/");
    return {
      id:
        typeof data.tarjeta_id === "string" && data.tarjeta_id.trim()
          ? data.tarjeta_id.trim()
          : relativePath,
      relativePath,
      title:
        typeof data.title === "string" && data.title.trim()
          ? data.title.trim()
          : path.basename(relativePath, ".md"),
      body: parsed.content.trim().slice(0, MAX_CURIOSITY_BODY_CHARS),
      sourceUrl: data.source_url,
      publicationDate:
        typeof data.publication_date === "string" ? data.publication_date : undefined,
      limitations: strings(data.limitations).slice(0, 5),
      markers: strings(data.marker),
    };
  } catch {
    return null;
  }
}

export async function listCuriosityCatalog(
  root: string,
  allowedIds: readonly string[] = PILOT_CURIOSITY_IDS,
): Promise<StoredCuriosity[]> {
  const resolvedRoot = path.resolve(root);
  const files = await markdownFiles(resolvedRoot);
  const cards = await Promise.all(files.map((file) => readCuriosity(resolvedRoot, file)));
  const seen = new Set<string>();
  const allowed = new Set(allowedIds);
  return cards.filter((card): card is StoredCuriosity => {
    if (!card || !allowed.has(card.id) || seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

export async function selectCuriosityCard(
  root: string,
  options: {
    topics?: readonly string[];
    seenIds?: readonly string[];
    randomIndex?: (maxExclusive: number) => number;
    allowedIds?: readonly string[];
  } = {},
): Promise<CuriosityCard | null> {
  const seen = new Set(options.seenIds ?? []);
  const available = (await listCuriosityCatalog(root, options.allowedIds)).filter(
    (card) => !seen.has(card.id),
  );
  if (available.length === 0) return null;

  const topics = new Set(options.topics ?? []);
  const related =
    topics.size > 0
      ? available.filter((card) => card.markers.some((marker) => topics.has(marker)))
      : [];
  const pool = related.length > 0 ? related : available;
  const randomIndex = options.randomIndex ?? ((max) => crypto.randomInt(max));
  const selected = pool[randomIndex(pool.length)];
  if (!selected) return null;
  return {
    id: selected.id,
    title: selected.title,
    body: selected.body,
    sourceUrl: selected.sourceUrl,
    publicationDate: selected.publicationDate,
    limitations: selected.limitations,
    markers: selected.markers,
    related: related.length > 0,
  };
}
