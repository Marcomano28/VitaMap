import assert from "node:assert/strict";
import { deterministicResponseFlags } from "../lib/guardrail";

assert.deepEqual(
  deterministicResponseFlags(
    "La glucosa fue 5.5 mmol/L, equivalente a unos 99 mg/dL.",
  ),
  ["unit_conversion_without_rule"],
);
assert.deepEqual(
  deterministicResponseFlags("El LDL sigue por encima del objetivo habitual."),
  ["personal_target_without_source"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "La PCR está en rango, lo que sugiere que no había inflamación activa.",
  ),
  ["unsupported_lab_inference"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "El informe indica LDL 3.4 mmol/L y un intervalo de referencia menor de 3.0 mmol/L.",
  ),
  [],
);

console.log("Lab response policy: todas las pruebas pasaron.");
