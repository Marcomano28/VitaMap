import assert from "node:assert/strict";
import { deterministicResponseFlags } from "../lib/guardrail";

assert.deepEqual(
  deterministicResponseFlags(
    "La glucosa fue 5.5 mmol/L, equivalente a unos 99 mg/dL.",
  ),
  ["unit_conversion_without_rule"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "En julio fue 5.5 mmol/L, que equivalen a unos 99 mg/dL; son casi idénticos a los 101 mg/dL de mayo.",
  ),
  ["unit_conversion_without_rule"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "En enero fue 105 mg/dL y en julio bajó a 5.5 mmol/L.",
  ),
  ["unit_conversion_without_rule"],
);
assert.deepEqual(
  deterministicResponseFlags("El LDL sigue por encima del objetivo habitual."),
  ["personal_target_without_source"],
);
assert.deepEqual(
  deterministicResponseFlags("La PCR mostraba niveles normales."),
  ["personal_target_without_source"],
);
assert.deepEqual(
  deterministicResponseFlags("Estaba por encima del umbral saludable general."),
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
    "Los niveles normales sugieren que no había un proceso inflamatorio activo significativo.",
  ),
  ["personal_target_without_source", "unsupported_lab_inference"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "La ferritina no estaba siendo alterada por un proceso inflamatorio activo.",
  ),
  ["unsupported_lab_inference"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "Este valor no permite descartar inflamación.",
  ),
  [],
);
assert.deepEqual(
  deterministicResponseFlags(
    "El informe indica LDL 3.4 mmol/L y un intervalo de referencia menor de 3.0 mmol/L.",
  ),
  [],
);
assert.deepEqual(
  deterministicResponseFlags(
    "En mayo tenías 101 mg/dL y en julio 99 mg/dL.",
    `<source type="personal" observed_at="2026-05-12">Glucosa: 101 mg/dL</source>
<source type="personal" observed_at="2026-07-03">Glucosa: 5.5 mmol/L</source>`,
  ),
  ["unsupported_factual_claim", "unit_conversion_without_rule"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "En julio el LDL fue 131 mg/dL.",
    `<source type="personal" observed_at="2026-07-03">LDL: 3.4 mmol/L</source>`,
  ),
  ["unsupported_factual_claim", "unit_conversion_without_rule"],
);
assert.deepEqual(
  deterministicResponseFlags(
    "En julio la glucosa fue 5.5 mmol/L.",
    `<source type="personal" observed_at="2026-07-03">Glucosa: 5.5 mmol/L</source>`,
  ),
  [],
);
assert.deepEqual(
  deterministicResponseFlags(
    "El LDL transporta colesterol en la sangre; una guía educativa puede expresar sus valores en mg/dL.",
    `<source type="evidence">LDL cholesterol is commonly reported in mg/dL.</source>`,
    false,
  ),
  [],
);
assert.deepEqual(
  deterministicResponseFlags(
    "El LDL está dentro del rango saludable.",
    `<source type="personal">LDL: 139 mg/dL</source>`,
    true,
  ),
  ["personal_target_without_source"],
);

console.log("Lab response policy: todas las pruebas pasaron.");
