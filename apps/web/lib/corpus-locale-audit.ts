import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import {
  BASE_CONTENT_LOCALE,
  corpusRenditionKey,
  normalizeContentLocale,
  type ContentLocale,
} from "./language-contract";

export interface CorpusLocaleAudit {
  roots: string[];
  markdownFiles: number;
  cards: number;
  explicitByLocale: Record<ContentLocale, number>;
  legacyAssumedBase: number;
  backfillCandidates: number;
  missingTarjetaId: string[];
  invalidContentLocale: Array<{ path: string; value: unknown }>;
  partialContracts: string[];
  duplicateRenditions: Array<{ key: string; paths: string[] }>;
  sourceLanguages: Record<string, number>;
}

const CONTRACT_FIELDS = [
  "canonical_card_id",
  "content_locale",
  "localization_kind",
  "localization_status",
  "localized_from",
  "localized_from_version",
  "localized_from_checksum",
  "editorial_schema_version",
] as const;

async function markdownFiles(root: string): Promise<string[]> {
  const output: string[] = [];

  async function walk(dir: string): Promise<void> {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        output.push(absolute);
      }
    }
  }

  await walk(root);
  return output.sort();
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

/**
 * Inventario estrictamente de solo lectura. Las tarjetas legacy se consideran
 * españolas solo para el informe; esta función nunca escribe el backfill.
 */
export async function auditCorpusLocales(roots: readonly string[]): Promise<CorpusLocaleAudit> {
  const resolvedRoots = roots.map((root) => path.resolve(root));
  const filesByRoot = await Promise.all(resolvedRoots.map(markdownFiles));
  const files = filesByRoot.flat();
  const result: CorpusLocaleAudit = {
    roots: resolvedRoots,
    markdownFiles: files.length,
    cards: 0,
    explicitByLocale: { es: 0, de: 0, en: 0 },
    legacyAssumedBase: 0,
    backfillCandidates: 0,
    missingTarjetaId: [],
    invalidContentLocale: [],
    partialContracts: [],
    duplicateRenditions: [],
    sourceLanguages: {},
  };
  const renditionPaths = new Map<string, string[]>();

  for (const file of files) {
    const parsed = matter(await fs.readFile(file, "utf8"));
    const data = (parsed.data ?? {}) as Record<string, unknown>;
    // README y documentos operativos no forman parte del corpus recuperable.
    if (!data.tarjeta_id && !data.source_kind) continue;

    result.cards += 1;
    const displayPath = path.relative(process.cwd(), file).split(path.sep).join("/");
    const tarjetaId = text(data.tarjeta_id);
    if (!tarjetaId) result.missingTarjetaId.push(displayPath);

    const rawLocale = data.content_locale;
    const contentLocale = normalizeContentLocale(rawLocale);
    if (rawLocale !== undefined && !contentLocale) {
      result.invalidContentLocale.push({ path: displayPath, value: rawLocale });
    }
    if (contentLocale) result.explicitByLocale[contentLocale] += 1;
    else {
      result.legacyAssumedBase += 1;
      if (tarjetaId) result.backfillCandidates += 1;
    }

    const contractValues = CONTRACT_FIELDS.filter((field) => data[field] !== undefined);
    if (contractValues.length > 0 && contractValues.length < 5) {
      result.partialContracts.push(displayPath);
    }

    const sourceLanguage = text(data.source_language)?.toLowerCase() ?? "missing";
    increment(result.sourceLanguages, sourceLanguage);

    const renditionKey = corpusRenditionKey(data);
    if (renditionKey) {
      const paths = renditionPaths.get(renditionKey) ?? [];
      paths.push(displayPath);
      renditionPaths.set(renditionKey, paths);
    }
  }

  result.duplicateRenditions = [...renditionPaths.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([key, paths]) => ({ key, paths }))
    .sort((left, right) => left.key.localeCompare(right.key));
  result.missingTarjetaId.sort();
  result.partialContracts.sort();
  result.invalidContentLocale.sort((left, right) => left.path.localeCompare(right.path));
  result.sourceLanguages = Object.fromEntries(
    Object.entries(result.sourceLanguages).sort(([left], [right]) => left.localeCompare(right)),
  );

  // Hace explícito que el supuesto legacy solo puede ser el locale base.
  if (BASE_CONTENT_LOCALE !== "es") {
    throw new Error("locale audit legacy assumption must be reviewed");
  }
  return result;
}
