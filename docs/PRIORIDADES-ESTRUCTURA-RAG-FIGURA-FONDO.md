# Prioridades · estructura del RAG con figura-fondo

Versión 0.1 · 2026-07-10
Estado: plan de trabajo priorizado (spec, nada implementado por escribirlo)

## 0. Qué resuelve este documento

Lista **qué revisar e implementar** para que el RAG deje de tratar las tradiciones
(Ayurveda primero) como una **bolsa de palabras** y las trate como una **red
conceptual**, realizando la relación figura-fondo también en el retrieval.

No repite el fundamento —vive en [CONTORNOS-AYURVEDA-Y-ANALITICA.md](CONTORNOS-AYURVEDA-Y-ANALITICA.md)
y [DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md](DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md)—;
es la capa **accionable y ordenada por prioridad**. Toda mejora estructural queda
**condicionada a medición** (banco de eval antes de encender consumo).

## 1. El problema, en una línea

Hoy `agni`, `dosha`, `shukra`, `vata`… son **alias planos** de un único marcador
`ayurveda`. El sistema reconoce "esto es Ayurveda" pero **no sabe** que shukra es
un dhatu, ni que rasa se transforma en rakta. Falta estructura: nodos y aristas.

## 2. Modelo objetivo

### 2.1 Nodos: identidad conceptual, proyectada sobre markers

Cada nodo tiene un **identificador conceptual canónico** (p. ej. `shukra-dhatu`),
propio del grafo de conocimiento e **independiente del sistema de recuperación**.
En la **primera migración**, los nodos se **proyectan 1:1 sobre markers** por
compatibilidad con la maquinaria actual (retrieval, `relacionado_con`, validador).

Así se obtiene la red ya, sin reescribir la arquitectura, y **sin cementar
"marker = nodo" como el modelo definitivo**: más adelante un nodo podrá no tener
marker (concepto demasiado fino o sin tarjetas) o un marker agrupar varios nodos,
sin migración traumática. La identidad vive en el grafo; el marker es una
proyección, no la identidad.

Conjunto mínimo de nodos propuesto (~16), con su marker 1:1 en migración 1:

```
ayurveda            (paraguas / grupo de consulta, no nodo-hoja)
├── prakriti
├── dosha ── vata · pitta · kapha
├── dhatu ── rasa-dhatu · rakta-dhatu · shukra-dhatu
├── srotas ── rasavaha-srotas · raktavaha-srotas · shukravaha-srotas
├── agni
├── ojas
└── rasayana
```

Nota de migración: `rasa`, `rakta`, `dhatu`, `srotas`, `ojas`, `prakriti` ya
existen como **alias** de `ayurveda`; promoverlos es moverlos de alias a marker y
reasignar sus alias específicos.

### 2.2 Aristas = registros con procedencia

Toda relación es un registro con **capa explícita** y **procedencia**: CONTORNOS
§3.2 exige que el cuerpo se declare mediante relaciones **sostenidas por fuentes**.
Una arista sin `evidence_refs` es decorativa. `layer` no es adorno: **gobierna
cómo puede usarse la arista** (§4).

| Campo | Uso | Requerido |
|---|---|---|
| `id` | Identificador estable de la arista (referenciar, auditar, versionar) | sí |
| `source` / `target` | Ids de nodo (proyección 1:1 a markers en migración 1, §2.1) | sí |
| `predicate` | Verbo del vocabulario cerrado (§2.3) | sí |
| `layer` | `traditional-internal` · `clinical-internal` · `tangency` | sí |
| `direction` | `directed` \| `symmetric` (= `direccion` actual) | sí |
| `provenance_refs` | Ids de las fuentes que la sostienen (+ `support_kind`); no `evidence_refs`, porque las capas no comparten escala de evidencia | sí |
| `scope` | `{ tradition, textual_context }`: marco/pasaje donde aplica | recomendado |
| `status` | `draft` \| `reviewed` \| `reviewed_pro` (= pegatina `revisado_pro`). Implementa la **precondición** de §2.6 | sí |
| `supports` | Qué afirma la evidencia (positivo) | tangency: sí |
| `does_not_support` | **Qué NO autoriza** — la línea cortante, en datos | **tangency: obligatorio** |

Ejemplo interno (`traditional-internal`):
```json
{
  "id": "edge-shukra-shukravaha-001",
  "source": "shukra-dhatu", "predicate": "se_relaciona_con_srotas",
  "target": "shukravaha-srotas", "layer": "traditional-internal",
  "direction": "directed",
  "evidence_refs": ["source-ayurveda-001"],
  "scope": { "tradition": "ayurveda", "textual_context": "..." },
  "status": "reviewed"
}
```

Ejemplo tangencia (`does_not_support` obligatorio):
```json
{
  "id": "edge-prakriti-fenotipo-001",
  "source": "prakriti", "predicate": "tiene_tangencia_empirica_con",
  "target": "perfil-fenotipico", "layer": "tangency", "direction": "symmetric",
  "evidence_refs": ["tiwari-2017"], "status": "reviewed_pro",
  "supports": ["estructura fenotípica reproducible en la población estudiada"],
  "does_not_support": [
    "equivalencia entre prakriti y fenotipo",
    "reducción de prakriti a genética",
    "uso diagnóstico individual"
  ]
}
```

**`does_not_support` es el campo clave para VitaMap**: es la "≠ equivalencia" en
datos, no en prosa. Un mismo campo alimenta la **regla de generación** (I8.3, el
modelo respeta esas negaciones), la **prueba de no-equivalencia** (I8.4, cada ítem
es un `must_not`) y el **GPS** ("límite de lectura" de la arista). Unifica con las
secciones "Lo que no permite concluir" y el frontmatter `limitations` de las
tarjetas. `status` cierra con §2.6: una tangencia solo activa si está revisada.

**Nota de decisión (R2):** ~10 campos por arista hacen pesado el guardado *inline*
en `relacionado_con`; puede justificar revisitar R2 hacia **registros de arista
explícitos** (Opción B, con `id`). Y `evidence_refs` exige un **registro de
fuentes** (id → cita/DOI/URL): decidir si esos ids son `tarjeta_id` o una tabla
aparte.

### 2.3 Vocabulario de `layer` y `predicate` (fijado para migración 1, ampliable)

`layer` es un conjunto **cerrado** (5 valores, v0.2). `predicate` es un conjunto
cerrado por capa; ampliarlo requiere revisión. El detalle canónico vive en
[REGISTRO-PREDICADOS.md](REGISTRO-PREDICADOS.md).

| `layer` | Qué une | Ejemplos de `predicate` |
|---|---|---|
| `taxonomic` | Clasificación, pertenencia, composición | `es_un_tipo_de`, `es_componente_de`, `pertenece_a_tradicion` |
| `clinical-internal` | Concepto clínico ↔ concepto clínico | `se_lee_junto_a`, `modifica_interpretacion_de`, `se_deriva_de`, `contiene`, `puede_modificar` |
| `traditional-internal` | Concepto tradicional ↔ concepto tradicional (el "cuerpo propio") | `se_transforma_en`, `se_relaciona_con_srotas`, `nutre`, `deriva_de`, `se_expresa_por` |
| `safety` | Interacción, precaución, contraindicación, monitorización | `interactua_con`, `contraindicado_en`, `requiere_monitorizacion_de` |
| `tangency` | Concepto tradicional ↔ terreno clínico (contacto, **no** equivalencia) | `tiene_tangencia_con` (+ `tangency_kind`) |

Aparte del grafo epistemológico existen las **rutas de retrieval**
(`retrieval-routes`): heurísticas de "recuperar también" (fatiga→ferritina,
embarazo→semillas) que **no** son aristas de conocimiento (REGISTRO §3.6).

Ejemplos por capa:

```json
{ "source": "shukra-dhatu", "predicate": "es_un_tipo_de",       "target": "dhatu",            "layer": "taxonomic" }
{ "source": "rasa-dhatu",   "predicate": "se_transforma_en",    "target": "rakta-dhatu",      "layer": "traditional-internal" }
{ "source": "shukra-dhatu", "predicate": "nutre",               "target": "ojas",             "layer": "traditional-internal" }
{ "source": "proteina-c-reactiva", "predicate": "modifica_interpretacion_de", "target": "ferritina", "layer": "clinical-internal" }
{ "source": "shukra-dhatu", "predicate": "tiene_tangencia_con", "target": "oligozoospermia", "layer": "tangency", "tangency_kind": "shared-question-territory" }
{ "source": "prakriti",     "predicate": "tiene_tangencia_con", "target": "perfil-fenotipico", "layer": "tangency", "tangency_kind": "empirical" }
```

### 2.4 Reconciliación con lo existente

El grafo actual usa `relacionado_con` con forma `{ id, relacion, direccion,
contexto }` (marker-a-marker, ver [frontmatter.ts](../apps/web/lib/frontmatter.ts)).
**Decidido (migración 1, Opción A):** se **extiende `relacionado_con`** existente
—no se migra a tripleta explícita todavía—. La tripleta `{source, predicate,
target, layer}` es el **modelo mental**; en el archivo se serializa como
`relacionado_con: { id (=target), relacion (=predicate), direccion, layer }`, con
`source` **implícito** = la tarjeta/marker que declara la arista. `source`/`target`
son **ids de nodo**, que en migración 1 se proyectan 1:1 sobre markers (§2.1), así
que el validador actual (`relacionado_con.id` ∈ markers canónicos) **sigue
pasando**; solo el campo nuevo `layer` se añade a su comprobación de forma. La
tripleta explícita (Opción B) queda como evolución futura si hace falta — el
enriquecimiento con procedencia (§2.2) puede adelantar esa decisión.

### 2.5 Política de expansión (no recorrer vecinos a ciegas)

Recorrer vecinos sin política **amplifica ruido**: un nodo-hub de alto grado
inunda los resultados y una tangencia arrastra el otro plano. El retrieval crudo
ya es fuerte (R@3 ~98%); el grafo **conecta y prioriza, no rellena a ciegas**. La
expansión se gobierna por una política explícita (acordada 2026-07-10):

```json
{
  "max_hops": 1,
  "edge_allowlist": ["se_lee_junto_a", "modifica_interpretacion", "se_relaciona_con_srotas"],
  "edge_budget": 4,
  "tangency_expansion": false,
  "explain_path": true
}
```

| Knob | Def. | Qué controla |
|---|---|---|
| `max_hops` | 1 | 2+ saltos derivan semánticamente. Contar **por capa**. |
| `edge_allowlist` | por intención | Solo estos `predicate` expanden (subconjunto del vocab §2.3). Depende del ÁNGULO: lectura-conjunta habilita `se_lee_junto_a`; interpretación simple puede no expandir. Se engancha con el enrutador de intención existente. |
| `edge_budget` | 4 | Tope de docs añadidos; se gasta **en las aristas de mayor peso primero** (no arbitrario). Evita que un hub inunde. |
| `tangency_expansion` | false (fail-closed) | **Guardarraíl (I8)**: una arista `tangency` no expande por defecto. Se activa solo bajo precondición + disparador (§2.6). |
| `explain_path` | true | Cada doc expandido registra su procedencia (abajo). |

Refinamientos:
- **Expansión = reordenar/boost** de lo ya recuperado, con inyección de un vecino
  directo solo bajo `edge_budget`. No rellenar con docs que la búsqueda base no
  halló.
- **Peso de arista + `revisado_pro`**: el presupuesto prioriza aristas de mayor
  peso y **revisadas por profesional**; las no revisadas se degradan o excluyen.
- **Dirección**: respetar `direccion` (`dirigida` expande en un solo sentido).

Registro de procedencia (estructura, no solo texto):

```json
{ "target_doc": "...", "source": "ferritina", "predicate": "se_lee_junto_a",
  "target": "proteina-c-reactiva", "layer": "clinical-internal", "weight": 0.8 }
```

De ahí se deriva la frase legible — *"Este documento se recuperó porque ferritina
se interpreta junto con PCR"* — que sirve para (a) **auditar si la expansión ayuda**
(entra en la medición E2) y (b) alimentar el **GPS visual** (por qué está aquí).

### 2.6 Activación de tangencias (opt-in, fail-closed)

La línea cortante debe existir **en el código, no solo en la redacción**. Una
arista `tangency` **no participa en la expansión por defecto**. Para activarse
necesita **precondición Y al menos un disparador**:

**Precondición (siempre necesaria):**
- Existe un **puente-editorial aprobado** (revisado) detrás de la arista —
  operacionalmente, `status: reviewed`/`reviewed_pro` (§2.2). Sin él, la tangencia
  no es siquiera una arista consumible.

**Disparador (al menos uno):**
- La pregunta pide **comparación** (intención Comparación del enrutador);
- La pregunta contiene conceptos de **ambos planos** (un marcador clínico y un
  lente de tradición a la vez) — *disparador más laxo; vigilar sobre-disparo en la
  medición*;
- El usuario **abre explícitamente** una perspectiva comparativa (acción de UI).

Si no se cumple precondición + disparador, la tangencia **no se toca**. Así "¿Qué
es pitta?" (un plano, sin comparar) **no recupera** bilirrubina, inflamación,
temperatura ni metabolismo hepático.

**Dos garantías separadas (activarse ≠ equivaler):**
1. **Activación** (esta sección): cuándo una tangencia *puede* entrar.
2. **No transferencia** (I8, regla de generación): aunque entre, se presenta como
   **comparación** con el marco "≠ equivalencia" — nunca como evidencia, identidad
   o causalidad clínica.

El registro `explain_path` debe dejar **por qué** se activó ("comparación
solicitada"), para auditar sobre-disparos.

### 2.7 Registro de predicados (la gramática del grafo)

Un `predicate` no es un string suelto en una allowlist: tiene semántica que el
sistema necesita conocer. **Borrador del registro completo en
[REGISTRO-PREDICADOS.md](REGISTRO-PREDICADOS.md).** Hoy no existe formalmente y **se nota** — el grafo
clínico arrastra **~22 predicados de facto** (`lectura_conjunta` ×110,
`modifica_interpretacion` ×53, `modifica_interpretacion_contextual` ×15,
`mismo_panel` ×20…), solapados y con dirección inconsistente. Un registro central
lo arregla. Cada predicado declara:

```json
{
  "se_lee_junto_a": {
    "direction": "symmetric", "inverse": "se_lee_junto_a",
    "allowed_layers": ["clinical-internal", "traditional-internal"],
    "domain": ["biomarker"], "range": ["biomarker"],
    "retrieval": { "expand": true, "max_hops": 1, "user_facing": true },
    "evidence_required": ["evidence_refs"]
  },
  "modifica_interpretacion_de": {
    "direction": "directed", "inverse": "interpretacion_modificada_por",
    "allowed_source_types": ["biomarker", "preanalytical-factor"],
    "allowed_target_types": ["biomarker"],
    "retrieval": { "expand": true, "max_hops": 1 }
  }
}
```

El registro es **única fuente de verdad**: la `edge_allowlist` (§2.5) y los campos
requeridos (§2.2) se **derivan** de aquí, no se duplican (así no se repite el drift
lente↔taxonomía). `domain`/`range` referencian **tipos de nodo** (`biomarker`,
`preanalytical-factor`, `dhatu`, `srotas`, `dosha`…), lo que obliga a dar a cada
nodo un `type` en I1 y convierte el registro en **validador de forma**.

**Motivo concreto (dirección) — verificado en los datos:** la arista existente
`{ source: ferritina/retinol/PLP, relacion: modifica_interpretacion, target: proteina-c-reactiva }`
está **estructuralmente invertida**: es la **PCR la que modifica** la
interpretación del biomarcador, no al revés. Solo el `contexto` en texto libre la
salva; la dirección `source→target` afirma lo contrario. Corrección canónica:
`PCR → modifica_interpretacion_de → ferritina` (dirigida) o `se_lee_junto_a`
(simétrica). **Dirección e inversas se fijan en el registro antes del backfill.**

## 3. Backlog priorizado

Estados: `pend` (pendiente) · `borrador` · `hecho`. Prioridad: P0 decisión previa ·
P1 modelo y datos · P2 consumo.

### P0 · Decisiones de diseño (bloquean lo demás)

| ID | Qué | Por qué | Estado |
|---|---|---|---|
| R1 | Fijar el conjunto de nodos (§2.1) y su **proyección 1:1 a markers** en migración 1 (identidad de nodo ≠ marker; el marker es proyección) | Sin nodos no hay red; desacoplar evita cementar lo provisional | `decidido` (modelo §2.1) |
| R2 | Esquema de aristas: **Opción A** (extender `relacionado_con` con `layer`, `source` implícito); `layer` cerrado (3 valores), `predicate` conjunto inicial cerrado y ampliable (§2.2–2.4) | Contrato del grafo | `decidido` (migración 1) |
| R3 | El paraguas `ayurveda` **sobrevive como `query_group`** (grupo de consulta que expande a los markers hijos), no como nodo-hoja — patrón `higado`. Así "¿qué dice el Ayurveda?" apunta a todo el clúster y "shukra" solo a shukra | Cambia el scope de recuperación | `decidido` (migración 1) |
| R6 | **Registro de predicados y contrato de aristas** — **[REGISTRO-PREDICADOS.md](REGISTRO-PREDICADOS.md) v0.2**: 5 capas (taxonomic/clinical-internal/traditional-internal/safety/tangency), predicados canónicos con dirección/inversa/domain/range/retrieval/user_facing, `provenance_refs`+`support_kind`, ciclo de vida, reglas de almacenamiento, 23 validaciones, migración de los ~22 heredados y decisiones §13. Corrige la dirección ferritina/PCR | Sin gramática, predicados y direcciones sprawlean — ya pasó | `borrador v0.2` |

### P1 · Modelo, datos y medición

| ID | Qué | Depende de | Estado |
|---|---|---|---|
| **E0** | **Definir el banco de evaluación, dos niveles** (hitos de medición del grafo; distintos de las Etapas E0–E6 del roadmap). *Smoke* 10–15 rápidas ("¿qué es shukra?", "¿relación con ojas?", "¿qué srotas se relaciona con rakta?", "¿qué es prakriti?", "¿qué es rasa dhatu?") para el loop de desarrollo; **aceptación** 30–50 casos (categorías abajo) para decidir activaciones. Preguntas a nivel de concepto → medibles en el sistema actual **y** en el futuro | — | `pend` |
| **R5** | **Endurecer el fallback laxo de `matchesLens` — antes del baseline.** Hoy una tarjeta sin `tradicion` + `seccion:tradicion` encaja con **cualquier** lente (fuga entre tradiciones). Dos pasos: (a) backfill de `tradicion` en las tarjetas de tradición que no lo declaren, para no crear falsos negativos al endurecer; (b) quitar/estrechar el fallback + test. Es **higiene de medición**: sin esto una mejora del grafo es inatribuible | — | `pend` |
| **E1** | **Medir el baseline del sistema ACTUAL, antes de tocar la taxonomía.** Sin este contrafactual ningún cambio es atribuible. Instrumento ya limpio (R5) | E0, R5 | `pend` |
| I1 | Promover el árbol a markers canónicos en `corpus-taxonomy.json` + regenerar `marker-vocabulary.ts` + tests | R1, R3, **E1** | `pend` |
| **I8** | **Guardarraíl de tangencia — antes de crear ninguna.** Cuatro entregables: (1) **validación de esquema** (una `tangency` bien formada, marcada "≠ equivalencia", no usable como arista clínica); (2) **política de retrieval**: activación opt-in fail-closed con precondición (puente aprobado) + disparador (comparación / ambos planos / perspectiva explícita), §2.6; (3) **regla de generación** (nunca transfiere evidencia/identidad/causalidad; **lee y respeta el `does_not_support` de la arista**); (4) **prueba de no-equivalencia** automatizada (**cada `does_not_support` es un `must_not`**) — caso ancla: **"¿Qué es pitta?" NO recupera bilirrubina / inflamación / temperatura / metabolismo hepático** | R2 | `pend` |
| I9 | **Antes del backfill**: auditar dirección del family `modifica_interpretacion` (ferritina/retinol/B6 → PCR invertido, §2.7) y **colapsar los ~22 predicados** al conjunto canónico de R6 | R6 | `pend` |
| I2 | Escribir las aristas `traditional-internal` (verticales + laterales) entre esos markers, transcritas de las tarjetas y sus fuentes. **No cruza planos → puede ir en paralelo, sin esperar a I8** | R2, R6, I1 | `pend` |
| I3 | Codificar las `tangency` (prakriti↔fenotipo, shukra↔oligozoospermia, rakta↔sangre, pitta↔calor/bilis) con semántica "≠ equivalencia". **Bloqueada por I8: no se crea ninguna tangencia antes de la barrera** | R2, I1, **I8** | `pend` |
| I7 | Backfill de `relacionado_con`/aristas en las tarjetas shukra/rasa/rakta (hoy solo en prosa) | R2, R6, I1 | `pend` |
| **E2** | **Medir el resultado tras los cambios** (smoke + aceptación) y comparar con E1: qué cambió realmente. Mide recuperación **y fugas entre planos** | I1, I2, I3 | `pend` |

**Banco de aceptación (E0) — categorías y qué guardarraíl verifica cada una:**

| Categoría | Verifica |
|---|---|
| Preguntas directas ("¿qué es shukra?") | Recuperación base |
| Preguntas con sinónimos / aliases | Lente + aliases |
| Relaciones de dos pasos ("¿qué nutre lo que forma X?") | Aristas del grafo + `max_hops` (§2.5) |
| Preguntas negativas | Precisión; no inventar una relación inexistente |
| **Consultas clínicas donde Ayurveda NO debe aparecer** | Fuga fondo→figura (`must_not`) |
| **Preguntas tradicionales donde la biomedicina NO debe invadir** | Fuga figura→fondo / autonomía |
| Consultas comparativas donde SÍ se permite una tangencia | Activación §2.6 |
| Casos de aliases heredados | Higiene del lente (R4/R5) |
| Caso ancla pitta | No-equivalencia (I8.4, `must_not`) |

Las dos categorías de fuga + la comparativa + pitta son las que **miden el
blindaje figura-fondo**, no solo el recall: cada una verifica un guardarraíl del §2.

### P2 · Consumo en retrieval (solo tras medir)

| ID | Qué | Depende de | Estado |
|---|---|---|---|
| I5 | Consumir el grafo en retrieval **según la política de expansión (§2.5)** — allowlist por intención, presupuesto por peso, reordenar/boost (no rellenar a ciegas), y registro de procedencia. Hoy `relacionado_con` está parseado pero no se recorre | E2 (aceptación pasa) | `pend` |
| I6 | Que el lente (`LENS_SEARCH_TERMS`) lea los alias/markers de la taxonomía en vez de una lista fija → una sola fuente de verdad | I1 | `pend` |

### Revisiones sueltas (deuda detectada)

| ID | Qué | Estado |
|---|---|---|
| R4 | La lista del lente incluye `vata/pitta/kapha/ama/ahara` que **no** están en los alias de la taxonomía; la taxonomía incluye `shukra/yonivyapat/…` que no estaban en el lente. Sincronizar (lo resuelve I6). Mismo tipo de confound que R5: **congelar el instrumento antes del baseline** (o resolver I6 antes de medir). Fix puntual de `shukra` ya aplicado en `marker-scope.ts` (sin commitear) | `parcial` |
| ~~R5~~ | Movido a P1 (higiene de medición: debe ir antes del baseline) | `movido` |

## 4. Reglas que acompañan al modelo (figura-fondo en generación)

`layer` gobierna el uso de cada arista, no solo su color:

- `traditional-internal`: se puede recorrer libremente **dentro del fondo**; el
  asistente explica Ayurveda por su propia red sin pasar por la analítica.
- `clinical-internal`: estándar clínico habitual (evidencia, `limitations`).
- `tangency`: **borde cortante**. Se puede mencionar como territorio de
  comparación/investigación, pero **prohibido** transferir evidencia, identidad o
  causalidad de un extremo al otro. Es el guardarraíl I8.

## 5. Secuencia y criterio de avance

1. **P0 cerrado** (R1–R3 decididos para migración 1, revisables). El contrato ya
   existe; lo que se construya encima no es provisional en el aire.
2. Construir **P1** con **baseline antes de mutar** (pre/post) y **la barrera antes
   del dato peligroso**. Espina completa:

   ```
   E0 · definir banco (smoke 10–15 + aceptación 30–50)
        ↓
   R5 · limpiar el instrumento (fuga del lente)
        ↓
   E1 · baseline del sistema ACTUAL   ← foto antes de tocar nada
        ↓
   I1 · nodos          ‖   I8 · guardarraíl (antes de I3)
        ↓
   I2 · aristas internas   →   I3 · tangencias (solo tras I8)
        ↓
   E2 · medir y comparar con E1   → qué cambió realmente
        ↓
   I5 · consumir (solo si la aceptación pasa)
   ```

   Dos principios en esta espina:
   - **Baseline primero**: sin E1 (foto del sistema actual) el delta de E2 no es
     atribuible. E0/R5/E1 van **antes** de I1.
   - **Barrera antes del dato**: una tangencia es un objeto cargado; I8 va antes de
     I3. Las aristas internas (I2) y el árbol (I1) no cruzan planos → paralelo.
3. Encender **P2** (I5) **solo si** E2 muestra `filtrado ≥ crudo`, menos fugas y
   `must_not` en 0 — misma regla que gobernó el filtro de marcador y el enrutador
   de intención ([[grafo-taxonomia-cableado]], [[direccion-metodologica]]).

Regla transversal: **medir antes de afinar**. El grafo lleva tiempo "dormido en
código" a propósito; se despierta con banco de eval delante, no por intuición.

**Higiene de medición (confound):** limpiar el instrumento **antes** del baseline.
Si el fallback laxo del lente (R5) sigue activo al medir el grafo nuevo, una
mejora es **inatribuible** — ¿nodos, aristas, o la fuga histórica del lente? Por
eso R5 va antes del baseline E1. Misma lógica para congelar los términos del lente (R4/I6):
no cambiar el instrumento a mitad del experimento. Antecedente en el proyecto: la
primera medición del eval dio "fallos" que eran del banco, no del retrieval; hubo
que realinear antes de fiarse ([[grafo-taxonomia-cableado]]).

## 6. Referencias

- [CONTORNOS-AYURVEDA-Y-ANALITICA.md](CONTORNOS-AYURVEDA-Y-ANALITICA.md) — fundamento figura-fondo y §4 (bloqueo del grafo interno).
- [DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md](DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md) — Tramo 4 (grafo) y criterio de medición.
- [visuales/vitamap_mapa_conocimiento_figura_fondo.html](visuales/vitamap_mapa_conocimiento_figura_fondo.html) — el prototipo ya dibuja esta red (datos ilustrativos).
- Fuentes de contorno: PLOS ONE 2017 (prakriti↔fenotipo), arXiv 2202.00216 (grafo sobre texto ayurvédico).
