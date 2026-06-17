/**
 * Acotación de la recuperación de KB por marcador (Opción A del análisis de
 * retrieval; ADR-016 / QMD-EVOLUCION §7-P0 y §13.12).
 *
 * QMD 2.5.3 no permite filtrar `search` por frontmatter, solo por colección.
 * Y, sin reranking, su `score` es posicional (1/posición), no relevancia: el
 * `minScore` actúa como recorte de ranking, no como puerta de relevancia. Por
 * eso un documento de otro marcador (p. ej. pruebas hepáticas) puede colarse
 * en una conversación de glucosa/LDL.
 *
 * Este módulo es el núcleo PURO del arreglo: deriva qué marcadores menciona un
 * texto y filtra los documentos de evidencia para quedarse solo con los del
 * marcador en juego. No toca QMD ni el retrieval: se prueba de forma aislada y
 * se cablea después (detrás de un flag) en `queryMemoryAndKB`.
 *
 * El vocabulario runtime se genera desde `corpus-preparation/corpus-taxonomy.json`.
 * Esto evita que la taxonomía editorial y el filtro en producción deriven por
 * separado.
 */

import {
  HEALTH_AREAS,
  LENS_MARKERS,
  MARKER_ALIASES,
  QUERY_GROUPS,
} from "./generated/marker-vocabulary";

/** minúsculas, sin acentos, separadores -> espacio (para coincidencia por palabra). */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MARKER_MATCHERS = Object.entries(MARKER_ALIASES).map(([marker, aliases]) => ({
  marker,
  aliases: aliases.map((alias) => ` ${fold(alias)} `),
}));

const QUERY_GROUP_MATCHERS = Object.values(QUERY_GROUPS).map((group) => ({
  aliases: group.aliases.map((alias) => ` ${fold(alias)} `),
  markers: group.markers,
}));

const HEALTH_AREA_MATCHERS = Object.entries(HEALTH_AREAS).map(([area, data]) => ({
  area,
  aliases: data.aliases.map((alias) => ` ${fold(alias)} `),
}));

/** Marcadores canónicos mencionados en un texto (coincidencia por palabra completa). */
export function markersIn(text: string): Set<string> {
  const padded = ` ${fold(text)} `;
  const found = new Set<string>();
  for (const { marker, aliases } of MARKER_MATCHERS) {
    if (aliases.some((alias) => padded.includes(alias))) found.add(marker);
  }
  for (const group of QUERY_GROUP_MATCHERS) {
    if (group.aliases.some((alias) => padded.includes(alias))) {
      for (const marker of group.markers) found.add(marker);
    }
  }
  return found;
}

/** Motivos de consulta mencionados como `area_de_salud` canónica. */
export function healthAreasIn(text: string): Set<string> {
  const padded = ` ${fold(text)} `;
  const found = new Set<string>();
  for (const { area, aliases } of HEALTH_AREA_MATCHERS) {
    if (aliases.some((alias) => padded.includes(alias))) found.add(area);
  }
  return found;
}

/** Términos de búsqueda derivados de areas amplias, sin usarlos como filtro duro. */
export function healthAreaSearchTerms(
  areas: ReadonlySet<string>,
  maxTermsPerArea = 12,
): string[] {
  const terms: string[] = [];
  for (const area of areas) {
    const route = HEALTH_AREAS[area as keyof typeof HEALTH_AREAS];
    if (!route) continue;
    terms.push(area.replace(/-/g, " "));
    for (const marker of route.markers.slice(0, maxTermsPerArea)) {
      terms.push(marker.replace(/-/g, " "));
    }
  }
  return [...new Set(terms)];
}

export function expandQueryForHealthAreas(query: string, areas: ReadonlySet<string>): string {
  const terms = healthAreaSearchTerms(areas);
  if (terms.length === 0) return query;
  return `${query} ${terms.join(" ")}`;
}

/**
 * ¿Conservar este documento de KB dado el conjunto de marcadores permitidos?
 *
 * - Si el documento no declara ningún marcador conocido (transversal: ayuno,
 *   interferencias analíticas, biotina…), se conserva: no sabemos de qué va,
 *   no lo descartamos.
 * - Si declara marcadores, se conserva solo si alguno está permitido.
 *
 * `docText` debe ser la procedencia estructurada del documento (ruta + título),
 * no el cuerpo, para no asignarle un marcador por una mención de pasada.
 */
function declaredMarkers(value: unknown): Set<string> {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  return new Set(
    values
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim()),
  );
}

export function keepDoc(
  docText: string,
  allowed: ReadonlySet<string>,
  marker?: unknown,
): boolean {
  const explicitMarkers = declaredMarkers(marker);
  const docMarkers = explicitMarkers.size > 0 ? explicitMarkers : markersIn(docText);
  if (docMarkers.has("general")) return true;
  if (docMarkers.size === 0) return true;
  for (const m of docMarkers) if (allowed.has(m)) return true;
  return false;
}

/**
 * Filtra una lista de documentos de evidencia a los marcadores permitidos.
 * Conservador: si no hay marcadores permitidos detectados, no filtra (evita
 * regresiones cuando no podemos inferir el contexto).
 */
export function filterByMarkers<T extends { path: string; title: string; marker?: unknown }>(
  docs: readonly T[],
  allowed: ReadonlySet<string>,
): T[] {
  if (allowed.size === 0) return [...docs];
  return docs.filter((d) => keepDoc(`${d.path} ${d.title}`, allowed, d.marker));
}

// =====================================================================
// Scope de la conversación (mensaje actual + ventana corta)
// =====================================================================

/**
 * Tokens de relleno (ES/DE) que no aportan tema: "ok", "vale", "sí",
 * "continúa", "¿y eso?"… Un mensaje es relleno si no menciona ningún marcador
 * y todas sus palabras están en este conjunto.
 */
const FILLER_TOKENS = new Set([
  // es
  "ok", "okay", "vale", "si", "no", "ya", "gracias", "claro", "perfecto",
  "entendido", "continua", "sigue", "y", "eso", "que", "mas", "bien", "ah",
  // de
  "ja", "nein", "danke", "weiter", "und", "mehr", "bitte", "gut", "ach",
]);

/** ¿El mensaje es puro relleno (sin tema recuperable)? */
export function isFiller(message: string): boolean {
  if (markersIn(message).size > 0) return false;
  if (healthAreasIn(message).size > 0) return false;
  const folded = fold(message);
  if (!folded) return true;
  return folded.split(" ").every((word) => FILLER_TOKENS.has(word));
}

/**
 * Si el scope supera este número de marcadores se considera "amplio": la
 * pregunta no apunta a un tema concreto y el filtro dejaría de ser fino. En ese
 * caso es mejor no filtrar que filtrar mal (red de seguridad acordada).
 */
const MAX_SCOPE_MARKERS = 8;

/** Cuántos mensajes de usuario no-relleno se miran hacia atrás. */
const SCOPE_WINDOW = 2;

/**
 * Marcadores "lente": perspectivas de tradición o práctica (Ayurveda, MTC,
 * acupuntura…). Una pregunta como "¿y desde el Ayurveda?" no cambia de tema:
 * añade una perspectiva sobre el tema clínico previo. Por eso, cuando el
 * mensaje actual SOLO trae marcadores-lente, no reemplazan el scope: se suman
 * al tema heredado de la ventana.
 */
const LENS_MARKER_SET: ReadonlySet<string> = new Set(LENS_MARKERS);

/** Tema (no-relleno) del mensaje de usuario más reciente dentro de la ventana. */
function inheritFromWindow(priorUserMessages: readonly string[]): Set<string> {
  let inspected = 0;
  for (let i = priorUserMessages.length - 1; i >= 0 && inspected < SCOPE_WINDOW; i--) {
    if (isFiller(priorUserMessages[i])) continue;
    inspected += 1;
    const markers = markersIn(priorUserMessages[i]);
    if (markers.size > 0) return markers;
  }
  return new Set<string>();
}

function inheritHealthAreasFromWindow(priorUserMessages: readonly string[]): Set<string> {
  let inspected = 0;
  for (let i = priorUserMessages.length - 1; i >= 0 && inspected < SCOPE_WINDOW; i--) {
    if (isFiller(priorUserMessages[i])) continue;
    inspected += 1;
    const areas = healthAreasIn(priorUserMessages[i]);
    if (areas.size > 0) return areas;
  }
  return new Set<string>();
}

/**
 * Marcadores que acotan la búsqueda, derivados del mensaje actual y, solo si
 * éste no aporta tema, de una ventana corta de mensajes previos del usuario.
 *
 * Devuelve dos ejes:
 * - `markers` (filtro FUERTE): el tema clínico. Un documento debe coincidir con
 *   alguno de estos para conservarse.
 * - `lens` (preferencia SUAVE): una perspectiva de tradición/práctica que NO
 *   filtra, solo reordena (ver `applyLensPreference`).
 * - `healthAreas` (puente AMPLIO): motivo de consulta difuso, derivado de
 *   `area_de_salud`, que expande la query y reordena sin filtrar duro.
 *
 * Reglas:
 * - El mensaje actual manda: si menciona marcadores clínicos, son el filtro
 *   fuerte (cambio de tema = respuesta inmediata).
 * - Si solo trae marcadores-lente ("¿y desde el Ayurveda?"), el tema clínico
 *   sigue siendo el heredado de la ventana (filtro fuerte) y el lente es solo
 *   preferencia. Así NO se cuela "Ayurveda genérico": se prefiere "tema desde
 *   Ayurveda" entre los documentos del tema.
 * - Si un lente aparece sin tema clínico que heredar (p. ej. "¿qué dice el
 *   Ayurveda?" en frío), el lente pasa a ser el filtro fuerte: es el tema.
 * - Si no trae tema, se hereda el de la ventana corta de mensajes de usuario.
 * - Si no hay marker pero sí motivo de consulta ("estoy cansado"), se usa
 *   `healthAreas` en vez de heredar un marker antiguo.
 * - Solo mensajes del usuario: el asistente nombra muchos marcadores al
 *   explicar y ensuciaría el scope.
 * - Si el filtro fuerte supera `MAX_SCOPE_MARKERS`, se vacía (no filtrar).
 *
 * `priorUserMessages` debe contener solo mensajes del usuario, en orden
 * cronológico (el más reciente al final). La memoria personal NO entra aquí:
 * decide qué KB se busca la pregunta, no lo que el usuario tenga guardado.
 */
export interface Scope {
  /** Marcadores del filtro fuerte (tema clínico). */
  markers: Set<string>;
  /** Marcadores-lente: preferencia suave de tradición/práctica. */
  lens: Set<string>;
  /** Motivos amplios por area_de_salud: expanden y reordenan, no filtran duro. */
  healthAreas: Set<string>;
}

export function deriveScope(
  currentMessage: string,
  priorUserMessages: readonly string[] = [],
): Scope {
  const current = markersIn(currentMessage);
  const currentHealthAreas = healthAreasIn(currentMessage);
  const currentLens = new Set([...current].filter((m) => LENS_MARKER_SET.has(m)));
  const currentClinical = new Set([...current].filter((m) => !LENS_MARKER_SET.has(m)));

  let markers: Set<string>;
  let lens = new Set<string>();
  let healthAreas = new Set<string>();

  if (currentClinical.size > 0) {
    // Tema clínico explícito en el mensaje: manda como filtro fuerte. Un lente
    // que venga en el mismo mensaje acompaña como preferencia.
    markers = currentClinical;
    lens = currentLens;
  } else if (currentLens.size > 0) {
    // Solo lente: el tema fuerte es el heredado; si no hay, el lente es el tema.
    const inherited = inheritFromWindow(priorUserMessages);
    if (inherited.size > 0) {
      markers = inherited;
      lens = currentLens;
    } else if (currentHealthAreas.size > 0) {
      markers = new Set<string>();
      lens = currentLens;
      healthAreas = currentHealthAreas;
    } else {
      markers = currentLens;
    }
  } else if (currentHealthAreas.size > 0) {
    // Motivo de consulta explícito: no heredar un marcador antiguo. Es un scope
    // amplio y curado por area_de_salud.
    markers = new Set<string>();
    healthAreas = currentHealthAreas;
  } else {
    // Sin tema: heredar primero marker; si no existe, motivo amplio.
    markers = inheritFromWindow(priorUserMessages);
    if (markers.size === 0) healthAreas = inheritHealthAreasFromWindow(priorUserMessages);
  }

  if (markers.size > MAX_SCOPE_MARKERS) {
    return { markers: new Set<string>(), lens: new Set<string>(), healthAreas: new Set<string>() };
  }
  return { markers, lens, healthAreas };
}

/**
 * Reordena los documentos conservados para que el lente (perspectiva de
 * tradición/práctica solicitada) suba al primer plano, sin descartar nada. Un
 * documento "coincide con el lente" si su `tradicion` está en el lente o si es
 * una tarjeta de sección tradición. Estable: respeta el orden previo dentro de
 * cada grupo.
 */
export function applyLensPreference<T extends { tradicion?: string; seccion?: string }>(
  docs: readonly T[],
  lens: ReadonlySet<string>,
): T[] {
  if (lens.size === 0) return [...docs];
  const matchesLens = (d: T) =>
    typeof d.tradicion === "string" ? lens.has(d.tradicion) : d.seccion === "tradicion";
  const preferred = docs.filter(matchesLens);
  const rest = docs.filter((d) => !matchesLens(d));
  return [...preferred, ...rest];
}

/** Reordena por motivos de consulta (`area_de_salud`) sin descartar documentos. */
export function applyHealthAreaPreference<T extends { areaDeSalud?: readonly string[] }>(
  docs: readonly T[],
  areas: ReadonlySet<string>,
): T[] {
  if (areas.size === 0) return [...docs];
  const matchesArea = (d: T) => d.areaDeSalud?.some((area) => areas.has(area)) ?? false;
  const preferred = docs.filter(matchesArea);
  const rest = docs.filter((d) => !matchesArea(d));
  return [...preferred, ...rest];
}
