// El cierre alternativo `$` es importante: una respuesta cortada por el
// límite de tokens puede terminar a mitad de `<source ...` y esa parte del
// protocolo interno tampoco debe llegar al navegador.
const SOURCE_TAG = /<\/?source\b[^>]*(?:>|$)/gi;

/**
 * Las etiquetas <source> forman parte del protocolo interno con el LLM.
 * react-markdown ignora HTML por seguridad, por lo que deben retirarse
 * conservando su contenido antes de enviar la respuesta al navegador.
 */
export function prepareAssistantText(text: string): string {
  return text
    .replace(SOURCE_TAG, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasVisibleAssistantText(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

export function canRecoverMissingCitation(
  flags: readonly string[],
  reliable: boolean,
  hasCitations: boolean,
): boolean {
  return (
    reliable &&
    hasCitations &&
    flags.length > 0 &&
    flags.every((flag) => flag === "missing_evidence_tag")
  );
}
