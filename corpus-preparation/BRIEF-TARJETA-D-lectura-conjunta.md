# Módulo de brief · Tarjeta D · Lectura conjunta

Versión 0.2 · 2026-07-11  
Estado: referencia editorial activa para revisión

> **Módulo subordinado.** Desarrolla la tarjeta D del brief principal
> `PROMPT-INVESTIGACION-RAG.md`. Si ambos difieren, **prevalece el brief
> principal** y este módulo se actualiza para recuperar la coherencia. El contrato
> del grafo (predicados, aristas, procedencia) vive en
> [`docs/REGISTRO-PREDICADOS.md`](../docs/REGISTRO-PREDICADOS.md); el plan de
> construcción, en
> [`docs/PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md`](../docs/PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md).

## 1. Función

Las tarjetas A explican un marcador individual. La tarjeta D explica una
**unidad interpretativa relacional**:

- un panel;
- un eje;
- una relación explícita entre dos o más marcadores;
- una pregunta como “¿qué añade este marcador a la lectura del otro?”.

Principio rector:

> Un patrón organiza información y puede orientar la evaluación; no identifica
> por sí solo una enfermedad ni una causa.

La tarjeta D enseña relaciones generales respaldadas por una fuente. No
interpreta automáticamente el caso concreto de una persona.

---

## 2. Preguntas que pretende responder

- ¿Por qué me han pedido varios marcadores?
- ¿Cómo se leen juntos estos valores?
- ¿Qué añade un marcador a la interpretación de otro?
- ¿Qué información aporta el conjunto que no aporta una cifra aislada?
- ¿Por qué un resultado necesita contexto de otro?

No responde:

- ¿Qué enfermedad tengo?
- ¿Cuál es la causa exacta?
- ¿Qué tratamiento necesito?
- ¿Qué debo cambiar sin valoración profesional?

---

## 3. Cuándo crearla

Crear una tarjeta D solo cuando una fuente adecuada describa de forma expresa:

- la lectura conjunta;
- el papel de cada componente;
- el patrón general;
- o la forma en que un marcador modifica el contexto de otro.

No crearla cuando:

- la relación sea una inferencia editorial;
- solo exista pertenencia al mismo panel;
- requiera inventar ratios o umbrales;
- dependa de un algoritmo diagnóstico no reproducido;
- duplique tarjetas A sin añadir una relación;
- mezcle paneles sin una pregunta interpretativa común.

Si no existe soporte suficiente:

```text
No se recomienda una tarjeta D para este grupo.

Motivo:
la fuente disponible no describe una unidad interpretativa explícita. Las
tarjetas individuales cubren la información respaldada.
```

---

## 4. Una unidad interpretativa por tarjeta

Regla anterior:

```text
una relación por tarjeta
```

Regla revisada:

> Una tarjeta D aborda un único panel, eje o problema interpretativo coherente.

Puede contener varias relaciones cuando:

- pertenecen a la misma unidad;
- la fuente las presenta;
- cada una conserva su procedencia;
- no se convierte el panel en una red completa artificial.

Ejemplo correcto:

```text
Panel hepático
├── ALT y AST: información sobre lesión celular
├── GGT y fosfatasa alcalina: contexto hepatobiliar
└── bilirrubina: otra dimensión de la evaluación
```

No generar automáticamente:

```text
ALT ↔ AST
ALT ↔ GGT
ALT ↔ fosfatasa alcalina
AST ↔ GGT
...
```

Que varios marcadores pertenezcan a un panel no demuestra una relación clínica
directa entre cada pareja.

---

## 5. Frontmatter mínimo

```yaml
---
title: "Panel hepático: cómo se leen juntos ALT, AST, GGT y fosfatasa alcalina"

source_url: "https://..."
source_language: en
source_jurisdiction:
  - US
publication_date: "2023-12-05"

source_kind: institutional-education
source_type: lab-pattern-interpretation-summary
rights_status: permitted

facets_version: 1
tarjeta_id: panel-hepatico-lectura-conjunta-fuente

dominio: laboratorio

tipo:
  - panel

marker:
  - alt
  - ast
  - ggt
  - fosfatasa-alcalina

categoria:
  - perfil-hepatico

muestra:
  - suero
  - plasma

sistema:
  - hepatobiliar

area_de_salud:
  - salud-hepatica

seccion: lectura-conjunta

alias:
  - perfil hepático
  - pruebas hepáticas

limitations:
  - "Síntesis educativa basada en la fuente declarada."
  - "Describe relaciones generales; no interpreta el patrón concreto de una persona."
  - "El conjunto no identifica por sí solo una enfermedad ni una causa."
  - "Los resultados se interpretan con los intervalos, métodos y contexto clínico pertinentes."
  - "No ofrece diagnóstico, tratamiento ni dosis."
evidence:
  certeza: alta            # alta | moderada | baja | muy-baja (siempre)
---
```

Durante la migración, `marker` continúa identificando los marcadores cubiertos
por la tarjeta.

**Contrato mínimo de evidencia (v0):** incluye el bloque `evidence` con `certeza`
(en una tarjeta D, cuán establecido está el patrón de lectura conjunta) y, si
afirmas una asociación dirigida, `relacionado_con[].direccion`. Ver
`PROMPT-INVESTIGACION-RAG.md` §3 bis. Está inerte hasta el Tramo 2, pero se
captura al redactar para no backfillearlo después.

El modelo objetivo separa:

- conceptos;
- paneles;
- aristas;
- procedencia.

---

## 6. Aristas opcionales

Una tarjeta D no tiene obligación de crear una arista entre todos sus markers.

Solo declarar aristas cuando la fuente sostenga una relación específica.

**Serialización (migración 1):** hoy la relación se declara como `relacionado_con`
(`id`=target, `relacion`=predicate, `direccion`, `layer`; `source` implícito = la
tarjeta) y el grafo se transcribe a `corpus-taxonomy.json`
([REGISTRO-PREDICADOS.md](../docs/REGISTRO-PREDICADOS.md) §2.4). El bloque `edges:`
de abajo es el **modelo objetivo** (Opción B, registros de arista explícitos con
`edge_id`), aún no exigido por el validador:

```yaml
edges:
  - edge_id: edge-fal-ggt-001

    source: clinical.fosfatasa-alcalina
    predicate: se_lee_junto_a
    target: clinical.ggt

    layer: clinical-internal

    provenance_refs:
      - source-panel-hepatico-001

    support_kind: institutional-reference
    status: reviewed

    context: >
      La GGT puede aportar contexto cuando se interpreta una elevación
      de fosfatasa alcalina.
```

Reglas:

- no crear cliques de panel;
- no confundir `es_componente_de` con `se_lee_junto_a`;
- no usar `modifica_interpretacion_de` si la relación solo es co-lectura;
- declarar dirección cuando la relación sea asimétrica;
- conservar procedencia por arista.

---

## 7. Estructura del cuerpo

```markdown
# [Panel o relación]: cómo se leen juntos [marcadores]

## Qué forma esta unidad interpretativa

Nombra los componentes y explica por qué se agrupan.

## Qué aporta cada marcador

Describe la información diferencial de cada componente.

## Cómo se complementan

Explica solo relaciones respaldadas.

## Qué patrones generales pueden aportar contexto

Usa lenguaje prudente:

- “puede aportar contexto”;
- “puede orientar qué aspecto valorar”;
- “es compatible con varias situaciones”;
- “ayuda a distinguir posibilidades”.

Evita afirmaciones diagnósticas.

## Qué no permite concluir

Explica:

- que el patrón no identifica una causa;
- que varias situaciones pueden producir un dibujo parecido;
- que síntomas, antecedentes, medicación, método y evolución importan;
- que puede ser necesario repetir o ampliar pruebas.

## Fuente principal

Referencia completa y URL.

## Fuentes complementarias

Solo las que sostienen una relación concreta.
```

---

## 8. Lenguaje permitido y lenguaje restringido

### Preferido

> Estos marcadores aportan información complementaria.

> La combinación puede ayudar a orientar qué aspecto conviene valorar.

> El patrón es compatible con varias situaciones y no identifica por sí solo una
> causa.

> La PCR puede cambiar cómo se interpreta la ferritina cuando existe un contexto
> inflamatorio.

### Usar solo si la fuente lo sostiene de forma explícita

> Hace más probable…

> Apunta más a…

> Sugiere origen…

Estas expresiones exigen contexto, población y alternativas relevantes.

### Prohibido

> Confirma…

> Demuestra que tienes…

> Significa que la causa es…

> Diagnostica…

---

## 9. Reglas editoriales

1. Relacional, no personalizada.
2. Solo relaciones expresas en una fuente.
3. Sin ratios ni puntos de corte inventados.
4. Una unidad interpretativa por tarjeta.
5. No convertir un panel en una clique.
6. Diferenciar pertenencia de cointerpretación.
7. Autosuficiencia al nivel del grupo.
8. Procedencia por relación cuando existan varias.
9. Longitud orientativa: 350–650 palabras.
10. Explicar límites con el mismo cuidado que el patrón.

---

## 10. Recuperación

Una tarjeta D gana prioridad cuando:

- la consulta menciona dos o más marcadores relacionados;
- pregunta por un panel;
- pregunta “¿cómo se leen juntos?”;
- pregunta qué añade un marcador al contexto de otro.

El router puede priorizar:

```text
pattern-interpretation
```

La expansión por grafo solo se activa con:

- arista revisada;
- procedencia;
- predicado permitido;
- máximo un salto inicialmente.

El sistema debe poder explicar:

> Esta tarjeta aparece porque los marcadores mencionados forman una unidad de
> lectura respaldada por la fuente.

---

## 11. Relación con el GPS

En el mapa del usuario:

- el centro es su pregunta, panel o conjunto de resultados;
- se muestran inicialmente 3–5 conexiones;
- cada línea usa lenguaje cotidiano;
- el usuario puede abrir “¿por qué aparece?”;
- pertenecer a un panel se muestra distinto de modificar una interpretación;
- la evidencia y los límites están disponibles sin saturar la primera vista.

Ejemplo:

```text
                    GGT
                     │
       “ayuda a contextualizar”
                     │
Fosfatasa alcalina ──┼── Panel hepático
```

---

## 12. Checklist

- [ ] La tarjeta responde una pregunta relacional real.
- [ ] La fuente describe la unidad o relación de forma expresa.
- [ ] No interpreta un caso individual.
- [ ] No crea relaciones entre todos los miembros por pertenecer al mismo panel.
- [ ] Distingue `es_componente_de` de `se_lee_junto_a`.
- [ ] Las relaciones asimétricas tienen dirección correcta.
- [ ] Cada arista tiene procedencia.
- [ ] No introduce ratios ni umbrales no publicados.
- [ ] Usa lenguaje orientativo prudente.
- [ ] Explica qué no permite concluir.
- [ ] Nombra todos los componentes.
- [ ] Se entiende sin leer las tarjetas A.
- [ ] `source_type` es `lab-pattern-interpretation-summary`.
- [ ] `seccion` es `lectura-conjunta`.

---

## 13. Regla final

> La tarjeta D no es un diagnóstico comprimido ni una red automática de
> biomarcadores. Es una explicación documentada de cómo una unidad de datos
> adquiere sentido cuando sus componentes se leen en contexto.
