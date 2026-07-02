# Dirección metodológica: de la prosa a un mapa con evidencia graduada

Versión 0.1 · 2026-06-20
Estado: propuesta metodológica · documento vivo

## 1. Propósito

El corpus y la arquitectura editorial de VitaMap son sólidos (ver
[ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md](ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md)).
Lo que todavía es débil no es *qué* se sabe, sino *cómo se relaciona y con qué
firmeza*: el conocimiento vive como prosa bien escrita, pero el "mapa" que
conecta los temas —con pesos, direcciones y señales— está a medio construir y,
sobre todo, dormido.

Este documento ordena, **en progresión**, cómo acercar la metodología de VitaMap
a referentes sólidos (EBM/GRADE, FHIR/LOINC/UCUM, grafos de conocimiento
tipados) **sin sobrediseñar**. No es un plan de obra cerrado: es la dirección del
camino y el orden en que conviene recorrerlo, con un criterio explícito de qué se
toma prestado y qué se deja fuera en cada tramo.

No sustituye a la §10 (Etapas E0–E6) del documento de arquitectura: la
complementa. Aquella ordena la **ingeniería de recuperación**; ésta ordena la
**metodología de evidencia, interoperabilidad y relaciones**. El §5 las cruza.

## 2. El marco razonable

Antes de la dirección, los límites que la hacen razonable. Toda mejora aquí
respeta cinco restricciones:

1. **Escala de piloto.** Decenas de dossiers, un VPS CPU-only (ver
   [DECISIONS.md](DECISIONS.md) ADR-001/014). Nada que exija GPU permanente,
   clúster o un equipo de metodólogos a tiempo completo.
2. **Sin revisiones sistemáticas propias.** VitaMap sintetiza fuentes
   institucionales; no produce meta-análisis. Toda graduación de evidencia es
   **declarada y trazable**, no calculada por nosotros.
3. **El Markdown sigue siendo la fuente de verdad** y QMD el motor (ADR-001,
   ADR-003). Estas mejoras añaden *campos y señales*, no sustituyen el stack.
4. **Medir antes de afinar.** Ninguna señal nueva se activa en producción sin un
   banco de evaluación que demuestre que mejora. Una mejora no medible no se
   despliega.
5. **La incertidumbre honesta es el guardarraíl, no la víctima.** El riesgo de
   adoptar métodos formales es fingir una precisión que no se tiene. La regla #3
   del [Atrio de la Brújula](EL-ATRIO-DE-LA-BRUJULA.md) —"no convertir firmeza en
   infalibilidad"— manda sobre cualquier etiqueta metodológica.

> Tomamos el **modelo de datos** de estos referentes, no su maquinaria completa.
> LOINC sin un servidor FHIR; GRADE sin un panel de guías; un grafo ponderado sin
> un motor de grafos. El objetivo es rigor declarado y auditable, no aparato.

## 3. Punto de partida observado

Lo que se constató en el código y la taxonomía a fecha de este documento (sirve
como línea base para medir progreso):

- **El grafo de relaciones está dormido.** `relacionado_con` tiene 137 aristas y
  18 tipos de relación, pero **0 con peso**, direcciones inconsistentes (≈83
  extremos unidireccionales vs 54 recíprocos) y **no se consume en recuperación**:
  solo se parsea ([lib/qmd.ts](../apps/web/lib/qmd.ts) L63 y L292) y se valida en
  el generador. Hoy es metadato editorial puro.
- **Granularidad nodo/arista desalineada.** Los nodos se indexan por dossier
  (85), las aristas apuntan a markers (99); 14 analitos mayores (`alt`, `ast`,
  `ggt`, `egfr`, `ferritina`…) no tienen nodo propio. No se puede recorrer
  tema→tema limpiamente.
- **No hay certeza de evidencia modelada.** `evidence_level` se menciona en un
  comentario ([lib/frontmatter.ts](../apps/web/lib/frontmatter.ts) L4) pero no
  está en el tipo, no aparece en ninguna tarjeta y no se consume. `rights_status`
  y `limitations` son licencia y cautelas en prosa, no una certeza graduada.
- **No hay códigos ni unidades.** Los markers son slugs + coincidencia de alias
  por substring ([lib/marker-scope.ts](../apps/web/lib/marker-scope.ts)
  `markersIn`). Sin LOINC, sin UCUM, sin rangos de referencia estructurados.
- **Las señales conversacionales existen pero están apagadas.** `markers` (filtro
  fuerte), `lens` y `healthAreas` se calculan en cada chat (`deriveScope`) y
  luego se **descartan** salvo que `KB_MARKER_SCOPE` esté activo, cosa que ningún
  entorno del repo hace ([qmd.ts](../apps/web/lib/qmd.ts) L415;
  [.env.example](../apps/web/.env.example) L47).
- **No hay banco de evaluación versionado** y `minScore` (0.35 sobre RRF sin
  reranker) no está calibrado.

## 4. La progresión: cuatro tramos del camino

La metáfora del proyecto es un camino por el desierto. La mejora metodológica es
ese mismo camino, recorrido por tramos. **Cada tramo habilita el siguiente**: sin
medir no se sabe qué firmeza declarar; sin firmeza declarada el grafo no tiene
con qué ponderar; sin códigos las series no son comparables.

### Tramo 1 · Medir antes de afinar — *pisar suelo firme*

**Problema.** No existe banco de evaluación ni `minScore` calibrado, y la
acotación por marcador está construida, testeada y apagada. No sabemos dónde
caen hoy las respuestas, así que cualquier ajuste es a ciegas.

**Qué tomamos de EBM.** Su disciplina más básica: *medir antes de concluir*, y
que una afirmación sea falsable. Aquí, que una mejora de recuperación sea
falsable contra un conjunto fijo de consultas.

**Primer artefacto.** Un banco de 10–20 consultas por tema (amplía la Etapa E0
del doc de arquitectura), versionado en el repo:

```yaml
# eval/perfil-hepatico.yml
- query: "¿qué significa la GGT alta?"
  expected: [fosfatasa-alcalina-alt-ast-ggt/ggt-interpretacion-medlineplus.md]
  must_not_prioritize: [hierro/ferritina-interpretacion-medlineplus.md]
```

Con él: calibrar o retirar `minScore`; decidir el destino de `KB_MARKER_SCOPE`
(promoverlo con datos o documentar por qué no); reportar `recall@3` y primer
resultado esperado, en español y alemán.

**Qué NO hacer.** No construir una plataforma de evaluación. Ficheros YAML + un
script que imprime recall. Nada más hasta que duela.

**Vínculo con la filosofía.** No se distingue la roca de la arena si nunca se
comprueba dónde pisó la respuesta.

### Tramo 2 · Nombrar la firmeza — *roca y arena como dato*

**Problema.** La firmeza solo vive en la prosa y en la voz editorial ("camino
marcado", "horizonte abierto"). No es un campo: no se puede consultar, filtrar,
auditar ni —más adelante— usar como peso.

**Qué tomamos de GRADE.** Su esqueleto, en versión ligera: un eje de **certeza**
en cuatro niveles, una **dirección** del efecto, y la razón explícita por la que
se baja la certeza (los dominios GRADE: riesgo de sesgo, inconsistencia,
evidencia indirecta, imprecisión, sesgo de publicación). Más adelante, fuerza de
recomendación cuando aplique.

**Primer artefacto — Contrato mínimo de evidencia v0 (CONGELADO, ya en vigor).**
Un bloque `evidence` declarado por tarjeta (o por afirmación clínica fuerte):

```yaml
evidence:
  certeza: moderada          # alta | moderada | baja | muy-baja   (siempre)
  direccion: a-favor         # a-favor | en-contra | incierta       (solo si hay afirmación)
  poblacion: "adultos sanos" # texto libre, opcional
  motivos_descenso:          # solo si certeza < alta
    - imprecision
    - evidencia-indirecta
```

> **Estado:** este contrato ya está congelado y en vigor para tarjetas nuevas.
> Su definición canónica vive en
> [corpus-preparation/PROMPT-INVESTIGACION-RAG.md](../corpus-preparation/PROMPT-INVESTIGACION-RAG.md)
> §3 bis (los demás briefs apuntan ahí); su forma se valida en
> `apps/web/scripts/test-marker-taxonomy.ts` y su tipo en
> `apps/web/lib/frontmatter.ts`. Es **aditivo e inerte**: nada lo consume todavía
> (eso llega con el resto del Tramo 2), así que escribirlo ahora solo evita un
> backfill futuro y no puede degradar la recuperación. `direccion` es condicional
> (solo si la tarjeta afirma eficacia o asociación); en tarjetas de autoridad
> textual o identidad puede omitirse el bloque. La misma idea aplicada al grafo
> —`relacionado_con[].direccion`— se valida igual; su `peso` se aplaza al Tramo 4.

La `certeza` **alimenta** la marca de terreno del Atrio, pero no la sustituye:
son ejes relacionados, no idénticos. El terreno combina dos cosas distintas —la
firmeza (certeza GRADE) y la dependencia del contexto— y conviene no fundirlas:

| Señal del dato | Marca de terreno probable |
|---|---|
| certeza alta, poco dependiente del contexto | camino marcado |
| válido pero su lectura cambia con persona/método/momento | cruce de caminos |
| certeza baja / muy-baja, emergente | horizonte abierto |
| una afirmación va más lejos que su `certeza` | aviso de espejismo |

**Qué NO hacer.** No fingir GRADE completo (es por desenlace y lo hacen
metodólogos). La certeza la **declara el editor citando su fuente**; no se calcula
ni implica que VitaMap haya revisado la literatura. Cuatro niveles, no una escala
continua falsamente precisa.

**Vínculo con la filosofía.** Convierte "roca/arena" de voz editorial en dato
auditable —y prepara el guardarraíl: la certeza llega al usuario en lenguaje de
terreno, nunca como un número que aparente lo que no es.

### Tramo 3 · Anclar las medidas — *códigos y unidades*

**Problema.** Los markers son slugs sin código ni unidad ni rango estructurado.
Las tarjetas D (lectura conjunta) y E (seguimiento temporal) prometen comparar
mediciones, pero sin unidad común esa comparación no es honesta; y la ingesta de
analíticas del piloto alemán no es interoperable.

**Qué tomamos de FHIR.** Su modelo de datos para el **plano personal y el
diccionario de markers** (no para la prosa educativa):

- cada marker canónico gana **LOINC** y unidad **UCUM**;
- las observaciones personales se modelan como una `Observation` ligera
  (valor + unidad + fecha + rango de referencia);
- se reutiliza su semántica de relación ya probada: `Observation.hasMember`
  (= `mismo_panel`) y `derivedFrom` (= `se_calcula_con` / `calculo_derivado`),
  en lugar de inventar tipos ad hoc.

**Primer artefacto.**

```yaml
# diccionario de markers (taxonomía)
ferritina:
  loinc: ["2276-4"]
  unit_ucum: "ug/L"
  panel: [hierro]            # ~ hasMember / mismo_panel

# observación personal (memoria), FHIR-lite
- marker: ferritina
  value: 18
  unit_ucum: "ug/L"
  observed_at: 2026-05-12
  reference_range: { low: 30, high: 300, unit_ucum: "ug/L" }
  derived_from: null         # p. ej. egfr derived_from creatinina
```

Empezar por los ~30 markers más frecuentes del piloto, no por los 99.

**Qué NO hacer.** No levantar un servidor FHIR ni adoptar el modelo de recursos
completo. No "FHIR-izar" las tarjetas explicativas. Se toma *el vocabulario de
códigos y dos semánticas de relación*, no la infraestructura.

**Vínculo con la filosofía.** Una clave del Atrio dice que "una referencia ayuda
a comparar": para que esa comparación sea verdad necesita una unidad y un código,
no una intuición.

### Tramo 4 · Despertar el mapa — *pesos, direcciones y señales*

**Problema.** El grafo `relacionado_con` es rico en tipos pero inerte: sin peso,
con direcciones inconsistentes, con nodos y aristas a distinta granularidad, y
sin que la recuperación lo consulte jamás.

**Qué tomamos de los grafos de conocimiento tipados** (estilo modelo de
relaciones de SNOMED CT): toda arista con **tipo + dirección + uso**, y la
recuperación recorriéndolo con *decaimiento*.

**Primer artefacto.** Tres cambios, en este orden:

1. **Granularidad.** Decidir nodos a nivel **marker**; el dossier pasa a ser una
   agrupación, no el nodo. Así las 14 aristas hoy "huérfanas" resuelven a un nodo
   real.
2. **Dirección y peso explícitos**, validados en el test de taxonomía:

   ```yaml
   relacionado_con:
     - id: hierro
       relacion: mismo_panel
       direccion: simetrica   # simetrica | dirigida
       peso: fuerte           # fuerte | medio | debil  (3 bandas, no continuo)
   ```

   Las simétricas (`mismo_panel`, `lectura_conjunta`) se validan recíprocas; las
   dirigidas (`modifica_interpretacion`, `se_calcula_con`) se validan en un solo
   sentido.
3. **Consumo en recuperación.** Tras el hit directo, expansión suave de vecinos
   con boost decreciente según `peso`, detrás de flag y **solo si el banco del
   Tramo 1 muestra mejora**. Preguntan por `ferritina` → se atrae suave
   `hierro`/`transferrina` (peso fuerte, `mismo_panel`) sin tapar el hit directo.

**Qué NO hacer.** No pesos continuos ni aprendidos: tres bandas declaradas a
mano. No un motor de grafos: la expansión vive en la app sobre la misma KB de
QMD. No activar nada que el Tramo 1 no respalde con números.

**Vínculo con la filosofía.** Esto es, literalmente, "el camino con pesos,
direcciones y señales de tráfico" —pero solo se encienden las señales que se han
medido.

## 5. Cómo encaja con las Etapas E0–E6

Esta dirección no compite con la §10 del documento de arquitectura; la profundiza
por el lado metodológico.

| Tramo (metodología) | Se apoya en / alimenta (ingeniería) |
|---|---|
| **T1 · Medir** | **E0** (corpus medible) + calibrar `minScore` (E0); decide la suerte de `KB_MARKER_SCOPE` |
| **T2 · Firmeza (GRADE-lite)** | Da sustancia a **E4** (grounding y citas por afirmación): cada afirmación lleva certeza |
| **T3 · Códigos y unidades** | Concreta **E3** (metadatos y dossiers) en el plano de markers y datos personales |
| **T4 · Grafo ponderado** | Hace que **E1** (router de intención) y **E3** sean *conscientes de relaciones*; se activa con la cautela de **E5** (como el reranker: solo por mejora demostrada) |

## 6. Criterio para avanzar de tramo

> No se empieza un tramo hasta que el artefacto del anterior está medido por el
> banco del Tramo 1.

Es la traducción operativa del marco razonable: la progresión avanza por
evidencia de mejora, no por entusiasmo. Si T2 no mejora la utilidad percibida o
la trazabilidad, se ajusta antes de pasar a T3. Cada tramo, al consolidarse,
puede graduarse a un ADR en [DECISIONS.md](DECISIONS.md).

## 7. Riesgo transversal

El mayor riesgo de formalizar la metodología es el **cosplay de precisión**: que
una etiqueta `certeza: alta`, un código LOINC o un `peso: fuerte` se lean como
una exactitud que no se tiene. Tres salvaguardas permanentes:

1. la certeza llega al usuario en lenguaje de terreno (roca/arena), no como cifra;
2. todo dato graduado es **declarado y trazable** a su fuente, nunca presentado
   como cálculo propio de VitaMap;
3. ante una señal de firmeza que vaya más lejos que su evidencia, gana el "aviso
   de espejismo" del Atrio.

## 8. Resumen

- La dirección es: **medir → nombrar la firmeza → anclar las medidas → despertar
  el mapa.** Cuatro tramos, cada uno habilita al siguiente.
- Se toma el *modelo de datos* de EBM/GRADE, FHIR/LOINC/UCUM y los grafos
  tipados; no su maquinaria.
- Todo cambio es declarado, trazable, falsable y reversible; ninguno se despliega
  sin que el banco de evaluación lo respalde.
- El guardarraíl invariable: rigor honesto, nunca precisión fingida.
