/**
 * Escritura de la memoria personal como markdown con frontmatter YAML.
 *
 * Cada función:
 *   1. Construye un .md con frontmatter validado.
 *   2. Lo escribe en data/users/<id>/memory/<categoria>/<fichero>.md
 *   3. Llama a reindexUser para actualizar el índice QMD.
 */

import path from "node:path";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { z } from "zod";
import { reindexUser, userMemoryDir } from "./qmd";
import { LabResultExtraction } from "./extraction";
import { DEFAULT_LOCALE, localize, type Locale } from "./i18n";

// =====================================================================
// Schemas de entrada
// =====================================================================

export const ObservationInput = z.object({
  observedAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
});
export type ObservationInput = z.infer<typeof ObservationInput>;

export const AssessmentInput = z.object({
  instrument: z.enum(["PHQ-9", "GAD-7", "ACE", "Prakriti", "Vikriti"]),
  observedAt: z.string(),
  score: z.number().int().nonnegative(),
  subscores: z.record(z.string(), z.number()).default({}),
  notes: z.string().default(""),
});
export type AssessmentInput = z.infer<typeof AssessmentInput>;

export const ImageObservationInput = z.object({
  observedAt: z.string(),
  category: z.enum(["iridology", "tongue-tcm", "skin", "wound", "other"]),
  description: z.string().min(1),
  encryptedPath: z.string(), // ruta al .age que vive en data/users/<id>/documents/
  tags: z.array(z.string()).default([]),
});
export type ImageObservationInput = z.infer<typeof ImageObservationInput>;

// =====================================================================
// Helpers
// =====================================================================

const SAFE_SLUG = /[^a-zA-Z0-9_-]+/g;

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(SAFE_SLUG, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

async function writeMarkdown(
  absPath: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<void> {
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  const content = matter.stringify(body.trim() + "\n", frontmatter);
  await fs.writeFile(absPath, content, "utf8");
}

// =====================================================================
// API pública
// =====================================================================

export async function writeObservation(
  userId: string,
  input: ObservationInput,
): Promise<{ path: string }> {
  const parsed = ObservationInput.parse(input);
  const slug = slugify(parsed.title) || "observacion";
  const filename = `${dateOnly(parsed.observedAt)}-${slug}.md`;
  const abs = path.join(userMemoryDir(userId), "observations", filename);

  await writeMarkdown(
    abs,
    {
      type: "observation",
      observed_at: parsed.observedAt,
      title: parsed.title,
      tags: parsed.tags,
    },
    parsed.body,
  );

  await reindexUser(userId);
  return { path: abs };
}

export async function writeAssessment(
  userId: string,
  input: AssessmentInput,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ path: string }> {
  const parsed = AssessmentInput.parse(input);
  const filename = `${dateOnly(parsed.observedAt)}-${parsed.instrument.toLowerCase()}.md`;
  const abs = path.join(userMemoryDir(userId), "assessments", filename);

  const t = localize(locale, {
    es: {
      total: "Puntuación total",
      subscores: "Subpuntuaciones",
      notes: "Notas",
    },
    de: {
      total: "Gesamtpunktzahl",
      subscores: "Teilwerte",
      notes: "Notizen",
    },
  });
  const body = [
    `# ${parsed.instrument} — ${dateOnly(parsed.observedAt)}`,
    "",
    `${t.total}: **${parsed.score}**`,
    "",
    Object.keys(parsed.subscores).length > 0
      ? `## ${t.subscores}\n\n` +
        Object.entries(parsed.subscores)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")
      : "",
    parsed.notes ? `\n## ${t.notes}\n\n${parsed.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await writeMarkdown(
    abs,
    {
      type: "assessment",
      instrument: parsed.instrument,
      observed_at: parsed.observedAt,
      score: parsed.score,
      subscores: parsed.subscores,
      tags: ["assessment", parsed.instrument.toLowerCase()],
    },
    body,
  );

  await reindexUser(userId);
  return { path: abs };
}

export async function writeLabResult(
  userId: string,
  data: LabResultExtraction,
  encryptedPdfPath: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ path: string }> {
  const parsed = LabResultExtraction.parse(data);
  const labSlug = parsed.lab_name ? slugify(parsed.lab_name) : "lab";
  const filename = `${dateOnly(parsed.observed_at)}-${labSlug}.md`;
  const abs = path.join(userMemoryDir(userId), "labs", filename);

  const t = localize(locale, {
    es: {
      marker: "Marcador",
      value: "Valor",
      unit: "Unidad",
      range: "Rango",
      flag: "Indicador",
      lab: "Analítica",
      date: "Fecha",
      markers: "Marcadores",
      notes: "Notas",
      original: "Documento original cifrado",
    },
    de: {
      marker: "Messwert",
      value: "Wert",
      unit: "Einheit",
      range: "Referenzbereich",
      flag: "Bewertung",
      lab: "Laborbefund",
      date: "Datum",
      markers: "Messwerte",
      notes: "Notizen",
      original: "Verschlüsseltes Originaldokument",
    },
  });
  const tableHeader = `| ${t.marker} | ${t.value} | ${t.unit} | ${t.range} | ${t.flag} |\n|---|---|---|---|---|`;
  const tableRows = parsed.markers
    .map(
      (m) =>
        `| ${m.name} | ${m.value ?? ""} | ${m.unit ?? ""} | ${m.reference_range ?? ""} | ${m.flag} |`,
    )
    .join("\n");

  const body = [
    `# ${t.lab}${parsed.lab_name ? ` — ${parsed.lab_name}` : ""}`,
    "",
    `${t.date}: ${dateOnly(parsed.observed_at)}`,
    "",
    parsed.markers.length > 0 ? `## ${t.markers}\n\n${tableHeader}\n${tableRows}` : "",
    parsed.notes ? `\n## ${t.notes}\n\n${parsed.notes}` : "",
    `\n---\n_${t.original}: \`${path.basename(encryptedPdfPath)}\`_`,
  ]
    .filter(Boolean)
    .join("\n");

  await writeMarkdown(
    abs,
    {
      type: "lab_result",
      observed_at: parsed.observed_at,
      lab_name: parsed.lab_name,
      markers: parsed.markers,
      original_document: path.basename(encryptedPdfPath),
      tags: ["lab", ...(parsed.lab_name ? [slugify(parsed.lab_name)] : [])],
    },
    body,
  );

  try {
    await reindexUser(userId);
  } catch (err) {
    // La confirmación del inbox debe poder reintentarse sin dejar una
    // entrada de memoria parcialmente escrita.
    await fs.rm(abs, { force: true });
    throw err;
  }
  return { path: abs };
}

export async function writeImageObservation(
  userId: string,
  input: ImageObservationInput,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ path: string }> {
  const parsed = ImageObservationInput.parse(input);
  const filename = `${dateOnly(parsed.observedAt)}-${parsed.category}.md`;
  const abs = path.join(userMemoryDir(userId), "images", filename);

  const t = localize(locale, {
    es: { image: "Imagen", encrypted: "Imagen cifrada" },
    de: { image: "Bild", encrypted: "Verschlüsseltes Bild" },
  });
  const body = [
    `# ${t.image} — ${parsed.category} — ${dateOnly(parsed.observedAt)}`,
    "",
    parsed.description,
    `\n---\n_${t.encrypted}: \`${path.basename(parsed.encryptedPath)}\`_`,
  ].join("\n");

  await writeMarkdown(
    abs,
    {
      type: "image_observation",
      observed_at: parsed.observedAt,
      category: parsed.category,
      encrypted_image: path.basename(parsed.encryptedPath),
      tags: ["image", parsed.category, ...parsed.tags],
    },
    body,
  );

  await reindexUser(userId);
  return { path: abs };
}
