import assert from "node:assert/strict";
import {
  buildRetrievalQuery,
  responseTokenBudget,
} from "../lib/conversation-policy";

assert.equal(
  buildRetrievalQuery("Háblame del chaga", [], "es"),
  "Háblame del chaga",
);

assert.match(
  buildRetrievalQuery(
    "¿Y es seguro?",
    [
      { role: "user", content: "Háblame del chaga" },
      { role: "assistant", content: "Es un hongo asociado a abedules." },
    ],
    "es",
  ),
  /Háblame del chaga[\s\S]*seguridad efectos adversos/,
);

assert.match(
  buildRetrievalQuery(
    "Und ist es sicher?",
    [{ role: "user", content: "Was ist Chaga?" }],
    "de",
  ),
  /Was ist Chaga\?[\s\S]*Sicherheit Nebenwirkungen/,
);

assert.doesNotMatch(
  buildRetrievalQuery(
    "¿Qué significa mi TSH?",
    [{ role: "user", content: "Háblame del chaga" }],
    "es",
  ),
  /chaga/i,
);

assert.equal(responseTokenBudget("¿Qué es el chaga?"), 180);
assert.equal(responseTokenBudget("Explícamelo con todos los detalles"), 350);

console.log("Política conversacional: todas las pruebas pasaron.");
