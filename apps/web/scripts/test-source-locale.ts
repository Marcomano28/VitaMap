import assert from "node:assert/strict";
import {
  inferSourceLocaleFromUrl,
  preferEvidenceForLocale,
} from "../lib/source-locale";
import type { RetrievedChunk } from "../lib/qmd";

assert.deepEqual(
  inferSourceLocaleFromUrl("https://www.gesundheitsinformation.de/cholesterin.html"),
  { sourceLanguage: "de", sourceJurisdiction: ["DE"] },
);
assert.deepEqual(
  inferSourceLocaleFromUrl("https://medlineplus.gov/lab-tests/cholesterol-levels/"),
  { sourceLanguage: "en", sourceJurisdiction: ["US"] },
);
assert.deepEqual(
  inferSourceLocaleFromUrl("https://www.ema.europa.eu/de/documents/example"),
  { sourceLanguage: "de", sourceJurisdiction: ["EU"] },
);

const enSource: RetrievedChunk = {
  source: "evidence",
  docId: "en",
  path: "cholesterol/en.md",
  title: "English source",
  context: "",
  snippet: "English",
  score: 1,
  sourceUrl: "https://medlineplus.gov/lab-tests/cholesterol-levels/",
  sourceLanguage: "en",
  sourceJurisdiction: ["US"],
};

const deSource: RetrievedChunk = {
  ...enSource,
  docId: "de",
  path: "cholesterol/de.md",
  title: "German source",
  score: 0.5,
  sourceUrl: "https://www.gesundheitsinformation.de/cholesterin.html",
  sourceLanguage: "de",
  sourceJurisdiction: ["DE"],
};

assert.deepEqual(
  preferEvidenceForLocale([enSource, deSource], "de").map((item) => item.title),
  ["German source", "English source"],
);

assert.deepEqual(
  preferEvidenceForLocale([enSource, deSource], "es").map((item) => item.title),
  ["English source", "German source"],
);

console.log("test-source-locale: OK");
