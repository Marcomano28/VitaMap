# Módulo de brief — Tarjeta D · Lectura conjunta (relación entre marcadores)

> Este módulo desarrolla la tarjeta D ya integrada en el brief principal
> (`PROMPT-INVESTIGACION-RAG.md`). Se conserva como referencia detallada para
> investigar relaciones entre marcadores.

## 1. Función

Las tarjetas A y B responden "¿qué significa mi valor?" y "¿qué factores se
relacionan con él?". Pero la interpretación de una analítica es, en buena parte,
**relacional**: muchos marcadores solo cobran sentido leídos junto a otros, como
patrón, no como cifra suelta. La tarjeta D responde a esa intención.

**Principio rector:**

> Un patrón acota el terreno; no nombra la enfermedad. La tarjeta D enseña a leer
> varios marcadores en conjunto como educación, nunca como diagnóstico del caso
> de una persona concreta. Solo describe relaciones que una fuente declarada
> presente de forma expresa; no infiere patrones, cocientes ni umbrales de
> memoria.

## 2. Preguntas que pretende responder

- "¿Por qué me han pedido varios marcadores a la vez?"
- "¿Cómo se leen juntos estos valores?"
- "Uno está alto y otro normal, ¿qué orienta esa combinación?"
- "¿Qué añade un marcador a la interpretación de otro?"

No responde "¿qué enfermedad tengo?" ni "¿qué debo hacer?".

---

## 3. Cuándo crearla y cuándo no

Crea una tarjeta D **solo** cuando una fuente oficial describa de forma expresa
la lectura conjunta o el patrón. Esta condición es la salvaguarda central:
impide convertir una tarjeta relacional en un árbol de decisión diagnóstico
construido con conocimiento de memoria.

No la crees si:

- la relación procede de tu inferencia y no de una fuente declarada;
- exige introducir cocientes o umbrales numéricos que la fuente no publica;
- la combinación solo tiene sentido como criterio diagnóstico (eso pertenece a la
  consulta médica, no al corpus educativo);
- duplicaría una tarjeta A sin añadir una relación nueva.

Si no hay fuente que respalde el patrón, entrega:

```text
No se recomienda una tarjeta de lectura conjunta para este grupo.
Motivo: ninguna fuente declarada describe el patrón de forma expresa; la
relación disponible sería una inferencia editorial. Las tarjetas A de cada
marcador cubren la interpretación individual.
```

---

## 4. Frontmatter

> **Contrato mínimo de evidencia (v0).** Incluye el bloque `evidence` (con
> `certeza`) y el `relacionado_con[].direccion` de `PROMPT-INVESTIGACION-RAG.md`
> §3 bis. En una tarjeta D la `certeza` describe lo establecido que está el
> patrón de lectura conjunta; usa `direccion` solo si afirmas una asociación.
> `relacionado_con[].id` es un **marcador canónico**.

```yaml
---
title: "Panel hepático: cómo se leen juntos ALT, AST, GGT y fosfatasa alcalina"
source_url: "https://medlineplus.gov/lab-tests/liver-function-tests/"
source_language: en
source_jurisdiction:
  - US
publication_date: "2023-12-05"
source_kind: institutional-education
source_type: lab-pattern-interpretation-summary
rights_status: permitted
facets_version: 1
tarjeta_id: fosfatasa-alcalina-alt-ast-ggt-panel-hepatico-lectura-conjunta-medlineplus
dominio: laboratorio
tipo:
  - analito
  - panel
marker:
  - fosfatasa-alcalina
  - alt
  - ast
  - ggt
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
  - transaminasas
limitations:
  - "Síntesis editorial de VitaMap basada en una fuente institucional; no es una copia de la página original."
  - "Explica cómo se relacionan los marcadores; no interpreta el patrón de una persona concreta."
  - "Un patrón orienta hacia un tipo de problema, pero no nombra la enfermedad ni sustituye al criterio del profesional."
  - "Cada valor se compara con el intervalo de referencia del laboratorio."
  - "No ofrece diagnóstico, tratamiento ni dosis."
---
```

`source_type` usa `lab-pattern-interpretation-summary` y `seccion` usa
`lectura-conjunta`. El resto de campos siguen las reglas del brief principal
(sección 3) y `corpus-preparation/corpus-taxonomy.json`.

---

## 5. Estructura

```markdown
# [Panel o relación]: cómo se leen juntos [marcadores]

## Qué marcadores forman el grupo
Nombra todos los marcadores que la tarjeta relaciona. La tarjeta debe entenderse
sin leer las tarjetas A individuales.

## Por qué se leen juntos
Explica, de forma atribuida, por qué la información está en el patrón y no en una
cifra aislada.

## Qué patrones generales ayudan a orientar
Describe únicamente las combinaciones que la fuente presenta de forma expresa.
Formúlalas como orientación ("apunta más a…", "hace más probable…"), nunca como
conclusión ("indica enfermedad X").

## Qué no permite concluir el conjunto
Explica el límite del patrón: acota, pero no diagnostica; depende de síntomas,
antecedentes, riesgo y medicación; no añade umbrales que la fuente no publique.

## Fuente principal
Cita completa y URL oficial.

## Fuentes complementarias
Las páginas de cada marcador cuando aporten una relación concreta, con su URL.
```

---

## 6. Reglas propias

Se suman a las reglas inviolables del brief principal (sección 6):

1. **Relacional, no personalizada.** Nunca interpretes el patrón de un caso
   concreto. Describe cómo los marcadores se informan entre sí en general.
2. **Solo patrones respaldados.** Cada relación debe estar descrita de forma
   expresa por una fuente declarada. No infieras combinaciones.
3. **Sin umbrales ni cocientes inventados.** No introduzcas ratios ni puntos de
   corte numéricos salvo que la fuente los publique y estén atribuidos.
4. **Orientar, no nombrar.** El patrón acota el origen probable; no concluye una
   enfermedad.
5. **Una relación por tarjeta.** No mezcles paneles distintos (p. ej., hepático y
   lipídico) en un mismo documento.
6. **Autosuficiencia al nivel del grupo.** Nombra todos los marcadores
   implicados; evita referencias vagas como "estos valores".
7. **Longitud orientativa: 300–550 palabras.** Algo mayor que una tarjeta A,
   porque sintetiza varios marcadores.

---

## 7. Cómo representar el patrón sin convertirlo en diagnóstico

Aplica la lógica de frontera del brief principal (sección 7). Distingue con
claridad:

- lo **bien establecido**: que ciertos marcadores se leen en conjunto y qué
  aporta cada uno (p. ej., que solo una de dos enzimas sube también en hueso);
- lo **dependiente del contexto**: que el mismo patrón puede tener causas
  distintas según síntomas, antecedentes, medicación o el momento (un valor
  alterado tras una enfermedad reciente puede ser pasajero y repetirse el
  análisis);
- lo que **queda fuera**: la causa concreta, que necesita más pruebas y criterio
  profesional.

Una formulación útil:

> Sabemos que estos marcadores se leen juntos y que su combinación orienta hacia
> un tipo de problema. Lo que el patrón no dice por sí solo es la causa exacta,
> porque varias situaciones pueden producir el mismo dibujo.

---

## 8. Recuperación (nota para VitaMap)

Una tarjeta D rinde sobre todo cuando la consulta menciona **dos o más
marcadores del mismo grupo** o pregunta por qué se han pedido varios a la vez. Si
la recuperación prioriza siempre el marcador único, esta tarjeta puede no salir
nunca. Conviene que el sistema la priorice ante consultas multi-marcador o de
tipo "¿por qué me pidieron tantos?".

---

## 9. `source_kind` y `source_type`

| Campo | Valor |
|---|---|
| `source_kind` | `institutional-education` (como A y B) |
| `source_type` | `lab-pattern-interpretation-summary` |
| `seccion` | `lectura-conjunta` |
| `marker` | lista con todos los marcadores que la tarjeta relaciona |

---

## 10. Nombre del archivo

```text
[panel-o-grupo]-lectura-conjunta-[fuente].md
```

Minúsculas, sin tildes y con guiones. Ejemplo:
`panel-hepatico-lectura-conjunta-medlineplus.md`.

---

## 11. Checklist de calidad (añadidos a la sección 11 del brief principal)

- [ ] La relación entre marcadores está descrita de forma expresa por una fuente
      declarada, no inferida.
- [ ] La tarjeta orienta ("apunta a…") y no diagnostica ("indica enfermedad X").
- [ ] No introduce cocientes ni umbrales numéricos que la fuente no publique.
- [ ] Nombra todos los marcadores que relaciona y se entiende sin las tarjetas A.
- [ ] `marker` incluye todos los marcadores del panel o relación.
- [ ] `relacionado_con` declara relaciones explícitas cuando la fuente las sostiene.
- [ ] Aborda una sola relación o panel; no mezcla grupos distintos.
- [ ] Explica qué acota el patrón y qué sigue necesitando contexto o más pruebas.
- [ ] `source_type` es `lab-pattern-interpretation-summary`.

---

## Estado de integración

La tabla de tarjetas, `source_type`, checklist y patrón de nombre de la tarjeta D
ya forman parte de `PROMPT-INVESTIGACION-RAG.md`. Si ambos documentos difieren,
prevalece el brief principal y este módulo debe actualizarse para recuperar la
coherencia.
