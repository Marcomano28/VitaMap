import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { isPathInside, isSafeRegularFile } from "./memory-path-safety";
import type { RetrievedChunk } from "./qmd";

export type EditorialDepth = "discover" | "understand" | "deep";

export type EditorialSectionId =
  | "summary"
  | "analogy"
  | "literal"
  | "relations"
  | "limitations"
  | "deepDive"
  | "sources";

export interface EditorialSection {
  id: EditorialSectionId;
  heading: string;
  body: string;
}

export interface EditorialCard {
  relativePath: string;
  frontmatter: Record<string, unknown>;
  sections: Partial<Record<EditorialSectionId, EditorialSection>>;
}

const MAX_EDITORIAL_CARD_BYTES = 256_000;

const SECTION_BY_HEADING = new Map<string, EditorialSectionId>([
  ["en una frase", "summary"],
  ["una imagen para empezar", "analogy"],
  ["que significa realmente", "literal"],
  ["como se relaciona", "relations"],
  ["limites de la explicacion", "limitations"],
  ["si quieres profundizar", "deepDive"],
  ["fuentes", "sources"],
]);

const REQUIRED_SECTIONS: readonly EditorialSectionId[] = [
  "summary",
  "literal",
  "limitations",
  "sources",
];

const SECTIONS_BY_DEPTH: Record<EditorialDepth, readonly EditorialSectionId[]> = {
  discover: ["summary", "analogy", "literal", "limitations", "sources"],
  understand: [
    "summary",
    "analogy",
    "literal",
    "relations",
    "limitations",
    "sources",
  ],
  deep: [
    "summary",
    "analogy",
    "literal",
    "relations",
    "limitations",
    "deepDive",
    "sources",
  ],
};

const PROMPT_SECTION_LIMITS: Record<EditorialSectionId, number> = {
  summary: 500,
  analogy: 1_000,
  literal: 1_800,
  relations: 1_200,
  limitations: 1_200,
  deepDive: 2_200,
  sources: 1_000,
};

function normalizeHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[*_`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrae únicamente bloques H2 reconocidos. Los H3 permanecen dentro del
 * bloque padre. Si un encabezado reconocido se repite, la tarjeta se rechaza:
 * componer una versión ambigua sería menos seguro que usar el chunk de QMD.
 */
export function parseEditorialCard(
  markdown: string,
  relativePath = "unknown.md",
): EditorialCard | null {
  const parsed = matter(markdown);
  const sections: Partial<Record<EditorialSectionId, EditorialSection>> = {};
  const matches = [...parsed.content.matchAll(/^##\s+(.+?)\s*$/gm)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = match[1].trim();
    const id = SECTION_BY_HEADING.get(normalizeHeading(heading));
    if (!id) continue;
    if (sections[id]) return null;

    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = matches[index + 1]?.index ?? parsed.content.length;
    const body = parsed.content.slice(bodyStart, bodyEnd).trim();
    if (!body) return null;
    sections[id] = { id, heading, body };
  }

  if (Object.keys(sections).length === 0) return null;
  return {
    relativePath: relativePath.split(path.sep).join("/"),
    frontmatter: (parsed.data ?? {}) as Record<string, unknown>,
    sections,
  };
}

export function isComposableEditorialCard(card: EditorialCard): boolean {
  return REQUIRED_SECTIONS.every((id) => Boolean(card.sections[id]?.body));
}

/**
 * Relee una tarjeta ya elegida por retrieval. La ruta debe seguir dentro del
 * KB, ser Markdown, no ser symlink y no superar el límite de tamaño.
 */
export async function readEditorialCard(
  root: string,
  relativePath: string,
): Promise<EditorialCard | null> {
  if (path.extname(relativePath).toLowerCase() !== ".md") return null;
  const absolutePath = path.resolve(root, relativePath);
  if (!isPathInside(absolutePath, root)) return null;
  if (!(await isSafeRegularFile(root, absolutePath))) return null;

  try {
    const stat = await fs.stat(absolutePath);
    if (stat.size > MAX_EDITORIAL_CARD_BYTES) return null;
    const raw = await fs.readFile(absolutePath, "utf8");
    return parseEditorialCard(raw, path.relative(root, absolutePath));
  } catch {
    return null;
  }
}

/**
 * Devuelve solo los bloques permitidos para la profundidad solicitada. Los
 * límites y las fuentes están presentes en todas las profundidades.
 */
export function composeEditorialCard(
  card: EditorialCard,
  depth: EditorialDepth,
): EditorialSection[] | null {
  if (!isComposableEditorialCard(card)) return null;
  return SECTIONS_BY_DEPTH[depth].flatMap((id) => {
    const section = card.sections[id];
    return section ? [section] : [];
  });
}

export function serializeEditorialSections(sections: readonly EditorialSection[]): string {
  return sections
    .map((section) => `## ${section.heading}\n\n${section.body}`)
    .join("\n\n");
}

function truncateSectionBody(body: string, max: number): string {
  if (body.length <= max) return body;
  const cut = body.lastIndexOf(" ", max);
  return `${body.slice(0, cut > max * 0.7 ? cut : max).trim()} […]`;
}

export function serializeEditorialSectionsForPrompt(
  sections: readonly EditorialSection[],
): string {
  return sections
    .map(
      (section) =>
        `## ${section.heading}\n\n${truncateSectionBody(
          section.body,
          PROMPT_SECTION_LIMITS[section.id],
        )}`,
    )
    .join("\n\n");
}

/**
 * Enriquece como máximo una tarjeta por respuesta. El resto conserva el
 * bestChunk de QMD para mantener acotado el contexto total.
 */
export async function composeRetrievedEvidence(
  root: string,
  chunks: readonly RetrievedChunk[],
  depth: EditorialDepth,
): Promise<{ chunks: RetrievedChunk[]; composedPath?: string }> {
  let composedPath: string | undefined;
  const output: RetrievedChunk[] = [];

  for (const chunk of chunks) {
    if (chunk.source !== "evidence" || composedPath) {
      output.push({ ...chunk });
      continue;
    }
    const card = await readEditorialCard(root, chunk.path);
    const sections = card ? composeEditorialCard(card, depth) : null;
    if (!sections) {
      output.push({ ...chunk });
      continue;
    }
    composedPath = chunk.path;
    output.push({
      ...chunk,
      snippet: serializeEditorialSectionsForPrompt(sections),
      editorialDepth: depth,
    });
  }

  return { chunks: output, composedPath };
}

export function inferEditorialDepth(
  message: string,
  requested: EditorialDepth = "understand",
): EditorialDepth {
  const normalized = normalizeHeading(message);
  if (
    /\b(mas facil|muy facil|en sencillo|en cristiano|sin tecnicismos|einfacher|ganz einfach|ohne fachbegriffe)\b/.test(
      normalized,
    )
  ) {
    return "discover";
  }
  if (
    /\b(profundiza|profundizar|mas detalle|detalle tecnico|mecanismo|fuentes en detalle|tiefer|mehr details|fachlich|mechanismus)\b/.test(
      normalized,
    )
  ) {
    return "deep";
  }
  return requested;
}
