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

const academicComparison = buildRetrievalQuery(
  "Compara el uso ayurvédico de ashwagandha con la evidencia científica",
  [],
  "es",
);
assert.match(academicComparison, /uso tradicional histórico fuente contexto/);
assert.match(academicComparison, /evidencia moderna estudios eficacia clínica/);
assert.match(academicComparison, /comparación carril clínico tradición/);

// Afirmación pura tras una oferta del asistente: la query debe construirse
// desde el turno anterior (caso real: "si" tras oferta sobre absorción de
// B12 recuperaba analíticas personales sin relación).
const b12History = [
  { role: "user" as const, content: "¿Qué alimentos contienen vitamina B12?" },
  {
    role: "assistant" as const,
    content:
      "La vitamina B12 está principalmente en alimentos de origen animal. " +
      "¿Te interesa saber más sobre cómo el cuerpo absorbe la vitamina B12?",
  },
];

const ackQuery = buildRetrievalQuery("si", b12History, "es");
assert.match(ackQuery, /vitamina B12/);
assert.match(ackQuery, /absorbe/);
assert.notEqual(ackQuery, "si");

assert.match(
  buildRetrievalQuery("¡Sí, claro!", b12History, "es"),
  /vitamina B12/,
);

assert.match(
  buildRetrievalQuery(
    "Ja, gerne",
    [
      { role: "user" as const, content: "Was ist Chaga?" },
      {
        role: "assistant" as const,
        content: "Chaga ist ein Pilz. Möchtest du mehr über die Zubereitung wissen?",
      },
    ],
    "de",
  ),
  /Chaga[\s\S]*Zubereitung/,
);

// Sin historial, una afirmación se trata como mensaje normal.
assert.equal(buildRetrievalQuery("si", [], "es"), "si");

// Un mensaje corto pero con contenido NO debe tratarse como afirmación.
assert.match(
  buildRetrievalQuery("¿Qué significa mi TSH?", b12History, "es"),
  /TSH/,
);

assert.equal(responseTokenBudget("¿Qué es el chaga?"), 180);
assert.equal(responseTokenBudget("Explícamelo con todos los detalles"), 350);

console.log("Política conversacional: todas las pruebas pasaron.");
