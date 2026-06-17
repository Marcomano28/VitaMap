import assert from "node:assert/strict";
import {
  markersIn,
  keepDoc,
  filterByMarkers,
  deriveScope,
  isFiller,
  applyLensPreference,
  healthAreasIn,
  expandQueryForHealthAreas,
  applyHealthAreaPreference,
} from "../lib/marker-scope";

// --- markersIn: detección por nombre, con acentos y separadores -------------
assert.deepEqual([...markersIn("LDL 139 mg/dL")], ["colesterol-ldl"]);
assert.ok(markersIn("Glucosa en ayunas 112").has("glucosa-en-ayunas"));
assert.ok(markersIn("Vitamina D 18 ng/mL").has("vitamina-d"));
assert.ok(markersIn("Vitamina K y TP/INR").has("vitamina-k"));
assert.ok(markersIn("Vitamina K y TP/INR").has("tp-inr"));
assert.equal(markersIn("INR prolongado").has("vitamina-k"), false, "INR no debe ser alias de vitamina K");
const hepaticMarkers = markersIn("pruebas-hepaticas-alt-ast-alp-y-ggt");
assert.deepEqual([...hepaticMarkers].sort(), ["alt", "ast", "fosfatasa-alcalina", "ggt"]);
assert.equal(hepaticMarkers.has("higado"), false, "higado es grupo de consulta, no marker");
// no debe confundir palabras que contienen el alias ("salt" no es "alt")
assert.equal(markersIn("resultado salt water").has("alt"), false);

// --- Conjunto de marcadores del panel sintético (los 11 de la analítica) -----
const analitica =
  "Hemoglobina 14.2 | Leucocitos 6.4 | Plaquetas 248 | Glucosa en ayunas 112 | " +
  "Creatinina 0.88 | Colesterol total 218 | HDL 62 | LDL 139 | " +
  "Trigliceridos 86 | TSH 2.10 | Vitamina D 18";
const allowed = markersIn(analitica);
assert.ok(allowed.has("colesterol-ldl") && allowed.has("glucosa-en-ayunas") && allowed.has("vitamina-d"));
assert.equal(allowed.has("higado"), false, "la analítica sintética no tiene hígado");
assert.ok(markersIn("Leberwerte kontrollieren").has("alt"), "alias aleman de perfil hepatico");
assert.ok(markersIn("Schilddrüsenwerte").has("tsh"), "alias aleman de perfil tiroideo");

// --- healthAreasIn: motivos difusos por area_de_salud -----------------------
assert.deepEqual([...healthAreasIn("estoy cansado y sin energia")], ["energia-fatiga"]);
assert.deepEqual([...healthAreasIn("ich bin müde und habe wenig Energie")], ["energia-fatiga"]);
assert.deepEqual([...healthAreasIn("estoy con mucho estres")], ["estado-animo-estres"]);
assert.equal(healthAreasIn("me cuesta dormir").size, 0, "sueno no se activa hasta que exista corpus etiquetado");

// --- keepDoc: el corazón del arreglo ----------------------------------------
// El doc hepático NO debe conservarse (el bug observado).
assert.equal(
  keepDoc("institutional-education/pruebas-hepaticas-alt-ast-alp-y-ggt-preparacion.md Pruebas hepáticas", allowed),
  false,
  "doc hepático debe filtrarse fuera de una analítica sin hígado",
);
// Los docs del marcador en juego SÍ se conservan.
assert.equal(
  keepDoc("markers/colesterol/colesterol-ldl-interpretacion-medlineplus.md Colesterol LDL", allowed),
  true,
);
assert.equal(
  keepDoc("glucosa/glucosa-plasmatica-en-ayunas-interpretacion.md Glucosa plasmática", allowed),
  true,
);
// Un doc transversal sin marcador conocido se conserva (no sobre-filtrar).
assert.equal(keepDoc("ayuno-antes-de-un-analisis-de-sangre.md Ayuno antes de un análisis", allowed), true);
assert.equal(keepDoc("interferencias-analiticas.md Interferencias analíticas", allowed), true);
// Si existe marker explícito, manda sobre el nombre/título.
assert.equal(
  keepDoc("documento-generico.md Título general", allowed, ["higado"]),
  false,
  "un pseudo-marker explícito fuera del vocabulario no debe abrir el filtro",
);
assert.equal(
  keepDoc("pruebas-hepaticas.md Pruebas hepáticas", allowed, ["general"]),
  true,
  "marker general se conserva aunque el título contenga otro marcador",
);
assert.equal(
  keepDoc("vitamina-k/vitamina-k-tp-inr.md Vitamina K y TP/INR", markersIn("INR prolongado"), [
    "vitamina-k",
    "tp-inr",
  ]),
  true,
  "una tarjeta multi-marcador se conserva si coincide cualquiera de sus markers",
);

// --- filterByMarkers: integración sobre una lista ---------------------------
const docs = [
  { path: "markers/colesterol/colesterol-ldl-interpretacion.md", title: "Colesterol LDL" },
  { path: "institutional-education/pruebas-hepaticas-alt-ast.md", title: "Pruebas hepáticas" },
  { path: "glucosa/glucosa-en-ayunas-interpretacion.md", title: "Glucosa en ayunas" },
];
const kept = filterByMarkers(docs, allowed).map((d) => d.title);
assert.deepEqual(kept, ["Colesterol LDL", "Glucosa en ayunas"], "el hepático queda fuera");

// Conservador: sin marcadores permitidos, no filtra.
assert.equal(filterByMarkers(docs, new Set()).length, 3);

// --- isFiller: mensajes sin tema (ES/DE) ------------------------------------
assert.ok(isFiller("ok"));
assert.ok(isFiller("vale, gracias"));
assert.ok(isFiller("¿y eso?"));
assert.ok(isFiller("continúa"));
assert.ok(isFiller("ja, danke"));
assert.ok(isFiller(""), "mensaje vacío es relleno");
assert.equal(isFiller("¿y mi LDL?"), false, "si menciona marcador no es relleno");
assert.equal(isFiller("¿por qué estoy cansado?"), false, "frase con contenido no es relleno");

// --- deriveScope: filtro fuerte (markers) + lente (lens) --------------------
const scopeOf = (msg: string, prior: string[] = []) => {
  const s = deriveScope(msg, prior);
  return {
    markers: [...s.markers].sort(),
    lens: [...s.lens].sort(),
    healthAreas: [...s.healthAreas].sort(),
  };
};
// El mensaje actual manda; sin lente.
assert.deepEqual(scopeOf("¿qué significa mi LDL?"), {
  markers: ["colesterol-ldl"],
  lens: [],
  healthAreas: [],
});
// Cambio de tema: el mensaje actual pisa el historial.
assert.deepEqual(
  scopeOf("¿y mi vitamina D?", ["¿qué significa mi LDL?"]),
  { markers: ["vitamina-d"], lens: [], healthAreas: [] },
  "cambio de tema = respuesta inmediata",
);
// Seguimiento sin marcador: hereda el tema previo.
assert.deepEqual(
  scopeOf("¿y qué opinas de eso?", ["¿qué significa mi LDL?"]),
  { markers: ["colesterol-ldl"], lens: [], healthAreas: [] },
  "seguimiento hereda el tema previo",
);
// Lente de tradición: el tema clínico sigue siendo filtro FUERTE; el lente
// solo es preferencia (no se suma al filtro: así no se cuela Ayurveda genérico).
assert.deepEqual(
  scopeOf("¿y desde el Ayurveda?", ["¿qué significa mi LDL?"]),
  { markers: ["colesterol-ldl"], lens: ["ayurveda"], healthAreas: [] },
  "el lente no abre el filtro: es preferencia sobre el tema",
);
// Marcador-lente sin tema previo: el lente pasa a ser el tema (filtro fuerte).
assert.deepEqual(scopeOf("¿qué dice el Ayurveda?"), { markers: ["ayurveda"], lens: [], healthAreas: [] });
// MTC también es lente: "según la medicina china" no abre el filtro.
assert.deepEqual(
  scopeOf("¿y según la medicina china?", ["¿qué significa mi HDL?"]),
  { markers: ["colesterol-hdl"], lens: ["mtc"], healthAreas: [] },
  "medicina china = lente sobre el tema clínico previo",
);
assert.ok(markersIn("traditionelle chinesische Medizin").has("mtc"), "alias alemán de MTC");
// Motivo de consulta explícito: no hereda un marcador antiguo; abre area_de_salud.
assert.deepEqual(
  scopeOf("estoy cansado", ["¿qué significa mi LDL?"]),
  { markers: [], lens: [], healthAreas: ["energia-fatiga"] },
  "motivo actual difuso no queda atrapado por el marker previo",
);
// Motivo + lente: el area sigue siendo el puente y el lente solo reordena.
assert.deepEqual(
  scopeOf("estoy cansado, ¿y desde la medicina china?"),
  { markers: [], lens: ["mtc"], healthAreas: ["energia-fatiga"] },
);
// Seguimiento sin marker hereda el motivo difuso si no hay marker en la ventana.
assert.deepEqual(scopeOf("¿qué pruebas miraría?", ["estoy cansado"]), {
  markers: [],
  lens: [],
  healthAreas: ["energia-fatiga"],
});
// Relleno intercalado no consume el tema previo.
assert.deepEqual(
  scopeOf("¿eso es preocupante?", ["¿mi glucosa?", "vale"]),
  { markers: ["glucosa-en-ayunas"], lens: [], healthAreas: [] },
  "el relleno no rompe la continuidad",
);
// Sin tema en mensaje ni ventana: no hay scope (no filtrar).
assert.equal(deriveScope("¿qué ves en mi analítica?", ["hola"]).markers.size, 0);
// Ventana corta: un tema fuera de los 2 mensajes no-relleno no se hereda.
assert.equal(
  deriveScope("¿y eso?", ["¿mi LDL?", "explícame más", "cuéntame otra cosa"]).markers.has(
    "colesterol-ldl",
  ),
  false,
  "fuera de la ventana de 2 mensajes no-relleno no se hereda",
);
// Pero dentro de la ventana sí (LDL es el 2º mensaje no-relleno hacia atrás).
assert.deepEqual(scopeOf("¿y eso?", ["¿mi LDL?", "explícame más"]), {
  markers: ["colesterol-ldl"],
  lens: [],
  healthAreas: [],
});
// Red de seguridad: demasiados marcadores = scope amplio = no filtrar.
assert.equal(
  deriveScope("hemograma completo, perfil hepático, renal y tiroideo").markers.size,
  0,
  "scope amplio se trata como no-filtrar",
);

// --- applyLensPreference: reordena sin descartar ----------------------------
const lensDocs = [
  { title: "LDL biomédico", seccion: "interpretacion" },
  { title: "LDL desde Ayurveda", seccion: "tradicion", tradicion: "ayurveda" },
  { title: "LDL alimentación", seccion: "alimentacion-factores" },
];
assert.deepEqual(
  applyLensPreference(lensDocs, new Set(["ayurveda"])).map((d) => d.title),
  ["LDL desde Ayurveda", "LDL biomédico", "LDL alimentación"],
  "la tarjeta de la tradición pedida sube, sin descartar el resto",
);
// Sin lente, el orden no cambia.
assert.deepEqual(
  applyLensPreference(lensDocs, new Set()).map((d) => d.title),
  ["LDL biomédico", "LDL desde Ayurveda", "LDL alimentación"],
);

// --- area_de_salud: expande y reordena sin filtrar duro ----------------------
const expandedEnergyQuery = expandQueryForHealthAreas("estoy cansado", new Set(["energia-fatiga"]));
assert.match(expandedEnergyQuery, /ferritina/);
assert.match(expandedEnergyQuery, /vitamina b12/);
assert.match(expandedEnergyQuery, /tsh/);

const areaDocs = [
  { title: "LDL biomédico", areaDeSalud: ["salud-cardiovascular"] },
  { title: "Ferritina y cansancio", areaDeSalud: ["energia-fatiga"] },
  { title: "TSH y energía", areaDeSalud: ["energia-fatiga", "salud-tiroidea"] },
];
assert.deepEqual(
  applyHealthAreaPreference(areaDocs, new Set(["energia-fatiga"])).map((d) => d.title),
  ["Ferritina y cansancio", "TSH y energía", "LDL biomédico"],
  "area_de_salud sube el motivo de consulta sin descartar el resto",
);

console.log("test-marker-scope: OK (todas las aserciones pasaron)");
