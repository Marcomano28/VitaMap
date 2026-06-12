export type ConversationLocale = "es" | "de";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

type RetrievalIntent =
  | "identity"
  | "safety"
  | "evidence"
  | "tradition"
  | "comparison"
  | "general";

const INTENT_PATTERNS: Array<[RetrievalIntent, RegExp]> = [
  [
    "safety",
    /(segur(?:o|a|idad)|riesg\w*|efecto(?:s)? secundari\w*|interacci\w*|precauci\w*|embaraz\w*|lactancia|riñ[oó]n|renal|h[ií]gado|hep[aá]tic\w*|oxalato|sicher\w*|risik\w*|nebenwirkung\w*|wechselwirkung\w*|schwanger\w*|stillzeit|niere|leber)/i,
  ],
  [
    "comparison",
    /(compar\w*|diferencia\w*|frente a|versus|\bvs\.?\b|vergleich\w*|unterschied\w*|gegenüber)/i,
  ],
  [
    "tradition",
    /(tradici\w*|hist[oó]ric\w*|ayurv[eé]\w*|medicina china|mtc|uso antiguo|tradition\w*|historisch\w*|chinesische medizin)/i,
  ],
  [
    "evidence",
    /(evidencia|estudio\w*|investigaci\w*|cient[ií]fic\w*|demostrad\w*|funciona|eficacia|ensayo\w*|c[aá]ncer|tumor\w*|evidenz|studie\w*|forschung|wissenschaft\w*|wirkt|wirksam\w*|krebs)/i,
  ],
  [
    "identity",
    /(qu[eé] es|identidad|especie|nombre cient[ií]fico|familia|h[aá]bitat|d[oó]nde crece|parte utilizada|forma de producto|was ist|identit[aä]t|wissenschaftlicher name|familie|lebensraum|w[aä]chst)/i,
  ],
];

const INTENT_HINTS: Record<ConversationLocale, Record<Exclude<RetrievalIntent, "general">, string>> = {
  es: {
    identity: "identidad especie nombre científico familia hábitat parte utilizada formas de producto",
    safety: "seguridad efectos adversos riesgos interacciones precauciones",
    evidence: "evidencia moderna estudios eficacia clínica limitaciones",
    tradition: "uso tradicional histórico fuente contexto preparación",
    comparison: "comparación carril clínico tradición coincidencias diferencias fuentes académicas",
  },
  de: {
    identity: "Identität Art wissenschaftlicher Name Familie Lebensraum verwendeter Teil Produktformen",
    safety: "Sicherheit Nebenwirkungen Risiken Wechselwirkungen Vorsichtsmaßnahmen",
    evidence: "moderne Evidenz Studien klinische Wirksamkeit Einschränkungen",
    tradition: "traditionelle historische Verwendung Quelle Kontext Zubereitung",
    comparison: "Vergleich klinischer Ansatz Tradition Gemeinsamkeiten Unterschiede akademische Quellen",
  },
};

const FOLLOW_UP_PATTERN =
  /^(?:y|e|pero|entonces|adem[aá]s|tambi[eé]n|eso|esto|lo|la|los|las|es|son|puede|podr[ií]a|funciona|sirve|segur|riesg|por qu[eé]|c[oó]mo|cu[aá]l|und|aber|also|auch|das|dies|ist|sind|kann|wirkt|sicher|warum|wie|welch)/i;

function detectIntents(message: string): RetrievalIntent[] {
  const intents = INTENT_PATTERNS.flatMap(([intent, pattern]) =>
    pattern.test(message) ? [intent] : [],
  );
  return intents.length > 0 ? intents : ["general"];
}

function lastUserMessage(history: readonly HistoryMessage[]): string | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item.role === "user" && item.content.trim()) return item.content.trim();
  }
  return undefined;
}

function isLikelyFollowUp(message: string): boolean {
  const words = message.trim().split(/\s+/);
  const withoutLeadingPunctuation = message.trim().replace(/^[¿?¡!.,;:\s]+/, "");
  return words.length <= 12 && FOLLOW_UP_PATTERN.test(withoutLeadingPunctuation);
}

export function buildRetrievalQuery(
  message: string,
  history: readonly HistoryMessage[],
  locale: ConversationLocale,
): string {
  const current = message.replace(/\s+/g, " ").trim();
  const previous = isLikelyFollowUp(current) ? lastUserMessage(history) : undefined;
  const hints = detectIntents(current)
    .filter((intent): intent is Exclude<RetrievalIntent, "general"> => intent !== "general")
    .map((intent) => INTENT_HINTS[locale][intent]);

  return [previous?.slice(0, 240), current, ...hints].filter(Boolean).join("\n");
}

const EXPANSION_REQUEST =
  /\b(detall|profund|ampli|complet|todos|todas|lista|compar|paso a paso|exhaust|ausf[uü]hrlich|vertief|vollst[aä]ndig|alle|liste|vergleich|schritt f[uü]r schritt)\b/i;

export function responseTokenBudget(message: string): number {
  return EXPANSION_REQUEST.test(message) ? 350 : 180;
}
