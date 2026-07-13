import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { getEnv } from "./env";
import { invalidateFrontmatterCache } from "./frontmatter";
import {
  BASE_CONTENT_LOCALE,
  corpusRenditionKey,
  isContentLocale,
  isPublicContentLocale,
  isLocalizationKind,
  isLocalizationStatus,
  normalizeContentLocale,
} from "./language-contract";
import type { EvidenceSourceKind } from "./qmd";

export const SOURCE_KINDS = [
  "clinical-evidence",
  "institutional-education",
  "tradition-context",
] as const satisfies readonly EvidenceSourceKind[];

export const RIGHTS_STATUSES = [
  "unknown",
  "metadata-only",
  "permitted",
  "licensed",
] as const;

export const FACET_FRONTMATTER_FIELDS = [
  "source_language",
  "source_jurisdiction",
  "facets_version",
  "tarjeta_id",
  "canonical_card_id",
  "content_locale",
  "localization_kind",
  "localization_status",
  "localized_from",
  "localized_from_version",
  "localized_from_checksum",
  "editorial_schema_version",
  "taxonomy_status",
  "topic",
  "curiosity_scope",
  "review_after",
  "dominio",
  "tipo",
  "marker",
  "categoria",
  "muestra",
  "sistema",
  "area_de_salud",
  "seccion",
  "tradicion",
  "alias",
  "relacionado_con",
  "evidence",
] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      const text = String(value ?? "").trim();
      return text || undefined;
    },
    z.string().max(max).optional(),
  );

const optionalHttpUrl = z.preprocess(
  (value) => {
    const text = String(value ?? "").trim();
    return text || undefined;
  },
  z
    .string()
    .url()
    .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
      message: "source_url must use http or https",
    })
    .optional(),
);

function isValidPublicationDate(value: string | undefined): boolean {
  if (value === undefined) return true;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = match[2] === undefined ? undefined : Number(match[2]);
  const day = match[3] === undefined ? undefined : Number(match[3]);
  if (month !== undefined && (month < 1 || month > 12)) return false;
  if (day === undefined) return true;
  const date = new Date(Date.UTC(year, month! - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  );
}

export const CorpusDraftInputSchema = z
  .object({
    title: z.string().trim().min(3).max(240),
    sourceUrl: optionalHttpUrl,
    doi: optionalText(200),
    pmid: optionalText(32).refine(
      (value) => value === undefined || /^\d+$/.test(value),
      "PMID must contain only digits",
    ),
    publicationDate: optionalText(10).refine(
      isValidPublicationDate,
      "publication date must use YYYY, YYYY-MM, or YYYY-MM-DD",
    ),
    sourceKind: z.enum(SOURCE_KINDS),
    sourceType: z.string().trim().min(2).max(100),
    rightsStatus: z.enum(RIGHTS_STATUSES),
    limitations: z.array(z.string().trim().min(1).max(400)).max(20),
    extraFrontmatter: z.record(z.unknown()).optional(),
    body: z.string().trim().max(250_000),
  })
  .superRefine((value, ctx) => {
    if (!value.sourceUrl && !value.doi && !value.pmid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrl"],
        message: "a source URL, DOI, or PMID is required",
      });
    }

    const metadata = value.extraFrontmatter ?? {};
    const localizationFields = [
      "canonical_card_id",
      "content_locale",
      "localization_kind",
      "localization_status",
      "localized_from",
      "localized_from_version",
      "localized_from_checksum",
      "editorial_schema_version",
    ];
    const usesLocalizationContract = localizationFields.some(
      (field) => metadata[field] !== undefined,
    );
    if (!usesLocalizationContract) return;

    const issue = (field: string, message: string) =>
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extraFrontmatter", field],
        message,
      });
    const text = (field: string) =>
      typeof metadata[field] === "string" ? metadata[field].trim() : "";
    const stableId = /^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/;

    if (!stableId.test(text("tarjeta_id"))) {
      issue("tarjeta_id", "a stable tarjeta_id is required by the language contract");
    }
    if (!stableId.test(text("canonical_card_id"))) {
      issue(
        "canonical_card_id",
        "canonical_card_id must use lowercase letters, numbers, and hyphens",
      );
    }
    if (!isContentLocale(text("content_locale"))) {
      issue("content_locale", "content_locale must be an enabled VitaMap locale");
    }
    if (!isLocalizationKind(metadata.localization_kind)) {
      issue("localization_kind", "localization_kind must be original or translation");
    }
    if (!isLocalizationStatus(metadata.localization_status)) {
      issue(
        "localization_status",
        "localization_status must be draft, machine-draft, reviewed, or stale",
      );
    }

    const schemaVersion = metadata.editorial_schema_version;
    if (schemaVersion !== 1 && schemaVersion !== 2) {
      issue("editorial_schema_version", "editorial_schema_version must be 1 or 2");
    }

    if (metadata.localization_kind === "translation") {
      if (!stableId.test(text("localized_from"))) {
        issue("localized_from", "a translation must identify its source card");
      }
      if (
        !Number.isInteger(metadata.localized_from_version) ||
        Number(metadata.localized_from_version) < 1
      ) {
        issue(
          "localized_from_version",
          "a translation must identify a positive source version",
        );
      }
      if (!/^sha256:[a-f0-9]{64}$/.test(text("localized_from_checksum"))) {
        issue(
          "localized_from_checksum",
          "a translation must include the source sha256 checksum",
        );
      }
    }
  });

export type CorpusDraftInput = z.infer<typeof CorpusDraftInputSchema>;
export type SourceKind = CorpusDraftInput["sourceKind"];
export type RightsStatus = CorpusDraftInput["rightsStatus"];

export interface CorpusDocument extends CorpusDraftInput {
  id: string;
  status: "draft" | "published";
  relativePath: string;
  createdAt?: string;
  publishedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  replacedRelativePath?: string;
}

export function isSameCorpusRendition(
  left: Pick<CorpusDocument, "extraFrontmatter">,
  right: Pick<CorpusDocument, "extraFrontmatter">,
): boolean {
  const leftMetadata = left.extraFrontmatter ?? {};
  const rightMetadata = right.extraFrontmatter ?? {};
  const leftKey = corpusRenditionKey(leftMetadata);
  const rightKey = corpusRenditionKey(rightMetadata);
  const leftCard = textValue(leftMetadata.tarjeta_id);
  const rightCard = textValue(rightMetadata.tarjeta_id);
  if (leftKey && rightKey) return leftKey === rightKey;
  if (leftKey || rightKey) {
    // Puente de migración: el corpus anterior no tenía content_locale y su
    // cuerpo era español. Solo una rendición ES con el mismo tarjeta_id puede
    // sustituirlo; una DE con el mismo ID se considera colisión.
    const localizedMetadata = leftKey ? leftMetadata : rightMetadata;
    return Boolean(
      leftCard &&
      rightCard &&
      leftCard === rightCard &&
      normalizeContentLocale(localizedMetadata.content_locale) === BASE_CONTENT_LOCALE
    );
  }
  return Boolean(leftCard && rightCard && leftCard === rightCard);
}

let corpusMutationQueue: Promise<void> = Promise.resolve();

function serializeCorpusMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = corpusMutationQueue.then(operation, operation);
  corpusMutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function draftsDir(): string {
  return path.join(getEnv().DATA_ROOT, "kb-inbox");
}

function kbDir(): string {
  return path.join(getEnv().DATA_ROOT, "kb");
}

function retiredDir(): string {
  return path.join(getEnv().DATA_ROOT, "kb-retired");
}

async function reindexPublishedCorpus(): Promise<void> {
  const { reindexKB } = await import("./qmd");
  await reindexKB(false);
}

function safeDraftId(id: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("invalid corpus draft id");
  return id;
}

function resolveCorpusPath(root: string, relativePath: string): string {
  if (!relativePath.endsWith(".md") || path.isAbsolute(relativePath)) {
    throw new Error("invalid corpus path");
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, relativePath);
  if (resolved === resolvedRoot || !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("corpus path escapes its root");
  }
  return resolved;
}

function sourceUrlFor(input: CorpusDraftInput): string | undefined {
  if (input.sourceUrl) return input.sourceUrl;
  if (input.doi) return `https://doi.org/${input.doi.replace(/^https?:\/\/doi\.org\//i, "")}`;
  if (input.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${input.pmid}/`;
  return undefined;
}

function serializeDocument(
  input: CorpusDraftInput,
  metadata: Record<string, unknown>,
): string {
  const frontmatter = {
    ...metadata,
    ...(input.extraFrontmatter ?? {}),
    title: input.title,
    source_url: sourceUrlFor(input),
    doi: input.doi,
    pmid: input.pmid,
    publication_date: input.publicationDate,
    source_kind: input.sourceKind,
    source_type: input.sourceType,
    rights_status: input.rightsStatus,
    limitations: input.limitations,
  };
  const definedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, value]) => value !== undefined),
  );
  return matter.stringify(`${input.body.trim()}\n`, definedFrontmatter);
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseStoredDocument(
  raw: string,
  relativePath: string,
  fallbackStatus: "draft" | "published",
): CorpusDocument | null {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const title = textValue(data.title) ?? path.basename(relativePath, ".md");
  const sourceKind = SOURCE_KINDS.includes(data.source_kind as SourceKind)
    ? (data.source_kind as SourceKind)
    : "clinical-evidence";
  const rightsStatus = RIGHTS_STATUSES.includes(data.rights_status as RightsStatus)
    ? (data.rights_status as RightsStatus)
    : "unknown";
  const limitations = Array.isArray(data.limitations)
    ? data.limitations.filter((item): item is string => typeof item === "string")
    : [];
  const id = textValue(data.id) ?? relativePath;

  const candidate = {
    title,
    sourceUrl: textValue(data.source_url),
    doi: textValue(data.doi),
    pmid: textValue(data.pmid),
    publicationDate: textValue(data.publication_date),
    sourceKind,
    sourceType: textValue(data.source_type) ?? textValue(data.category) ?? "unknown",
    rightsStatus,
    limitations,
    extraFrontmatter: Object.fromEntries(
      FACET_FRONTMATTER_FIELDS
        .filter((key) => data[key] !== undefined)
        .map((key) => [key, data[key]]),
    ),
    body: parsed.content.trim(),
  };

  const result = CorpusDraftInputSchema.safeParse(candidate);
  if (!result.success) {
    if (fallbackStatus === "draft") return null;
    return {
      ...candidate,
      body: candidate.body || "(sin contenido)",
      id,
      status: fallbackStatus,
      relativePath,
      createdAt: textValue(data.created_at),
      publishedAt: textValue(data.published_at),
      reviewedAt: textValue(data.reviewed_at),
      reviewedBy: textValue(data.reviewed_by),
    } as CorpusDocument;
  }

  return {
    ...result.data,
    id,
    status: fallbackStatus,
    relativePath,
    createdAt: textValue(data.created_at),
    publishedAt: textValue(data.published_at),
    reviewedAt: textValue(data.reviewed_at),
    reviewedBy: textValue(data.reviewed_by),
  };
}

async function markdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(absolute);
    }
  }

  await walk(root);
  return files;
}

async function listDocuments(
  root: string,
  status: "draft" | "published",
): Promise<CorpusDocument[]> {
  const files = await markdownFiles(root);
  const documents = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(file, "utf8");
      return parseStoredDocument(raw, path.relative(root, file), status);
    }),
  );
  return documents
    .filter((document): document is CorpusDocument => document !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function listCorpusDrafts(): Promise<CorpusDocument[]> {
  return listDocuments(draftsDir(), "draft");
}

export async function listPublishedCorpus(): Promise<CorpusDocument[]> {
  return listDocuments(kbDir(), "published");
}

export async function createCorpusDraft(
  input: CorpusDraftInput,
): Promise<CorpusDocument> {
  const validated = CorpusDraftInputSchema.parse(input);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const relativePath = `${id}.md`;
  const dir = draftsDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, relativePath),
    serializeDocument(validated, {
      id,
      status: "draft",
      created_at: createdAt,
      updated_at: createdAt,
    }),
    { encoding: "utf8", flag: "wx" },
  );
  return {
    ...validated,
    id,
    status: "draft",
    relativePath,
    createdAt,
  };
}

export async function updateCorpusDraft(
  id: string,
  input: CorpusDraftInput,
): Promise<CorpusDocument> {
  const draftId = safeDraftId(id);
  const validated = CorpusDraftInputSchema.parse(input);
  const file = path.join(draftsDir(), `${draftId}.md`);
  const raw = await fs.readFile(file, "utf8");
  const existing = parseStoredDocument(raw, `${draftId}.md`, "draft");
  if (!existing) throw new Error("invalid corpus draft");
  const merged = {
    ...validated,
    extraFrontmatter: {
      ...(existing.extraFrontmatter ?? {}),
      ...(validated.extraFrontmatter ?? {}),
    },
  };
  const updatedAt = new Date().toISOString();
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;

  await fs.writeFile(
    temporary,
    serializeDocument(merged, {
      id: draftId,
      status: "draft",
      created_at: existing.createdAt ?? updatedAt,
      updated_at: updatedAt,
    }),
    { encoding: "utf8", flag: "wx" },
  );
  await fs.rename(temporary, file);

  return {
    ...merged,
    id: draftId,
    status: "draft",
    relativePath: `${draftId}.md`,
    createdAt: existing.createdAt ?? updatedAt,
  };
}

export async function deleteCorpusDraft(id: string): Promise<void> {
  const file = path.join(draftsDir(), `${safeDraftId(id)}.md`);
  await fs.rm(file, { force: true });
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "document";
}

export function publishCorpusDraft(
  id: string,
  reviewer: string,
  options: {
    replaceExisting?: boolean;
    /** Inyección solo para pruebas; producción usa siempre el reindexador QMD. */
    reindex?: () => Promise<void>;
  } = {},
): Promise<CorpusDocument> {
  return serializeCorpusMutation(async () => {
    const draftId = safeDraftId(id);
    const draftPath = path.join(draftsDir(), `${draftId}.md`);
    const raw = await fs.readFile(draftPath, "utf8");
    const draft = parseStoredDocument(raw, `${draftId}.md`, "draft");
    if (!draft) throw new Error("invalid corpus draft");
    if (textValue(draft.extraFrontmatter?.taxonomy_status) === "proposed") {
      throw new Error("proposed taxonomy must be approved before publication");
    }
    if (!["permitted", "licensed"].includes(draft.rightsStatus)) {
      throw new Error("content rights do not permit publication");
    }
    if (draft.body.length < 20) {
      throw new Error("reviewed corpus content is required before publication");
    }

    const localizationStatus = textValue(
      draft.extraFrontmatter?.localization_status,
    );
    if (localizationStatus === "machine-draft" || localizationStatus === "stale") {
      throw new Error("localization must be reviewed and current before publication");
    }
    const contentLocale = textValue(draft.extraFrontmatter?.content_locale);
    if (contentLocale && !isPublicContentLocale(contentLocale)) {
      throw new Error("content locale is stored but not enabled for publication");
    }

    const tarjetaId = textValue(draft.extraFrontmatter?.tarjeta_id);
    const renditionKey = corpusRenditionKey(draft.extraFrontmatter ?? {});
    const published = tarjetaId || renditionKey ? await listPublishedCorpus() : [];
    const sameTarjeta = tarjetaId
      ? published.filter(
          (document) => textValue(document.extraFrontmatter?.tarjeta_id) === tarjetaId,
        )
      : [];
    const sameRendition = published.filter((document) =>
      isSameCorpusRendition(draft, document),
    );
    const sameCard = [...new Map(
      [...sameTarjeta, ...sameRendition].map((document) => [document.relativePath, document]),
    ).values()];
    if (sameCard.length > 1) {
      throw new Error("multiple published documents share a corpus rendition identity");
    }
    if (
      sameTarjeta.length === 1 &&
      renditionKey &&
      !isSameCorpusRendition(draft, sameTarjeta[0])
    ) {
      throw new Error("tarjeta_id collides with another language rendition");
    }
    if (sameCard.length === 1 && !options.replaceExisting) {
      throw new Error("corpus rendition already published; explicit replacement required");
    }

    const publicationDraft: CorpusDocument = renditionKey
      ? {
          ...draft,
          extraFrontmatter: {
            ...(draft.extraFrontmatter ?? {}),
            localization_status: "reviewed",
          },
        }
      : draft;

    const now = new Date().toISOString();
    const relativePath = path.join(
      draft.sourceKind,
      `${slugify(draft.title)}-${draftId.slice(0, 8)}.md`,
    );
    const destination = resolveCorpusPath(kbDir(), relativePath);
    const replaced = sameCard[0];
    const replacedSource = replaced
      ? resolveCorpusPath(kbDir(), replaced.relativePath)
      : undefined;
    const replacedExtension = replaced ? path.extname(replaced.relativePath) : undefined;
    const retiredRelativePath = replaced
      ? `${replaced.relativePath.slice(0, -replacedExtension!.length)}-replaced-${Date.now()}${replacedExtension}`
      : undefined;
    const replacedDestination = retiredRelativePath
      ? resolveCorpusPath(retiredDir(), retiredRelativePath)
      : undefined;
    let previousVersion = 0;
    if (replacedSource) {
      const previousRaw = await fs.readFile(replacedSource, "utf8");
      const previousData = matter(previousRaw).data as Record<string, unknown>;
      previousVersion =
        typeof previousData.version === "number" && previousData.version > 0
          ? previousData.version
          : 1;
    }

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(
      destination,
      serializeDocument(publicationDraft, {
        id: draftId,
        status: "published",
        review_status: "approved",
        created_at: draft.createdAt,
        updated_at: now,
        reviewed_at: now,
        reviewed_by: reviewer,
        published_at: now,
        indexed_at: now.slice(0, 10),
        version: previousVersion + 1,
        replaces: replaced?.relativePath,
      }),
      { encoding: "utf8", flag: "wx" },
    );

    let previousMoved = false;
    try {
      if (replacedSource && replacedDestination) {
        await fs.mkdir(path.dirname(replacedDestination), { recursive: true });
        await fs.rename(replacedSource, replacedDestination);
        previousMoved = true;
        invalidateFrontmatterCache(replacedSource);
      }
      invalidateFrontmatterCache(destination);
      await (options.reindex ?? reindexPublishedCorpus)();
      await fs.unlink(draftPath);
    } catch (error) {
      await fs.rm(destination, { force: true }).catch(() => undefined);
      invalidateFrontmatterCache(destination);
      if (previousMoved && replacedSource && replacedDestination) {
        await fs.mkdir(path.dirname(replacedSource), { recursive: true });
        await fs.rename(replacedDestination, replacedSource).catch(() => undefined);
        invalidateFrontmatterCache(replacedSource);
      }
      await (options.reindex ?? reindexPublishedCorpus)().catch(() => undefined);
      throw error;
    }

    return {
      ...publicationDraft,
      status: "published",
      relativePath,
      publishedAt: now,
      reviewedAt: now,
      reviewedBy: reviewer,
      replacedRelativePath: replaced?.relativePath,
    };
  });
}

export function retireCorpusDocument(relativePath: string): Promise<void> {
  return serializeCorpusMutation(async () => {
    const source = resolveCorpusPath(kbDir(), relativePath);
    const extension = path.extname(relativePath);
    const retiredRelativePath = `${relativePath.slice(
      0,
      -extension.length,
    )}-retired-${Date.now()}${extension}`;
    const destination = resolveCorpusPath(retiredDir(), retiredRelativePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rename(source, destination);

    try {
      invalidateFrontmatterCache(source);
      await reindexPublishedCorpus();
    } catch (error) {
      await fs.mkdir(path.dirname(source), { recursive: true });
      await fs.rename(destination, source).catch(() => undefined);
      invalidateFrontmatterCache(source);
      await reindexPublishedCorpus().catch(() => undefined);
      throw error;
    }
  });
}
