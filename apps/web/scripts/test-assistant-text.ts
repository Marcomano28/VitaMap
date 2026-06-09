import assert from "node:assert/strict";
import {
  canRecoverMissingCitation,
  hasVisibleAssistantText,
  prepareAssistantText,
} from "../lib/assistant-text";

const wrapped = `<source type="personal" observed_at="2026-06-08">
- Glucosa en ayunas: 112 mg/dL.
- Vitamina D: 18 ng/mL.
</source>`;

assert.equal(
  prepareAssistantText(wrapped),
  "- Glucosa en ayunas: 112 mg/dL.\n- Vitamina D: 18 ng/mL.",
);
assert.equal(
  prepareAssistantText(
    "Según tu analítica:\n\n<source type=\"personal\">Valor elevado.</source>",
  ),
  "Según tu analítica:\n\nValor elevado.",
);
assert.equal(hasVisibleAssistantText(prepareAssistantText("<source></source>")), false);
assert.equal(hasVisibleAssistantText("**Dato:** 112"), true);
assert.equal(
  canRecoverMissingCitation(["missing_evidence_tag"], true, true),
  true,
);
assert.equal(
  canRecoverMissingCitation(["diagnostic_statement"], true, true),
  false,
);
assert.equal(
  canRecoverMissingCitation(
    ["missing_evidence_tag", "treatment_recommendation"],
    true,
    true,
  ),
  false,
);
assert.equal(
  canRecoverMissingCitation(["missing_evidence_tag"], false, true),
  false,
);
assert.equal(
  canRecoverMissingCitation(["missing_evidence_tag"], true, false),
  false,
);

console.log("Assistant text: todas las pruebas pasaron.");
