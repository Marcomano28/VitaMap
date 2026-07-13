import assert from "node:assert/strict";
import { selectEvidenceForContentLocale } from "../lib/content-locale-selection";
import type { RetrievedChunk } from "../lib/qmd";

function chunk(
  title: string,
  canonicalCardId: string,
  contentLocale: "es" | "de" | "en" | undefined,
  overrides: Partial<RetrievedChunk> = {},
): RetrievedChunk {
  return {
    source: "evidence",
    docId: title,
    path: `${title}.md`,
    title,
    context: "",
    snippet: title,
    score: 1,
    canonicalCardId,
    contentLocale,
    localizationKind: contentLocale === "es" ? "original" : "translation",
    localizationStatus: "reviewed",
    ...overrides,
  };
}

const ldlEs = chunk("LDL ES", "ldl", "es");
const ldlDe = chunk("LDL DE", "ldl", "de", { score: 0.8 });
const ldlEn = chunk("LDL EN", "ldl", "en", { score: 0.9 });
const glucoseEs = chunk("Glucosa ES", "glucose", "es");

assert.deepEqual(
  selectEvidenceForContentLocale([ldlEs, ldlEn, ldlDe, glucoseEs], "de").map(
    (item) => item.title,
  ),
  ["LDL DE", "Glucosa ES"],
);
assert.equal(
  selectEvidenceForContentLocale([ldlEs, ldlDe], "de")[0]?.contentLocaleFallback,
  false,
);
assert.equal(
  selectEvidenceForContentLocale([glucoseEs], "de")[0]?.contentLocaleFallback,
  true,
);
assert.deepEqual(
  selectEvidenceForContentLocale([ldlDe, ldlEn, ldlEs], "es").map(
    (item) => item.title,
  ),
  ["LDL ES"],
);

const staleDe = chunk("LDL DE stale", "ldl", "de", {
  localizationStatus: "stale",
});
const draftDe = chunk("LDL DE draft", "ldl", "de", {
  localizationStatus: "draft",
});
assert.deepEqual(
  selectEvidenceForContentLocale([staleDe, draftDe, ldlEs], "de").map(
    (item) => item.title,
  ),
  ["LDL ES"],
);

const englishOriginal = chunk("Original EN", "english-only", "en", {
  localizationKind: "original",
});
assert.equal(
  selectEvidenceForContentLocale([englishOriginal], "de")[0]?.title,
  "Original EN",
);
assert.equal(
  selectEvidenceForContentLocale([ldlEn], "de").length,
  0,
  "an unrelated translated rendition must not become an implicit fallback",
);

const legacy: RetrievedChunk = {
  ...chunk("Legacy ES", "ignored", undefined),
  canonicalCardId: undefined,
  tarjetaId: "legacy-es",
  localizationKind: undefined,
  localizationStatus: undefined,
};
assert.equal(
  selectEvidenceForContentLocale([legacy], "de")[0]?.contentLocaleFallback,
  true,
);

console.log("Selección de contenido: idioma, fallback y deduplicación verificados.");
