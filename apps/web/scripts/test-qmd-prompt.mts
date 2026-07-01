import assert from "node:assert/strict";
import { qmdHitSnippet } from "../lib/qmd-hit";
import { wrapForPrompt } from "../lib/qmd-prompt";
import type { RetrievedChunk } from "../lib/qmd";

const indexedDocument = `---
title: "Chaga (Inonotus obliquus): identidad"
source_kind: institutional-education
rights_status: permitted
limitations:
  - "No evalúa eficacia ni seguridad."
---

# Chaga (*Inonotus obliquus*): identidad

El chaga es un hongo. Pertenece a la familia Hymenochaetaceae y se asocia
principalmente con abedules de regiones frías del hemisferio norte.
`;

const chunk: RetrievedChunk = {
  source: "evidence",
  docId: "chaga-identity",
  path: "chaga/chaga-identidad-biologica.md",
  title: "Chaga: identidad",
  context: "",
  snippet: qmdHitSnippet({ bestChunk: indexedDocument }),
  score: 1,
  sourceKind: "institutional-education",
  sourceDocumentType: "medicinal-species-identity-summary",
  limitations: ["No evalúa eficacia ni seguridad."],
  sourceUrl: "https://example.test/chaga",
  sourceLanguage: "de",
  sourceJurisdiction: ["DE"],
};

const prompt = wrapForPrompt([chunk]);

assert.doesNotMatch(prompt, /rights_status:/);
assert.match(prompt, /title="Chaga: identidad"/);
assert.match(prompt, /source_language="de"/);
assert.match(prompt, /source_jurisdiction="DE"/);
assert.match(prompt, /Hymenochaetaceae/);
assert.match(prompt, /abedules/);
assert.doesNotMatch(prompt, /Tricholomataceae|coníferas|árboles muertos/i);

console.log("Prompt QMD: la evidencia útil llega sin frontmatter.");

// --- Regresión ADR-017: truncación diferenciada evidencia (2000) vs personal (600) ---
const CAVEAT = "MATIZ_TRAS_600";
const longBody =
  "Seccion inicial. " + "relleno ".repeat(90) + `${CAVEAT} que no permite concluir.`;
assert.ok(
  longBody.indexOf(CAVEAT) > 600,
  "precondición: el sentinel debe caer después del carácter 600",
);

const evidenceLong: RetrievedChunk = {
  ...chunk,
  docId: "evid-long",
  path: "x/evid-long.md",
  snippet: longBody,
};
assert.match(
  wrapForPrompt([evidenceLong]),
  new RegExp(CAVEAT),
  "evidencia: el caveat tras el carácter 600 debe conservarse (límite 2000)",
);

const personalLong: RetrievedChunk = {
  ...chunk,
  source: "personal",
  docId: "mem-long",
  path: "mem/long.md",
  observedAt: "2026-01-01",
  snippet: longBody,
};
const personalPrompt = wrapForPrompt([personalLong]);
assert.doesNotMatch(
  personalPrompt,
  new RegExp(CAVEAT),
  "memoria personal: un cuerpo largo debe truncarse antes del caveat (límite 600)",
);
assert.match(
  personalPrompt,
  /\[…\]/,
  "memoria personal larga debe marcar el truncado",
);

console.log("Prompt QMD ADR-017: evidencia conserva matices, memoria personal se trunca.");
