# Brief de investigación — Corpus RAG de VitaMap (Fase piloto)

## 1. Contexto

VitaMap es un asistente educativo de salud personal. La persona sube su
analítica y hace preguntas en lenguaje natural, por ejemplo: "¿qué significa mi
LDL en 139 mg/dL?". Un modelo pequeño alojado en el servidor responde con ayuda
de una base de conocimiento curada manualmente.

Tu tarea es escribir documentos educativos, claros y verificables, organizados
por las preguntas que una persona podría formular sobre cada tema.

**Principio rector:**

> La ciencia es siempre la base. El lenguaje debe ser accesible. La medicina
> tradicional solo aparece como perspectiva atribuida cuando la persona la pide
> o cuando aporta un contexto relevante. Una coincidencia con la evidencia no
> constituye confirmación científica.

---

## 2. Arquitectura editorial: tarjetas por intención

Cada archivo Markdown es una **tarjeta de conocimiento**: una unidad breve que
responde a una intención de consulta. No significa crear un archivo por cada
frase posible. Preguntas equivalentes deben compartir tarjeta.

Para un tema pueden existir hasta tres tarjetas:

| Tarjeta | Pregunta principal | Estado |
|---|---|---|
| **A · Interpretación** | "¿Qué mide y qué significa este resultado?" | Obligatoria para cada marcador |
| **B · Alimentación y factores modificables** | "¿Qué factores cotidianos se relacionan con este marcador?" | Solo cuando haya una fuente oficial útil |
| **C · Curiosidad científica** | "¿Qué aspecto interesante ayuda a comprenderlo?" | Opcional; se produce con el brief de enriquecimiento |

Ejemplo para colesterol LDL:

```text
colesterol-ldl-interpretacion-medlineplus.md
colesterol-ldl-alimentacion-factores-medlineplus.md
colesterol-curiosidad-[gancho]-[fuente].md
```

No generes tres tarjetas por obligación. Si la tarjeta B o C no aporta una
respuesta distinta y bien respaldada, entrega solo la A. No mezcles las tres
intenciones en un único documento.

Cada archivo tiene:

1. **Frontmatter YAML** compatible con la interfaz de VitaMap.
2. **Cuerpo Markdown** centrado en una intención.

---

## 3. Frontmatter compatible con VitaMap

Copia esta estructura. Los nombres de campo no se cambian.

```yaml
---
title: "Colesterol LDL: interpretación general"
source_url: "https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html"
publication_date: "2025-05-05"
source_kind: institutional-education
source_type: lab-interpretation-summary
rights_status: permitted
limitations:
  - "Síntesis editorial de VitaMap; no es una copia de la página original."
  - "Los valores son referencias generales, no objetivos individuales."
  - "El riesgo cardiovascular global modifica la interpretación."
  - "No ofrece una recomendación de tratamiento."
---
```

### Reglas de los campos

| Campo | Regla |
|---|---|
| `title` | 3–240 caracteres. Debe identificar el tema y la intención. |
| `source_url` | URL oficial de la fuente principal. Es obligatorio aportar `source_url`, `doi` o `pmid`. |
| `publication_date` | Fecha real de publicación o última revisión indicada por la fuente. Formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`. No la inventes. |
| `source_kind` | Solo uno de los tres valores de la sección 7. |
| `source_type` | Usa `lab-interpretation-summary` para A o `nutrition-lifestyle-summary` para B. |
| `rights_status` | Solo `permitted`, `licensed`, `metadata-only` o `unknown`. No presupongas que acceso gratuito equivale a permiso. |
| `limitations` | Lista de 3–5 advertencias honestas sobre los límites del documento. |

Usa ortografía y acentos correctos también en el frontmatter. El título se
muestra al usuario en las tarjetas de cita.

El modelo prepara un borrador. No declares que ha sido revisado o aprobado por
una persona; ese estado lo registra VitaMap durante la revisión administrativa.

### Comprobación obligatoria de derechos

Comprueba los derechos de la página concreta, no solo el dominio. En MedlinePlus:

- los resúmenes de temas de salud y la información de pruebas médicas producida
  por NLM están en dominio público;
- los artículos de la **A.D.A.M. Medical Encyclopedia** son contenido licenciado
  y no deben usarse para crear síntesis, embeddings o documentos RAG sin permiso.

No uses como fuente una URL de MedlinePlus bajo `/ency/article/`. Si una fuente
indica que prohíbe derivados, indexación, minería, embeddings o uso en sistemas
de IA/RAG, descártala y busca una alternativa permitida. Un documento con
`rights_status: unknown` o `metadata-only` puede entregarse como referencia, pero
no está listo para publicación.

---

## 4. Tarjeta A — Interpretación de la analítica

Responde a preguntas como:

- "¿Qué mide este parámetro?"
- "¿Qué significa mi resultado?"
- "¿Cómo se compara con una referencia general?"
- "¿Qué puede alterar su interpretación?"

### Estructura

```markdown
# [Título del parámetro]

## Qué mide esta prueba
Explicación breve y accesible.

## Cómo se interpreta de forma general
Incluye rangos únicamente cuando la fuente principal los publique. Atribúyelos
siempre y usa las unidades habituales del informe.

## Qué puede cambiar la interpretación
Edad, embarazo, método de laboratorio, medicación, contexto clínico u otros
factores respaldados por la fuente.

## Qué no permite concluir por sí solo
Explica los límites de un valor aislado sin diagnosticar.

## Fuente principal
Cita completa y URL oficial.
```

---

## 5. Tarjeta B — Alimentación y factores modificables

Solo créala cuando una fuente oficial permita responder de forma útil y
claramente diferente de la tarjeta A.

Responde a preguntas como:

- "¿Qué factores cotidianos pueden influir?"
- "¿En qué alimentos se encuentra este nutriente?"
- "¿Qué relación general tiene con alimentación, actividad, tabaco o alcohol?"

### Estructura

```markdown
# [Tema]: alimentación y factores relacionados

## Qué factores se relacionan
Resumen general y atribuido de los factores respaldados por la fuente.

## Fuentes alimentarias o contexto cotidiano
Alimentos o circunstancias relevantes, solo cuando la fuente los describa.

## Qué se sabe y qué no
Diferencia entre asociación, mecanismo conocido y beneficio clínico demostrado.

## Alcance
Aclara que la información general no es una pauta personalizada.

## Fuente principal
Cita completa y URL oficial.
```

Esta tarjeta puede explicar relaciones generales, pero no debe contestar "qué
debo hacer yo", diseñar dietas, prescribir ejercicio ni sugerir dosis.

---

## 6. Reglas inviolables

1. **No diagnostiques.** Nunca escribas "tienes diabetes" ni "esto demuestra
   enfermedad X". Describe referencias y significado general.
2. **No recomiendes tratamiento ni dosis.** Tampoco cambios de medicación,
   suplementos o dietas personalizadas.
3. **Síntesis, no copia.** Redacta con tus propias palabras.
4. **Solo afirma lo respaldado por una fuente declarada.** No rellenes huecos
   con conocimiento de memoria. Si necesitas otra fuente para una afirmación
   importante, declárala en una sección `## Fuente complementaria` con su URL.
5. **Lenguaje accesible.** Explica la jerga y evita tono de informe médico.
6. **Incluye una tabla de referencia solo si la fuente la ofrece.** Si la
   fuente remite al intervalo del laboratorio, dilo; no añadas un rango de
   memoria.
7. **Una intención por tarjeta.** No mezcles interpretación, alimentación,
   curiosidades, historia y tradición en el mismo archivo.
8. **Autosuficiencia.** El fragmento debe entenderse sin leer otra tarjeta.
   Nombra el marcador y evita referencias vagas como "este valor".
9. **Longitud orientativa: 250–500 palabras.** Prioriza precisión y estructura.
10. **No dupliques.** Antes de redactar, compara el título y la intención con
    los otros documentos del lote.

---

## 7. El valor de `source_kind`

| Valor | Cuándo usarlo | `source_type` típico |
|---|---|---|
| `institutional-education` | Información de organismos públicos de salud como NIH, NIDDK, MedlinePlus, CDC, OMS o IQWiG. Será el más común. | `lab-interpretation-summary`, `nutrition-lifestyle-summary` |
| `clinical-evidence` | Guías clínicas formales, revisiones sistemáticas o consensos científicos. | `clinical-guideline`, `systematic-review`, `scientific-consensus` |
| `tradition-context` | Perspectivas sobre Ayurveda, MTC, acupuntura u otras tradiciones. No se usa en este brief. | `traditional-perspective-summary` |

No clasifiques una página institucional como `clinical-evidence` solo porque
sea fiable. La clasificación describe el tipo de documento.

---

## 8. Cobertura priorizada

Para cada marcador produce primero la tarjeta A. Produce la B solo cuando
exista una fuente apropiada y la intención sea claramente distinta.

### Prioridad 1 — tarjeta A

- Glucosa en ayunas
- Hemoglobina glicosilada (HbA1c)
- Colesterol total
- Colesterol LDL
- Colesterol HDL
- Triglicéridos
- Vitamina D (25-OH)
- TSH
- Creatinina y filtrado glomerular estimado (eGFR)
- Hemoglobina y hematocrito

### Prioridad 2 — tarjeta A

- Vitamina B12
- Ácido fólico
- Ferritina y hierro
- Transaminasas (ALT/GPT y AST/GOT)
- GGT y fosfatasa alcalina
- Ácido úrico
- Proteína C reactiva (PCR)
- T4 libre
- Leucocitos y fórmula leucocitaria
- Plaquetas

### Tarjetas B prioritarias

- Vitamina D: fuentes alimentarias y factores
- Hierro: fuentes alimentarias y biodisponibilidad
- Vitamina B12: fuentes alimentarias
- Ácido fólico: fuentes alimentarias
- Calcio y magnesio: fuentes alimentarias
- Perfil lipídico: factores relacionados respaldados por una fuente institucional
- Glucosa y HbA1c: factores generales relacionados, sin convertirlos en tratamiento

---

## 9. Fuentes preferentes

Prioriza fuentes oficiales, públicas y verificables.

| Fuente | Ideal para |
|---|---|
| MedlinePlus | Pruebas de laboratorio y educación sanitaria |
| NIDDK | Diabetes, riñón y aparato digestivo |
| NIH Office of Dietary Supplements | Vitaminas y minerales |
| CDC | Salud general y prevención |
| OMS / WHO | Criterios y educación sanitaria global |
| IQWiG / Gesundheitsinformation.de | Información sanitaria en contexto alemán |
| USDA FoodData Central | Composición de alimentos |

Redacta en español. Si un término alemán puede mejorar la recuperación,
añádelo entre paréntesis en la primera sección.

En MedlinePlus prioriza páginas de temas de salud y de pruebas médicas. Excluye
la A.D.A.M. Medical Encyclopedia (`/ency/article/`) salvo que exista una licencia
expresa para VitaMap.

---

## 10. Checklist de calidad

- [ ] La tarjeta es A o B y responde a una intención reconocible.
- [ ] No existe ya otra tarjeta equivalente en el lote.
- [ ] El frontmatter contiene solo campos compatibles con VitaMap.
- [ ] `source_kind` y `source_type` corresponden al documento real.
- [ ] `rights_status` refleja derechos comprobados.
- [ ] La fuente no prohíbe derivados, embeddings, indexación o uso en RAG.
- [ ] `source_url` apunta a la fuente principal real y vigente.
- [ ] `publication_date` coincide con la fecha indicada por la fuente.
- [ ] Cada afirmación importante puede comprobarse en una fuente declarada.
- [ ] Los rangos aparecen solo si la fuente los publica y están atribuidos.
- [ ] No contiene diagnósticos ni recomendaciones de tratamiento o dosis.
- [ ] No mezcla interpretación, hábitos, curiosidad y tradición.
- [ ] Incluye 3–5 limitaciones honestas.
- [ ] Incluye `## Fuente principal` con cita y URL.

---

## 11. Formato de entrega

Antes de cada documento indica:

```text
Tarjeta: A · Interpretación
Preguntas que pretende responder:
- ¿Qué mide la glucosa en ayunas?
- ¿Cómo se interpreta de forma general?
```

Después entrega un bloque de código Markdown con el archivo completo.

Nombres:

```text
[tema]-interpretacion-[fuente].md
[tema]-alimentacion-factores-[fuente].md
```

Usa minúsculas, sin tildes y con guiones en el nombre del archivo.
