/**
 * Contrato central de idioma de VitaMap.
 *
 * Un locale de producto no debe confundirse con el idioma de una fuente ni
 * con la jurisdicción clínica. Este módulo solo define los idiomas que VitaMap
 * puede presentar de forma controlada en la interfaz y en el corpus.
 */

/** Locales públicos de interfaz y respuesta. */
export const LOCALES = ["es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

/** Locales que el corpus puede almacenar, aunque no sean todavía públicos. */
export const CONTENT_LOCALES = ["es", "de", "en"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";
export const BASE_CONTENT_LOCALE: ContentLocale = "es";
export const LOCALE_COOKIE = "vitamap_locale";

export const LOCALIZATION_KINDS = ["original", "translation"] as const;
export type LocalizationKind = (typeof LOCALIZATION_KINDS)[number];

export const LOCALIZATION_STATUSES = [
  "draft",
  "machine-draft",
  "reviewed",
  "stale",
] as const;
export type LocalizationStatus = (typeof LOCALIZATION_STATUSES)[number];

export const LOCALE_DEFINITIONS = {
  es: {
    tag: "es-ES",
    languageName: "español",
    contentLocale: "es",
  },
  de: {
    tag: "de-DE",
    languageName: "Deutsch",
    contentLocale: "de",
  },
} as const satisfies Record<
  Locale,
  { tag: string; languageName: string; contentLocale: ContentLocale }
>;

export const CONTENT_LOCALE_DEFINITIONS = {
  es: { languageName: "español", public: true },
  de: { languageName: "Deutsch", public: true },
  en: { languageName: "English", public: false },
} as const satisfies Record<
  ContentLocale,
  { languageName: string; public: boolean }
>;

export interface LanguageContext {
  /** Idioma de controles, navegación, fechas y mensajes deterministas. */
  uiLocale: Locale;
  /** Idioma exigido para la respuesta generada. */
  answerLocale: Locale;
  /** Variante de corpus preferida para esta interacción. */
  contentLocale: Locale;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isContentLocale(value: string): value is ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(value);
}

export function isPublicContentLocale(value: string): value is Locale {
  return isLocale(value);
}

/** Acepta el código interno y etiquetas BCP-47 de la misma lengua. */
export function normalizeLocale(value: unknown): Locale | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  const base = normalized.split("-")[0];
  return isLocale(base) ? base : undefined;
}

export function normalizeContentLocale(value: unknown): ContentLocale | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  const base = normalized.split("-")[0];
  return isContentLocale(base) ? base : undefined;
}

export function localeTag(locale: Locale): "es-ES" | "de-DE" {
  return LOCALE_DEFINITIONS[locale].tag;
}

export function languageContext(uiLocale: Locale): LanguageContext {
  return {
    uiLocale,
    answerLocale: uiLocale,
    contentLocale: LOCALE_DEFINITIONS[uiLocale].contentLocale,
  };
}

export function isLocalizationKind(value: unknown): value is LocalizationKind {
  return (
    typeof value === "string" &&
    (LOCALIZATION_KINDS as readonly string[]).includes(value)
  );
}

export function isLocalizationStatus(value: unknown): value is LocalizationStatus {
  return (
    typeof value === "string" &&
    (LOCALIZATION_STATUSES as readonly string[]).includes(value)
  );
}

export function corpusRenditionKey(frontmatter: Record<string, unknown>): string | undefined {
  const canonicalId = text(frontmatter.canonical_card_id);
  const locale = normalizeContentLocale(frontmatter.content_locale);
  return canonicalId && locale ? `${canonicalId}::${locale}` : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
