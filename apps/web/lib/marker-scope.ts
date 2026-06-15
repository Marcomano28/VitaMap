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
 * Taxonomía mínima para el piloto (los marcadores del panel sintético +
 * hepáticas, que fue el falso positivo observado). Es ampliable; a medio plazo
 * lo ideal es un campo `marker` en el frontmatter del corpus y no depender de
 * la coincidencia por nombre.
 */

/** marcador canónico -> alias (ya plegados: minúsculas ascii, sin acentos). */
const CANONICAL: Record<string, string[]> = {
  glucosa: ["glucosa", "glucemia", "glucose"],
  hba1c: ["hba1c", "glicosilada", "a1c"],
  "colesterol-total": ["colesterol total"],
  ldl: ["ldl"],
  hdl: ["hdl"],
  trigliceridos: ["trigliceridos", "triglicerido"],
  hemoglobina: ["hemoglobina", "hematocrito", "hemograma"],
  leucocitos: ["leucocitos", "leucocito", "leucocitaria"],
  plaquetas: ["plaquetas", "plaqueta"],
  creatinina: ["creatinina", "egfr", "filtrado glomerular"],
  tsh: ["tsh"],
  tiroxina: ["tiroxina", "t4 libre", "t4l"],
  "vitamina-d": ["vitamina d", "25 oh", "25 hidroxi", "25 hidroxivitamina"],
  "vitamina-b12": ["vitamina b12", "b12", "cobalamina"],
  "acido-folico": ["acido folico", "folato", "vitamina b9"],
  "acido-urico": ["acido urico", "urato"],
  pcr: ["pcr", "proteina c reactiva"],
  hierro: ["hierro", "ferritina", "transferrina"],
  higado: [
    "hepatica",
    "hepaticas",
    "transaminasa",
    "transaminasas",
    "alt",
    "ast",
    "ggt",
    "gamma glutamil",
    "fosfatasa alcalina",
    "alp",
    "bilirrubina",
  ],
};

/** minúsculas, sin acentos, separadores -> espacio (para coincidencia por palabra). */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Marcadores canónicos mencionados en un texto (coincidencia por palabra completa). */
export function markersIn(text: string): Set<string> {
  const padded = ` ${fold(text)} `;
  const found = new Set<string>();
  for (const [key, aliases] of Object.entries(CANONICAL)) {
    if (aliases.some((a) => padded.includes(` ${a} `))) found.add(key);
  }
  return found;
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
export function keepDoc(docText: string, allowed: ReadonlySet<string>): boolean {
  const docMarkers = markersIn(docText);
  if (docMarkers.size === 0) return true;
  for (const m of docMarkers) if (allowed.has(m)) return true;
  return false;
}

/**
 * Filtra una lista de documentos de evidencia a los marcadores permitidos.
 * Conservador: si no hay marcadores permitidos detectados, no filtra (evita
 * regresiones cuando no podemos inferir el contexto).
 */
export function filterByMarkers<T extends { path: string; title: string }>(
  docs: readonly T[],
  allowed: ReadonlySet<string>,
): T[] {
  if (allowed.size === 0) return [...docs];
  return docs.filter((d) => keepDoc(`${d.path} ${d.title}`, allowed));
}
