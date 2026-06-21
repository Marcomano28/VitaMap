# Brief de investigación — Corpus de acupuntura de VitaMap

## 1. Propósito

VitaMap quiere conservar conocimiento riguroso sobre acupuntura sin reducirlo
a publicidad contemporánea ni presentarlo como equivalente automático de la
biomedicina.

El corpus debe permitir responder preguntas como:

- "¿Cómo describen los textos clásicos los canales y puntos?"
- "¿De dónde procede este concepto de la medicina china?"
- "¿Qué significa el nombre tradicional de un punto?"
- "¿Qué se ha investigado sobre acupuntura para una condición concreta?"
- "¿Qué riesgos y límites tiene la práctica?"
- "¿En qué coinciden y divergen la explicación clásica y la investigación
  moderna?"

**Principio rector:**

> La fuente clásica, la estandarización moderna, la evaluación científica y la
> seguridad son capas distintas. Ninguna debe hablar en nombre de las otras.

---

## 2. La acupuntura no se organiza por cada biomarcador

No generes automáticamente una tarjeta de acupuntura para LDL, TSH, creatinina
o cualquier otro resultado de laboratorio.

La acupuntura clásica no fue construida alrededor de biomarcadores modernos.
Su corpus debe organizarse principalmente por:

- conceptos clásicos;
- síntomas y patrones descritos por la tradición;
- condiciones modernas estudiadas;
- historia y nomenclatura;
- seguridad.

Si recibes un biomarcador como tema, realiza primero una auditoría:

1. ¿Existe una referencia clásica directa? Normalmente no.
2. ¿Existe solo una comparación moderna o una reinterpretación comercial?
3. ¿Hay investigación clínica específica sobre acupuntura y ese resultado?
4. ¿La asociación es suficientemente sólida para justificar una tarjeta?

Si no existe una relación defendible, responde:

```text
No se recomienda una tarjeta de acupuntura para este biomarcador.
La relación encontrada es indirecta, moderna o insuficientemente documentada.
```

No inventes expresiones como "punto para bajar el LDL" o "meridiano del
colesterol".

---

## 3. Cuatro capas documentales

Cada `.md` debe pertenecer a una sola capa:

| Capa | Función | `source_kind` | `source_type` |
|---|---|---|---|
| **AC1 · Fuente clásica** | Qué dice un texto histórico identificable | `tradition-context` | `acupuncture-primary-source-summary` |
| **AC2 · Nomenclatura y evolución** | Términos, puntos, canales y estandarización moderna | `tradition-context` | `acupuncture-terminology-summary` |
| **AC3 · Evidencia por indicación** | Investigación sobre una condición concreta | `tradition-context` | `acupuncture-evidence-review-summary` |
| **AC4 · Seguridad** | Riesgos, límites y cualificación profesional | `institutional-education` | `acupuncture-safety-summary` |

No mezcles las cuatro capas en un mismo archivo. Esta separación permitirá
aplicar filtros de procedencia y prioridad después.

Todo documento debe incluir este frontmatter mínimo:

```yaml
---
title: "Título verificable"
source_url: "https://URL-REAL-DE-LA-FUENTE"
source_language: en
source_jurisdiction:
  - US
publication_date: "AAAA-MM-DD"
source_kind: tradition-context
source_type: acupuncture-evidence-review-summary
rights_status: unknown
facets_version: 1
tarjeta_id: acupuntura-conceptos-acupuntura-evidencia-nauseas-vomitos-nccih
dominio: tradiciones-practicas
tipo:
  - intervencion
marker:
  - acupuntura
sistema:
  - neurologico-cognitivo
  - digestivo
area_de_salud:
  - salud-digestiva
  - estado-animo-estres
tradicion: acupuntura
seccion: evidencia
alias:
  - acupuntura
  - neiguan
  - pc6
limitations:
  - "Límite específico de esta fuente y de esta tarjeta."
---
```

Sustituye todos los marcadores por datos reales. No conserves URL, fechas,
títulos ni limitaciones de ejemplo. Usa exactamente la combinación
`source_kind`/`source_type` asignada a la capa en la tabla anterior. AC4 es la
excepción y usa `source_kind: institutional-education`.

Usa `corpus-preparation/corpus-taxonomy.json` como vocabulario canónico. Si el
topic o marker falta, propón primero la entrada de taxonomía. Para acupuntura,
`tradicion: acupuntura` es apropiado cuando la tarjeta pertenece al marco de
acupuntura. Mapeo habitual:

| Capa | `seccion` |
|---|---|
| AC1 · Fuente clásica | `tradicion` |
| AC2 · Nomenclatura y evolución | `tradicion` |
| AC3 · Evidencia por indicación | `evidencia` |
| AC4 · Seguridad | `seguridad` |

---

## 4. AC1 — Fuente clásica

### Fuentes preferentes

Prioriza obras y comentarios históricos identificables, por ejemplo:

- *Huangdi Neijing Suwen*;
- *Huangdi Neijing Lingshu*;
- *Nanjing* o *Clásico de las dificultades*;
- *Zhenjiu Jiayi Jing*;
- comentarios clásicos con autor, obra y fecha identificables.

No uses como fuente primaria:

- blogs o clínicas;
- manuales comerciales modernos;
- escuelas que presentan su interpretación como la única tradición;
- páginas SEO;
- tiendas, marcas o vendedores de formación;
- resúmenes sin referencia de capítulo o pasaje.

### Claves de búsqueda inicial

Busca primero por el título y los términos originales, no por una equivalencia
biomédica moderna.

Variantes útiles:

| Obra | Búsquedas iniciales |
|---|---|
| *Huangdi Neijing Suwen* | `黃帝內經素問`, `黄帝内经素问`, `Huangdi Neijing Suwen` |
| *Lingshu* | `靈樞`, `灵枢`, `Huangdi Neijing Lingshu` |
| *Nanjing* | `難經`, `难经`, `Huangdi Bashiyi Nanjing` |
| *Zhenjiu Jiayi Jing* | `針灸甲乙經`, `针灸甲乙经`, `Zhenjiu Jiayi Jing` |

Combina esas variantes con:

```text
critical edition
digital edition
manuscript
chapter
translation
site:edu
site:ac.uk
site:org filetype:pdf
DOI
license
```

Empieza por proyectos universitarios de historia de la medicina, catálogos de
bibliotecas nacionales o universitarias, facsímiles institucionales y ediciones
académicas. Internet Archive, Wellcome Collection y Chinese Text Project pueden
ayudar a descubrir materiales, pero comprueba que la obra, edición y pasaje
concretos estén realmente incluidos y que sus derechos sean compatibles.

Ejemplos:

```text
"黃帝內經素問" critical edition
"靈樞" chapter manuscript
"針灸甲乙經" digital edition
"Huangdi Neijing Lingshu" university
"Zhenjiu Jiayi Jing" DOI
```

No busques `"punto para [enfermedad]"` para construir una AC1: esa formulación
suele conducir a clínicas, formación comercial o reinterpretaciones modernas.

### Verificación documental obligatoria

Antes de redactar una AC1:

1. abre la edición o transcripción que contiene el pasaje;
2. usa una URL profunda al archivo o pasaje, no solo la portada del corpus;
3. registra responsable editorial, versión, fecha y estado de la edición;
4. comprueba si la afirmación pertenece al texto base, a un comentario, al
   aparato crítico o a una traducción;
5. no combines pasajes de varias obras como si fueran una única fuente;
6. verifica la licencia de la edición o traducción concreta.

Si el pasaje no puede verificarse directamente, no presentes el documento como
AC1 listo para el RAG. Devuelve una referencia `metadata-only` o explica por qué
no se recomienda publicarlo.

### Estructura

```markdown
# [Concepto] en [obra clásica]

## Texto y procedencia
Obra, capítulo o pasaje, lengua, edición utilizada, responsable, versión,
estado editorial y datación aproximada.

## Términos originales
Caracteres chinos, pinyin o transliteración y traducción prudente.

## Significado dentro del texto
Explica el concepto según la lógica de la obra y su contexto histórico.

## Variantes o problemas de traducción
Diferencias relevantes entre ediciones, comentarios o traducciones.

## Lo que el texto no dice
Anacronismos que deben evitarse y conceptos modernos que no aparecen.

## Fuente primaria
Edición, pasaje exacto, URL profunda y DOI o identificador estable cuando
exista.
```

### Frontmatter

> **Contrato mínimo de evidencia (v0).** Aplica además el bloque `evidence` y el
> `relacionado_con[].direccion` de `PROMPT-INVESTIGACION-RAG.md` §3 bis. El bloque
> `evidence` (con `certeza`) es obligatorio en tarjetas con afirmación de eficacia
> o seguridad (AC3 evidencia por indicación, AC4 seguridad); en AC1 (fuente
> clásica) y AC2 (nomenclatura) puede omitirse. `relacionado_con[].id` es un
> **marcador canónico**, no la clave de topic.

```yaml
---
title: "Acupuntura clásica: [concepto] en el Lingshu"
source_url: "https://URL-REAL-DEL-ARCHIVO-O-PASAJE"
source_language: zh
source_jurisdiction:
  - CN
publication_date: "AAAA"
source_kind: tradition-context
source_type: acupuncture-primary-source-summary
rights_status: unknown
facets_version: 1
tarjeta_id: acupuntura-conceptos-acupuntura-fuente-clasica-canales-lingshu
dominio: tradiciones-practicas
tipo:
  - intervencion
marker:
  - acupuntura
sistema:
  - neurologico-cognitivo
  - digestivo
area_de_salud:
  - salud-digestiva
  - estado-animo-estres
tradicion: acupuntura
seccion: tradicion
alias:
  - acupuntura
  - meridianos
  - canales
limitations:
  - "Describe un texto médico histórico y su marco conceptual."
  - "No convierte sus términos en anatomía o fisiología moderna."
  - "Las traducciones y la datación pueden ser objeto de debate académico."
  - "No ofrece instrucciones de tratamiento ni de punción."
---
```

`publication_date` corresponde a la edición o transcripción consultada. La
datación histórica de la obra se explica en el cuerpo. No uses `s.f.`, `n.d.` ni
una fecha antigua estimada como fecha de publicación. Si no puedes verificar una
fecha válida, omite el campo y mantén la tarjeta como borrador.

---

## 5. AC2 — Nomenclatura y evolución

Esta capa ayuda a comprender nombres, códigos y cambios históricos sin
convertirse en un manual práctico de punción.

Puede cubrir:

- nombre tradicional de un punto;
- caracteres y pronunciación;
- código estandarizado moderno;
- obra o época en la que aparece;
- diferencias entre tradiciones o nomenclaturas;
- relación entre nombre tradicional y localización estandarizada.

Usa estándares institucionales, corpus académicos y estudios históricos. La
normalización de un nombre o localización por una organización moderna no
demuestra la existencia anatómica de canales ni la eficacia terapéutica del
punto.

### Estructura

```markdown
# [Punto o concepto]: nombre y procedencia

## Nombre tradicional
Caracteres, pinyin, traducciones posibles y variantes.

## Procedencia histórica
Textos o comentarios donde aparece.

## Nomenclatura moderna
Código y terminología estandarizados, con la fuente correspondiente.

## Qué estandariza y qué no
Aclara que normalizar nombres y localizaciones no valida mecanismos ni usos.

## Fuente principal
Cita y URL.
```

No incluyas profundidad, ángulo, técnica de inserción, manipulación de agujas,
electroestimulación ni combinaciones terapéuticas de puntos.

---

## 6. AC3 — Evidencia por indicación

Un documento AC3 cubre **una sola condición o resultado clínico estudiado**.
No prepares listas generales de enfermedades supuestamente tratables.

Ejemplos de intención:

- "¿Qué se sabe sobre acupuntura y dolor lumbar?"
- "¿Qué se sabe sobre acupuntura y migraña?"
- "¿Qué se sabe sobre acupuntura y náuseas asociadas a tratamientos?"

### Fuentes preferentes

1. Evaluaciones institucionales como NCCIH.
2. Guías clínicas formales.
3. Revisiones sistemáticas y metaanálisis.
4. Ensayos primarios solo cuando no exista síntesis mejor y se presente como
   evidencia preliminar.

### Estructura

```markdown
# Acupuntura para [condición]: estado de la evidencia

## Qué se estudió
Población, intervención, comparación y resultados medidos.

## Qué muestran los estudios
Resultados, tamaño aproximado del efecto y calidad de la evidencia cuando la
fuente los publique.

## Comparación con acupuntura simulada o ausencia de tratamiento
Distingue ambos comparadores. No los combines como si respondieran lo mismo.

## Incertidumbres
Heterogeneidad de técnicas, sesgo, tamaño de estudios y duración del seguimiento.

## Qué no permite concluir
No generalices a otras condiciones ni conviertas una posibilidad en eficacia
demostrada.

## Fuente principal
Cita y URL.
```

### Reglas críticas

- Distingue `acupuntura frente a ninguna intervención` de `acupuntura frente a
  procedimiento simulado`.
- No uses "funciona" si la fuente dice "puede ayudar".
- No extrapoles evidencia de dolor a enfermedades metabólicas, cáncer,
  fertilidad u otras condiciones.
- No conviertas una inclusión condicional en una guía en recomendación universal.
- No redactes pautas, frecuencia de sesiones ni selección de puntos.

---

## 7. AC4 — Seguridad

La seguridad merece documentos propios y procedencia institucional.

Puede cubrir:

- riesgos generales;
- importancia de agujas estériles y de un solo uso;
- complicaciones por ejecución incorrecta;
- diferencia entre práctica profesional y autoaplicación;
- límites de la información educativa;
- necesidad de no retrasar atención sanitaria.

NCCIH indica que una aplicación incorrecta puede causar infecciones, lesión de
órganos y daño del sistema nervioso central. No minimices estos riesgos porque
las complicaciones notificadas sean poco frecuentes.

### Estructura

```markdown
# Acupuntura: seguridad y límites generales

## Riesgos conocidos
Descripción clara y no alarmista.

## Factores de seguridad
Formación profesional, material estéril y contexto asistencial.

## Lo que VitaMap no proporciona
No ofrece instrucciones de punción, selección de puntos ni supervisión clínica.

## Cuándo la información no basta
No usar la acupuntura para retrasar una valoración sanitaria necesaria.

## Fuente principal
Cita y URL.
```

---

## 8. Límites de seguridad inviolables

Los documentos de VitaMap no deben incluir:

- instrucciones para insertar agujas;
- profundidad o ángulo de inserción;
- localizaciones descritas como guía de autoaplicación;
- técnicas de manipulación;
- intensidad o frecuencia de electroacupuntura;
- protocolos o recetas de puntos;
- recomendaciones personalizadas;
- instrucciones para embarazo, anticoagulación o enfermedades concretas;
- afirmaciones de que la acupuntura sustituye diagnóstico o tratamiento.

Puede describirse históricamente que una fuente asocia un punto con un uso,
pero siempre como atribución textual y nunca como instrucción.

---

## 9. Derechos y trazabilidad

- Una obra clásica puede estar en dominio público, pero una traducción,
  transcripción, edición crítica, fotografía o base digital moderna puede tener
  derechos propios.
- Verifica la licencia de la versión concreta.
- Si solo se permite enlazar o citar brevemente, usa `rights_status:
  metadata-only` y no entregues un cuerpo destinado al RAG.
- No uses traducciones modernas sin permiso.
- Registra siempre obra, edición, traductor o editor, capítulo o pasaje y URL.
- No atribuyas a la tradición una afirmación encontrada únicamente en una
  interpretación contemporánea.

---

## 10. Checklist

- [ ] La tarjeta es AC1, AC2, AC3 o AC4 y no mezcla capas.
- [ ] Existe una intención de consulta clara.
- [ ] No se fuerza una relación con un biomarcador moderno.
- [ ] La fuente es primaria, institucional o académica según la capa.
- [ ] Se identifica el pasaje exacto en AC1.
- [ ] Se distinguen traducción, comentario y texto original.
- [ ] AC2 no convierte estandarización en validación científica.
- [ ] AC3 cubre una sola indicación y distingue los comparadores.
- [ ] AC4 describe riesgos sin ofrecer instrucciones prácticas.
- [ ] No hay recetas de puntos, dosis de sesiones ni técnica de punción.
- [ ] Los derechos de la edición concreta están comprobados.
- [ ] El frontmatter es compatible con VitaMap.
- [ ] `marker`, `seccion`, `tradicion`, `sistema`, `area_de_salud` y `alias` siguen la taxonomía.
- [ ] Las limitaciones explican procedencia, incertidumbre y alcance.

---

## 11. Formato de entrega

Antes de cada documento indica:

```text
Capa: AC3 · Evidencia por indicación
Pregunta que pretende responder:
- ¿Qué muestra la investigación sobre acupuntura y dolor lumbar?
```

Después entrega un bloque Markdown completo.

Nombres:

```text
acupuntura-fuente-clasica-[concepto]-[obra].md
acupuntura-terminologia-[punto-o-concepto]-[fuente].md
acupuntura-evidencia-[condicion]-[fuente].md
acupuntura-seguridad-[fuente].md
```

Usa minúsculas, sin tildes y con guiones en el nombre del archivo.
