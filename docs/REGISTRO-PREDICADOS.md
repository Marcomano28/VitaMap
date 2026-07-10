# Registro de predicados y contrato de aristas · VitaMap

Versión 0.2 · 2026-07-10
Estado: borrador de arquitectura para revisión
Implementación: ninguna; este documento define el contrato objetivo.
Implementa R6 de [PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md](PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md) (§2.7).

## 0. Propósito

Define la **gramática canónica** del grafo de conocimiento de VitaMap: qué tipos de
nodo existen, qué relaciones los unen, qué significa cada una, su dirección, la
procedencia que exige, cuándo puede expandirse en retrieval, cómo se explica al
usuario, y qué validaciones impiden equivalencias/causalidades/conexiones no
sustentadas.

Es la **única fuente de verdad** para: el registro de predicados, la validación de
aristas, las reglas de expansión, la traducción de relaciones a lenguaje humano,
las restricciones de figura–fondo y la visualización del GPS.

No sustituye: la taxonomía de conceptos, el registro bibliográfico, las rutas
editoriales del RAG, las instrucciones de generación ni el banco de evaluación. Se
conecta con ellos mediante identificadores estables.

## 1. Principios del modelo

**1.1 Un concepto no es un marker.** Cada nodo tiene un `concept_id` canónico
(`ayurveda.shukra-dhatu`) y, aparte, `retrieval_markers`. En la migración inicial
puede haber relación 1:1, pero no es permanente. *Un nodo representa una entidad
conceptual; un marker representa una vía de recuperación.*

**1.2 Una arista no significa solo "está relacionado con".** Toda conexión indica:
qué une, cómo, en qué capa, qué fuente la sostiene, qué uso permite y qué no
autoriza a concluir. No existe un predicado de producción genérico `relacionado_con`
(puede quedar como contenedor de compatibilidad, pero toda relación nueva usa un
predicado canónico).

**1.3 La proximidad no transfiere evidencia.** Dos nodos cercanos no heredan
identidad, causalidad, capacidad diagnóstica, validez clínica, nivel de evidencia
ni significado fisiológico. Se aplica especialmente a las tangencias.

**1.4 Las capas no comparten una única escala de evidencia.** Una relación clínica
(guías, revisiones, estudios, referencias institucionales) y una tradicional (texto
primario, comentario, tradición, filología) ambas requieren procedencia, pero no se
puntúan en una sola escala.

**1.5 El grafo técnico no es la pantalla del usuario.** El grafo puede tener miles
de conexiones; el GPS muestra solo el punto de partida, las relaciones útiles a la
pregunta, el motivo de que aparezcan, sus límites y su procedencia.

## 2. Modelo base

### 2.1 Nodo

```json
{
  "concept_id": "clinical.ferritina",
  "type": "biomarker",
  "label": { "es": "Ferritina", "en": "Ferritin", "de": "Ferritin" },
  "domain": "clinical",
  "retrieval_markers": ["ferritina"],
  "status": "active"
}
```

Obligatorios: `concept_id`, `type`, `label`, `domain`, `status`.
Opcionales: `retrieval_markers`, `aliases`, `parent_concepts`, `description`,
`provenance_refs`, `legacy_ids`.

### 2.2 Arista

```json
{
  "edge_id": "edge-crp-ferritin-001",
  "source": "clinical.proteina-c-reactiva",
  "predicate": "modifica_interpretacion_de",
  "target": "clinical.ferritina",
  "layer": "clinical-internal",
  "status": "reviewed",
  "provenance_refs": ["source-clinical-001"],
  "support_kind": "institutional-reference"
}
```

Obligatorios: `edge_id`, `source`, `predicate`, `target`, `layer`, `status`,
`provenance_refs`, `support_kind`.
Condicionales: `context` (relación depende de condiciones); `scope` (población,
dosis, muestra o marco limitado); `supports` (tangencias/exploratorias);
`does_not_support` (**toda** tangencia); `reviewed_by`/`reviewed_at` (estado
`reviewed`); `valid_from`; `superseded_by`.

> `provenance_refs`, no `evidence_refs`: no todas las capas comparten el mismo
> régimen de evidencia (§1.4).

## 3. Capas del grafo

- **`taxonomic`** — clasificación, pertenencia, composición estructural
  (`shukra-dhatu → es_un_tipo_de → dhatu`; `colesterol-ldl → es_componente_de →
  perfil-lipidico`). No implica causalidad ni cointerpretación.
- **`clinical-internal`** — plano clínico/analítico/nutricional/biomédico
  (`testosterona-total ↔ se_lee_junto_a ↔ SHBG`; `proteina-c-reactiva →
  modifica_interpretacion_de → ferritina`).
- **`traditional-internal`** — conceptos internos de una tradición en su propio
  lenguaje (`rasa-dhatu → se_transforma_en → rakta-dhatu`). No pasan por un
  concepto biomédico.
- **`safety`** — interacción, precaución, contraindicación, monitorización. No se
  mezcla con interpretación analítica.
- **`tangency`** — punto de contacto limitado entre marcos. No es equivalencia; no
  transfiere evidencia/causalidad/capacidad diagnóstica; no se expande por defecto.

**3.6 Lo que NO pertenece al grafo epistemológico.** Las rutas de consulta
(`fatiga → recuperar también → ferritina`; `embarazo → usar como semillas →
folato, yodo`) son **rutas de retrieval**, no relaciones científicas. Se almacenan
en `retrieval-routes`, nunca como aristas de conocimiento.

## 4. Jerarquía de tipos

```
concept
├── clinical-concept
│   ├── biomarker · derived-value · laboratory-panel · preanalytical-factor
│   ├── nutrient · food · species · product · compound · medication
│   └── physiological-process · clinical-condition · anatomical-entity · phenotype
├── traditional-concept
│   └── ayurveda-concept · dhatu · srotas · dosha · constitution
├── organizational-concept
│   └── tradition · query-group · health-area
└── methodological-concept
    └── measurement · preanalytical-condition
```

Herencia: un predicado que acepta `traditional-concept` acepta sus subtipos, salvo
exclusión explícita.

## 5. Registro canónico de predicados

### 5.1 Capa `taxonomic`

| Predicado | dir | inversa | domain → range | exp |
|---|---|---|---|---|
| `es_un_tipo_de` | → | `agrupa_tipos_de` | concept → concept | sí |
| `es_componente_de` | → | `contiene_componente` | concept → panel/group | sí |
| `pertenece_a_tradicion` | → | `contiene_concepto` | traditional-concept → tradition | no |

- `es_un_tipo_de`: el origen es especialización/clase/miembro del destino
  (`shukra-dhatu → dhatu`). No usar para composición química, pertenencia a panel ni
  parte anatómica–todo.
- `es_componente_de`: el origen forma parte de una colección/perfil/panel
  (`colesterol-ldl → perfil-lipidico`). No implica que se interpreten siempre juntos.

### 5.2 Capa `clinical-internal`

| Predicado | dir | inversa | exp |
|---|---|---|---|
| `se_lee_junto_a` | ↔ | (sí misma) | sí |
| `modifica_interpretacion_de` | → | `interpretacion_modificada_por` | sí |
| `se_deriva_de` | → | `entra_en_calculo_de` | sí |
| `contiene` | → | `presente_en` | no |
| `es_marcador_quimico_de` | → | `tiene_marcador_quimico` | no |
| `es_precursor_de` | → | `se_forma_a_partir_de` | no |
| `afecta_absorcion_de` | → | `absorcion_afectada_por` | no |
| `puede_modificar` | → | `puede_ser_modificado_por` | no |
| `se_asocia_con` | ↔ | (sí misma) | no |
| `mismo_origen_que` | ↔ | (sí misma) | no |

- `se_lee_junto_a`: aportan contexto interpretativo mutuo (`testosterona-total ↔
  SHBG`). Requiere procedencia y utilidad clínica; **no** usar solo porque compartan
  panel. Etiqueta usuario: *"Se interpreta junto con"*.
- `modifica_interpretacion_de`: el origen cambia/condiciona la interpretación del
  destino. **Regla: `source` siempre es el que modifica** (`proteina-c-reactiva →
  ferritina`). NO escribir `ferritina → modifica_interpretacion_de →
  proteina-c-reactiva` cuando la intención es que la inflamación altera la lectura de
  ferritina. Etiqueta: *"Puede cambiar cómo se interpreta"*.
- `se_deriva_de`: el valor de origen se calcula usando el destino (`egfr →
  creatinina`); puede tener múltiples insumos.
- `contiene`: especie/alimento/producto contiene un compuesto/nutriente (`alcachofa
  → cinarina`). No implica eficacia, biodisponibilidad, dosis ni relevancia clínica.
- `es_marcador_quimico_de`: compuesto usado como marcador de identidad/estandarización
  (`cinarina → alcachofa`). No equivale a `presente_en`.
- `es_precursor_de`: precursor en una formación/conversión (`ala → epa`); incluir
  contexto metabólico cuando la conversión sea limitada/variable.
- `afecta_absorcion_de`: aumenta/reduce absorción (`vitamina-c → hierro`); requiere
  `effect_direction: increase|decrease`.
- `puede_modificar`: evidencia de que una exposición/intervención puede modificar un
  desenlace medible; **requiere siempre** `scope` (population/intervention/dose/
  duration). No presentar como efecto universal.
- `se_asocia_con`: asociación observada sin causalidad. No expande. Etiqueta: *"Se ha
  estudiado en relación con"*.

### 5.3 Capa `traditional-internal`

| Predicado | dir | inversa | exp |
|---|---|---|---|
| `se_transforma_en` | → | `se_forma_de` | sí |
| `se_relaciona_con_srotas` | → | `srotas_relacionado_con` | sí |
| `nutre` | → | `nutrido_por` | sí |
| `deriva_de` | → | `da_origen_a` | sí |
| `se_expresa_por` | → | `expresa_a` | sí |

Las relaciones jerárquicas usan `es_un_tipo_de` en la capa `taxonomic`.

- `se_transforma_en`: en el marco y la fuente citada, el origen participa en una
  secuencia de transformación (`rasa-dhatu → rakta-dhatu`). No es conversión
  bioquímica automática.
- `se_relaciona_con_srotas`: relación doctrinal dhatu↔srotas (`shukra-dhatu →
  shukravaha-srotas`); puede llevar `relation_mode: circulation` cuando la fuente lo
  sostenga. **Forma canónica preferida frente a `circula_por`** (ver §13.4).
- `nutre`: relación de nutrición/sostén (`shukra-dhatu → ojas`); conserva contexto
  doctrinal, no es mecanismo fisiológico moderno.
- `deriva_de`: en una secuencia tradicional, el origen deriva del destino
  (`shukra-dhatu → majja-dhatu`).
- `se_expresa_por`: una constitución se describe por predominio de doshas
  (`prakriti → pitta`). No convierte el dosha en biomarcador.

### 5.4 Capa `safety`

| Predicado | dir | inversa | exp |
|---|---|---|---|
| `interactua_con` | ↔ | (sí misma) | no |
| `requiere_precaucion_con` | → | `requiere_precaucion_por` | no |
| `contraindicado_en` | → | `contraindica` | no |
| `requiere_monitorizacion_de` | → | `monitorizado_por` | no |

- `interactua_con` (`suplemento ↔ medicamento`): requiere tipo de interacción,
  posible consecuencia, fuente y estado de revisión.
- `requiere_precaucion_con` (`producto-natural → enfermedad-renal`): no implica
  contraindicación absoluta.
- `contraindicado_en`: solo con fuente autorizada que la sostenga; no se infiere de
  una precaución.

### 5.5 Capa `tangency`

Predicado único: **`tiene_tangencia_con`** · dirección **simétrica** · expansión
**false** · tipos `traditional-concept ↔ clinical-concept`.

Campo obligatorio `tangency_kind` ∈ { `empirical`, `shared-question-territory`,
`semantic`, `historical-translation` }. `does_not_support` **obligatorio**.

```json
{
  "edge_id": "edge-prakriti-phenotype-001",
  "source": "ayurveda.prakriti", "predicate": "tiene_tangencia_con",
  "target": "clinical.phenotype-profile", "layer": "tangency",
  "tangency_kind": "empirical",
  "equivalent": false, "transfers_evidence": false,
  "transfers_causality": false, "transfers_diagnostic_meaning": false,
  "supports": ["estructura fenotípica reproducible en la población estudiada"],
  "does_not_support": [
    "equivalencia entre prakriti y fenotipo",
    "reducción de prakriti a genética",
    "uso diagnóstico individual"
  ],
  "provenance_refs": ["tiwari-2017"], "status": "reviewed"
}
```

Otros ejemplos: `shukra-dhatu ↔ oligozoospermia` (`shared-question-territory`,
`does_not_support`: "shukra es semen", "shukra-kshaya es oligozoospermia");
`rakta-dhatu ↔ blood` (`semantic`, `does_not_support`: "rakta-dhatu es idéntico a
sangre", "un hemograma mide rakta-dhatu").

**Prohibición permanente:** no existe el predicado `equivale_a` entre un concepto
tradicional y uno biomédico.

## 6. Procedencia y respaldo

`support_kind`: `clinical-guideline`, `systematic-review`, `meta-analysis`,
`primary-clinical-study`, `observational-study`, `laboratory-reference`,
`institutional-reference`, `traditional-primary-source`, `traditional-commentary`,
`historical-scholarship`, `philological-research`, `editorial-rule`,
`retrieval-heuristic`.

Regla: `retrieval-heuristic` nunca respalda una afirmación clínica o tradicional.

## 7. Estado y ciclo de vida

Valores: `draft`, `review-pending`, `reviewed`, `disputed`, `deprecated`,
`rejected`. Una arista solo participa en expansión automática con `status =
reviewed` (salvo entornos de prueba). Campos: `reviewed_by`, `reviewed_at`,
`valid_from`, `deprecated_at`, `superseded_by`.

## 8. Reglas de almacenamiento

- **Inversas**: se guarda solo la arista canónica; la inversa se genera en lectura.
- **Simétricas**: una sola arista, IDs ordenados de forma determinista; no se
  permiten `A↔B` y `B↔A`.
- **Clave de deduplicación**: `source + predicate + target + layer + scope`. Con
  `scope` realmente distinto, pueden coexistir.
- **Self-loops**: prohibidos por defecto; excepción solo con `allow_self_loop:
  true` + `justification`.

## 9. Política de retrieval

Cada predicado define un bloque `retrieval`: `expand`, `allowed_intents`,
`max_hops`, `max_neighbors`, `traverse`, `requires_status`, `explain_path`.

**9.1 Reglas generales:** máximo inicial 1 salto, 4 vecinos; toda expansión
registra por qué ocurrió; una arista sin procedencia, no revisada, no se expande;
las tangencias nunca se expanden por defecto.

**9.2 Tangencia:** `expand: false`, `allowed_intents: [comparison,
cross-framework-question]`. Puede usarse cuando el usuario pide comparación,
menciona conceptos de ambos planos, abre explícitamente la perspectiva comparativa,
o existe un puente editorial aprobado.

## 10. Lenguaje para el GPS

Cada predicado incluye `user_facing` con `label`/`inverse_label`/`template` i18n
(es/en/de). Ej.: `modifica_interpretacion_de` → *"{source} puede cambiar cómo se
interpreta {target}."*; `tiene_tangencia_con` → *"{source} y {target} comparten un
territorio de comparación, pero no significan lo mismo."* El GPS nunca muestra solo
el nombre del predicado; siempre una frase comprensible.

## 11. Validaciones obligatorias

El validador rechaza: predicado inexistente; capa no permitida; nodo origen/destino
inexistente; incompatibilidad de tipos; arista sin `edge_id`; arista sin
procedencia; fuente inexistente; dirección incompatible; duplicado simétrico;
inversa almacenada como duplicado; self-loop no autorizado; predicado deprecado;
relación sin estado; relación clínica `draft` usada en retrieval; tangencia no
revisada; tangencia sin `does_not_support`; tangencia con `equivalent: true`;
tangencia con transferencia de evidencia; tangencia con expansión por defecto;
relación de seguridad convertida en interpretación clínica; relación taxonómica
usada como causalidad; ruta editorial almacenada como relación científica.

## 12. Migración de predicados existentes

| Heredada | Destino |
|---|---|
| `lectura_conjunta` | `se_lee_junto_a` |
| `mismo_panel` | `es_componente_de` (cuando exista nodo panel) |
| `misma_familia_analitica` | revisar: `se_lee_junto_a` o `mismo_origen_que` |
| `comparacion_contextual` | revisar: `se_asocia_con` o ruta editorial |
| `modifica_interpretacion` | `modifica_interpretacion_de`, **revisando dirección** |
| `modifica_interpretacion_contextual` | `modifica_interpretacion_de` o `puede_modificar` |
| `seguridad_contextual` | predicado de capa `safety` |
| `calculo_derivado` / `se_calcula_con` | `se_deriva_de` |
| `componente_directo` | `es_componente_de` o `contiene`, según caso |
| `contiene_compuesto` / `aporta_nutriente` | `contiene` |
| `familia_fitoquimica` | revisar; no convertir automáticamente |
| `perfil_acidos_grasos` | `es_componente_de` |
| `marcador_quimico_de` | `es_marcador_quimico_de` |
| `misma_especie_distinto_producto` / `mismo_origen_suprarrenal` | `mismo_origen_que` |
| `afecta_absorcion` | `afecta_absorcion_de` |
| `factor_dietetico` | `puede_modificar` o `se_asocia_con` |
| `precursor_dietetico` | `es_precursor_de` |
| `remodelado_oseo` | revisar caso por caso |

Regla: ninguna migración semánticamente ambigua se ejecuta de forma automática.

## 13. Decisiones adoptadas

- **13.1 `precursor_dietetico`** → `es_precursor_de` (no se reduce a `afecta_a`).
- **13.2 `marcador_quimico_de`** → predicado propio; no equivale a `contiene`.
- **13.3 `componente_directo`** → se divide: `es_componente_de` (paneles/colecciones)
  vs `contiene` (composición física/química).
- **13.4 `circula_por`** → no se adopta como predicado general; se usa
  `se_relaciona_con_srotas` con `relation_mode: circulation` cuando la fuente lo
  sostenga.
- **13.5 Tangencia** → permanece simétrica; los tipos de nodo identifican cada
  plano; no se modela como flecha de Ayurveda hacia biomedicina ni al contrario.

## 14. Criterio de aceptación

Listo para implementación cuando: todos los predicados tienen definición, dirección
e inversa, `domain`/`range`, política de retrieval y etiqueta de usuario; la
procedencia es obligatoria; las tangencias fallan de forma cerrada; existen pruebas
automáticas; la migración heredada tiene revisión caso por caso; y el banco de
evaluación captura un baseline previo.

## 15. Regla final

El grafo debe permitir conectar conocimiento sin borrar sus diferencias. Una arista
clínica explica cómo interpretar; una tradicional conserva continuidad interna; una
taxonómica organiza; una de seguridad protege; una tangencia permite comparar sin
declarar equivalencia. Y una ruta de retrieval ayuda a encontrar, pero no se
disfraza de conocimiento.
