const SOURCE_TAG = /<\/?source\b[^>]*>/gi;

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
