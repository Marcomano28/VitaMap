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
};

const prompt = wrapForPrompt([chunk]);

assert.doesNotMatch(prompt, /rights_status:/);
assert.match(prompt, /title="Chaga: identidad"/);
assert.match(prompt, /Hymenochaetaceae/);
assert.match(prompt, /abedules/);
assert.doesNotMatch(prompt, /Tricholomataceae|coníferas|árboles muertos/i);

console.log("Prompt QMD: la evidencia útil llega sin frontmatter.");
