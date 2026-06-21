# Auditoría de cobertura · función hepática

## Mini-auditoría del lote

Grupo: función hepática / perfil hepático  
Estado en taxonomía: no se pudo verificar `corpus-preparation/corpus-taxonomy.json` en los archivos disponibles.  
Tarjetas existentes revisadas: se revisó el brief de producción de tarjetas y documentación de `marker`, pero no una taxonomía canónica completa.  
Hueco que se propone cubrir: marcadores no enzimáticos del panel hepático: bilirrubina, albúmina, proteínas totales/A:G y tiempo de protrombina/INR como marcador relacionado de síntesis/coagulación.  
Motivo de recuperación: consultas como “¿mi panel hepático solo mira daño?”, “¿qué falta si solo tengo ALT, AST, FA y GGT?”, “¿qué mide la bilirrubina?”, “¿qué aporta la albúmina?”, “¿qué dicen las proteínas totales?”, “¿por qué PT/INR puede aparecer en función hepática?”.  
Facets base propuestas:  
- marker: `bilirrubina`, `albumina`, `proteinas-totales`, `tp-inr`, `alt`, `ast`, `fosfatasa-alcalina`, `ggt`
- categoria: `perfil-hepatico`, con `coagulacion` para `tp-inr`
- sistema: `hepatobiliar`, `digestivo`, y `hematologico` cuando corresponda
- area_de_salud: `salud-hepatica`
- seccion: `interpretacion`, `lectura-conjunta`, `seguimiento`, `curiosidad`
Relaciones necesarias: lectura conjunta entre enzimas hepáticas, bilirrubina, proteínas, albúmina y PT/INR.  
Fuente candidata principal: MedlinePlus Medical Tests, National Library of Medicine.  
Decisión: redactar como borrador descargable con `facets_version: 1`, dejando pendiente la validación exacta contra `corpus-taxonomy.json`.

## Propuesta de entrada para `corpus-taxonomy.json`

```json
{
  "perfil-hepatico": {
    "dominio": "laboratorio",
    "tipo": ["panel"],
    "marker": [
      "alt",
      "ast",
      "fosfatasa-alcalina",
      "ggt",
      "bilirrubina",
      "albumina",
      "proteinas-totales",
      "tp-inr"
    ],
    "categoria": ["perfil-hepatico"],
    "muestra": ["suero", "plasma"],
    "sistema": ["hepatobiliar", "digestivo", "hematologico"],
    "area_de_salud": ["salud-hepatica"],
    "alias": [
      "funcion hepatica",
      "perfil hepatico",
      "liver panel",
      "leberwerte",
      "leberfunktion"
    ],
    "relacionado_con": [
      { "id": "alt", "relacion": "mismo_panel" },
      { "id": "ast", "relacion": "mismo_panel" },
      { "id": "fosfatasa-alcalina", "relacion": "mismo_panel" },
      { "id": "ggt", "relacion": "mismo_panel" },
      { "id": "bilirrubina", "relacion": "lectura_conjunta" },
      { "id": "albumina", "relacion": "lectura_conjunta" },
      { "id": "proteinas-totales", "relacion": "lectura_conjunta" },
      { "id": "tp-inr", "relacion": "modifica_interpretacion" }
    ]
  },
  "bilirrubina": {
    "dominio": "laboratorio",
    "tipo": ["analito"],
    "marker": ["bilirrubina"],
    "categoria": ["perfil-hepatico"],
    "muestra": ["suero", "plasma", "orina"],
    "sistema": ["hepatobiliar", "hematologico"],
    "area_de_salud": ["salud-hepatica"],
    "alias": ["bilirubin", "total bilirubin", "bilirrubina total", "direct bilirubin", "bilirrubina directa", "indirect bilirubin", "bilirrubina indirecta"]
  },
  "albumina": {
    "dominio": "laboratorio",
    "tipo": ["analito"],
    "marker": ["albumina"],
    "categoria": ["perfil-hepatico"],
    "muestra": ["suero", "plasma", "orina"],
    "sistema": ["hepatobiliar", "renal", "nutricional"],
    "area_de_salud": ["salud-hepatica", "salud-renal", "nutricion"],
    "alias": ["albumin", "serum albumin", "albúmina sérica", "alb"]
  },
  "proteinas-totales": {
    "dominio": "laboratorio",
    "tipo": ["analito"],
    "marker": ["proteinas-totales"],
    "categoria": ["perfil-hepatico"],
    "muestra": ["suero", "plasma"],
    "sistema": ["hepatobiliar", "inmunologico", "nutricional"],
    "area_de_salud": ["salud-hepatica", "nutricion", "inmunidad"],
    "alias": ["total protein", "proteina total", "proteínas totales", "a/g ratio", "relación albúmina globulina"]
  },
  "tp-inr": {
    "dominio": "laboratorio",
    "tipo": ["analito"],
    "marker": ["tp-inr"],
    "categoria": ["coagulacion", "perfil-hepatico"],
    "muestra": ["plasma", "sangre-total"],
    "sistema": ["hematologico", "hepatobiliar"],
    "area_de_salud": ["coagulacion", "salud-hepatica"],
    "alias": ["pt", "inr", "tiempo de protrombina", "prothrombin time", "international normalized ratio"]
  }
}
```

## Huecos explícitos no cubiertos

- No se incluyen rangos numéricos porque las fuentes principales remiten al intervalo de referencia del laboratorio.
- No se crean tarjetas de alimentación/factores para bilirrubina, albúmina o proteínas totales: las fuentes revisadas no sostienen una intención B suficientemente distinta sin riesgo de convertirlo en consejo dietético.
- La validación final de valores facetados (`categoria`, `sistema`, `area_de_salud`) debe hacerse contra la taxonomía real del proyecto.
