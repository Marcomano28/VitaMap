import assert from "node:assert/strict";
import {
  BASE_CONTENT_LOCALE,
  corpusRenditionKey,
  isContentLocale,
  isLocale,
  isPublicContentLocale,
  languageContext,
  localeTag,
  normalizeLocale,
  normalizeContentLocale,
} from "../lib/language-contract";

assert.equal(BASE_CONTENT_LOCALE, "es");
assert.equal(isLocale("es"), true);
assert.equal(isLocale("en"), false);
assert.equal(isContentLocale("en"), true);
assert.equal(isPublicContentLocale("en"), false);
assert.equal(isPublicContentLocale("de"), true);
assert.equal(normalizeLocale("de-DE"), "de");
assert.equal(normalizeLocale("es_MX"), "es");
assert.equal(normalizeLocale("en-US"), undefined);
assert.equal(normalizeContentLocale("en-US"), "en");
assert.equal(localeTag("de"), "de-DE");
assert.deepEqual(languageContext("es"), {
  uiLocale: "es",
  answerLocale: "es",
  contentLocale: "es",
});
assert.equal(
  corpusRenditionKey({ canonical_card_id: "glucosa-ayunas", content_locale: "de" }),
  "glucosa-ayunas::de",
);
assert.equal(corpusRenditionKey({ tarjeta_id: "legacy" }), undefined);

console.log("Contrato de idiomas: locales y rendiciones verificados.");
