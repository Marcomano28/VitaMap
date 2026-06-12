# Brief de investigación — Tarjeta de enriquecimiento de VitaMap

## 1. Función

Las tarjetas A y B del corpus principal responden "¿qué significa mi valor?" y
"¿qué factores se relacionan con él?". Este brief produce una tercera tarjeta:
una curiosidad científica que ayuda a comprender el tema y hace la conversación
más amena.

**Objetivo:** despertar interés por la salud sin sacrificar precisión y
permitir que personas cercanas a sistemas tradicionales encuentren sus fuentes
más sólidas, no versiones comerciales o de moda.

**Principio rector:**

> La ciencia y las tradiciones se describen con sus propias fuentes y lenguajes.
> VitaMap no convierte una tradición en ciencia ni reduce la tradición a una
> curiosidad. Una coincidencia entre marcos no constituye confirmación
> científica ni equivalencia conceptual.

**Postura editorial — figura y fondo:**

> La figura no debe pelearse con el fondo. La biomedicina conserva el primer
> plano cuando la pregunta es clínica; la tradición conserva profundidad,
> lenguaje y contexto cuando la pregunta es histórica, filosófica o cultural.

No lleves a T1 o T2 la actitud de un evaluador clínico que busca aprobar o
rechazar cada concepto. En esas capas, el rigor consiste en verificar el texto,
la edición, la traducción, el periodo, la escuela y las interpretaciones
académicas. La eficacia, la exactitud diagnóstica y los parámetros clínicos se
evalúan en T3.

La conversación debe:

1. permitir que el concepto tradicional se explique primero dentro de su propio
   sistema;
2. distinguir después texto clásico, comentario, práctica posterior,
   reinterpretación moderna y publicidad;
3. señalar anacronismos sin convertirlos en burla o descalificación global;
4. presentar el debate mediante filología, historia de la medicina,
   antropología, filosofía, estudios religiosos y tesis académicas;
5. proponer caminos de lectura cuando la comparación sea sugerente pero no
   concluyente.

VitaMap no necesita negar la tradición para proteger la precisión clínica. La
protege evitando equivalencias falsas y reservando las conclusiones clínicas
para fuentes y métodos capaces de sostenerlas.

---

## 2. Lugar dentro de las tres tarjetas

| Tarjeta | Propósito | Brief |
|---|---|---|
| **A · Interpretación** | Entender el marcador y sus referencias generales | Brief principal |
| **B · Alimentación y factores** | Comprender factores cotidianos relacionados | Brief principal |
| **C · Curiosidad científica** | Descubrir un mecanismo o dato memorable | Este brief |

No es obligatorio producir una tarjeta C para cada tema. Debe existir solo
cuando haya un dato científicamente sólido, relevante y distinto de A y B.

Los documentos tradicionales son capas adicionales y explícitas. No forman
parte automáticamente del trío y no deben producirse para completar una cuota.
Su presencia en el corpus no implica que deban aparecer en todas las respuestas:
la recuperación podrá priorizarlos cuando la persona solicite esa tradición o
active una comparación.

Cuando aparezcan, no deben funcionar como un apéndice constantemente corregido
por la tarjeta biomédica. T1 presenta la voz textual; T2 abre su historia,
variantes y discusión académica; T3 responde únicamente a la pregunta moderna
que pueda evaluarse. Juntas forman una composición, no un juicio.

T1 y T2 pueden recuperarse sin añadir inmediatamente T3 cuando la consulta sea
histórica, textual o filosófica. Incorpora T3 cuando la persona pregunte por
eficacia, seguridad, mecanismos modernos o comparación clínica, no como una
refutación automática de cada concepto tradicional.

Para acupuntura usa el brief especializado
`PROMPT-INVESTIGACION-RAG-ACUPUNTURA.md`. La acupuntura añade nomenclatura de
puntos, procedimientos y riesgos que requieren reglas propias.

---

## 3. Ciencia actualizada y trazable

- Prioriza fuentes vigentes y reputadas.
- En hechos fisiológicos estables puede usarse una fuente institucional más
  antigua si sigue siendo la referencia oficial.
- `publication_date` debe ser la fecha real de publicación o última revisión
  indicada por la fuente, no el año de consulta.
- Evita titulares sensacionalistas, marketing de suplementos y conclusiones
  basadas en un único estudio pequeño.
- Refleja la incertidumbre cuando la investigación sea preliminar o mixta.
- No completes huecos de memoria. Toda afirmación importante debe poder
  localizarse en una fuente declarada.
- Comprueba los derechos de la página concreta. No uses artículos de la
  A.D.A.M. Medical Encyclopedia de MedlinePlus (`/ency/article/`): son contenido
  licenciado y no permiten su ingestión en sistemas RAG sin autorización.
- Si una fuente prohíbe derivados, indexación, minería, embeddings o uso en
  sistemas de IA/RAG, descártala como fuente de ingestión y busca una alternativa
  permitida. Puedes conservar sus metadatos como orientación bibliográfica si
  las condiciones permiten citarla.

---

## 4. Tarjeta C — Curiosidad científica

### Preguntas que puede responder

- "¿Por qué la vitamina D se comporta como una hormona?"
- "¿Por qué la vitamina C mejora la absorción del hierro vegetal?"
- "¿Por qué el magnesio participa en tantas reacciones?"

### Estructura

```markdown
# [Tema en forma de gancho preciso]

## El dato
Una sola idea memorable, planteada sin exageración.

## Por qué ocurre
Explicación científica accesible.

## Qué se sabe y qué no
Grado de certeza y límites.

## Fuente principal
Cita y URL.
```

### Reglas

1. Cada afirmación importante debe estar respaldada por una fuente declarada.
2. Usa tono ameno, pero evita absolutismos y simplificaciones engañosas.
3. No diagnostiques ni recomiendes tratamientos, dosis o suplementos.
4. Conecta con la vida cotidiana sin convertirlo en consejo personalizado.
5. Desarrolla una sola idea memorable.
6. Debe existir una conexión temática clara con el marcador al que acompaña.
7. Longitud orientativa: 150–350 palabras.

### Frontmatter

```yaml
---
title: "Vitamina D: por qué su forma activa funciona como una hormona"
source_url: "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/"
publication_date: "2024"
source_kind: institutional-education
source_type: science-curiosity-summary
rights_status: permitted
limitations:
  - "Síntesis divulgativa; no sustituye información clínica detallada."
  - "Una curiosidad no es una recomendación de salud."
---
```

---

## 5. Dossier tradicional por capas

Cuando exista una relación históricamente defendible con el tema, puedes
producir hasta tres documentos tradicionales separados:

| Capa | Función | `source_type` |
|---|---|---|
| **T1 · Fuente clásica primaria** | Explicar qué dice realmente un texto clásico | `traditional-primary-source-summary` |
| **T2 · Contexto histórico o filológico** | Aclarar términos, variantes, evolución y recepción | `traditional-scholarly-context-summary` |
| **T3 · Evaluación científica moderna** | Resumir qué se ha investigado y con qué resultados | `traditional-evidence-review-summary` |

No mezcles T1, T2 y T3 en un mismo `.md`. La separación permite que VitaMap
filtre, compare y atribuya cada capa sin confundir autoridad textual con
evidencia clínica.

### 5.1 Auditoría de correspondencia

Antes de escribir una tarjeta tradicional, responde internamente:

1. ¿El concepto moderno aparece realmente en la fuente clásica?
2. Si no aparece, ¿existe un concepto cercano que pueda describirse sin afirmar
   que es equivalente?
3. ¿La relación procede del texto clásico, de un comentario histórico o de una
   interpretación moderna?
4. ¿Hay una edición, pasaje y referencia exactos?
5. ¿He abierto el archivo o página que contiene el pasaje, o solo una portada,
   catálogo o resultado de búsqueda?
6. ¿Puedo distinguir qué palabras pertenecen al texto base, al aparato crítico,
   a un comentario y a una traducción?

Si no existe una correspondencia históricamente defendible, no inventes una.
Entrega:

```text
No se recomienda una tarjeta tradicional primaria para este tema.
Motivo: el concepto moderno no aparece en las fuentes clásicas revisadas y la
comparación disponible parece ser una reinterpretación contemporánea. Puede
investigarse como historia de recepción o práctica moderna en una T2.
```

Por ejemplo, los textos clásicos no conocían el marcador de laboratorio LDL.
Puede ser legítimo explicar conceptos tradicionales relacionados con tejidos,
alimentación, circulación o acumulación, pero no llamarlos "LDL ayurvédico" ni
"colesterol según la MTC".

Que no exista equivalencia directa no vuelve irrelevante la comparación. Puede
abrir preguntas sobre cómo distintos sistemas clasificaron el cuerpo, la dieta,
el cambio y la enfermedad. Formula esas preguntas como comparación histórica o
conceptual, no como traducción biomédica.

### 5.2 T1 — Fuente clásica primaria

Prioriza textos fundacionales y comentarios clásicos:

- Ayurveda: *Carakasaṃhitā*, *Suśrutasaṃhitā*, *Aṣṭāṅgahṛdaya*,
  *Aṣṭāṅgasaṅgraha* y comentarios clásicos identificables.
- Medicina china y acupuntura: *Huangdi Neijing* (*Suwen* y *Lingshu*),
  *Nanjing*, *Zhenjiu Jiayi Jing* y otros clásicos con edición identificable.

No uses como fuente principal blogs, clínicas, escuelas comerciales,
influencers, tiendas de suplementos, páginas SEO ni resúmenes anónimos.

#### Mapa de búsqueda inicial

No empieces con una búsqueda genérica del concepto moderno. Busca primero la
obra, la edición y el término tradicional.

**Para Ayurveda:**

| Obra o necesidad | Primeros lugares donde buscar |
|---|---|
| *Suśrutasaṃhitā* | Suśruta Project, University of Alberta: `https://sushrutaproject1.github.io/Sushrutasamhita_Saktumiva1/`; repositorio y versiones archivadas en Zenodo enlazadas por el proyecto |
| *Carakasaṃhitā* | GRETIL, sección Ayurveda: `https://gretil.sub.uni-goettingen.de/gretil.html#Ayur`; comprueba qué capítulos contiene la transcripción |
| Otras obras sánscritas | SARIT: `https://sarit.indology.info/`; GRETIL; repositorios universitarios de indología |
| Ediciones históricas escaneadas | Internet Archive, Medical Heritage Library, Wellcome Collection y catálogos de bibliotecas universitarias |
| Historia textual o interpretación | Artículos académicos, monografías universitarias, Crossref y Google Scholar; esta búsqueda normalmente produce una T2, no una T1 |

Busca con varias grafías. Ejemplos:

```text
"Suśrutasaṃhitā" "1.15.14"
"Sushrutasamhita" "Sutrasthana 15"
site:sushrutaproject1.github.io medas "SS.1.15"
site:zenodo.org "Sushruta Project"
site:gretil.sub.uni-goettingen.de "Carakasaṃhitā" medas
"medovṛddhi" edition
"medas" "sthaulya" manuscript
```

Para cualquier otra tradición, construye la búsqueda en este orden:

1. título original y variantes de transliteración;
2. proyecto académico, universidad o biblioteca que edita o conserva la obra;
3. capítulo, verso o identificador del pasaje;
4. término en escritura original y transliteración;
5. versión, DOI, licencia y fecha de la edición digital.

Una coincidencia en el fragmento de un buscador sirve para localizar la fuente,
pero no para citarla. Abre siempre el resultado y verifica el pasaje.

#### Puerta de verificación documental

Una T1 no está lista hasta completar estas comprobaciones:

1. **Abre la fuente exacta.** Una portada de GRETIL, SARIT, Internet Archive,
   una biblioteca o un proyecto académico sirve para descubrir materiales, pero
   no demuestra que la obra o el pasaje estén allí.
2. **Identifica la unidad consultada.** Registra título de la edición o
   transcripción, editor o responsable, versión, fecha y, cuando exista, DOI,
   identificador estable o archivo concreto.
3. **Localiza el pasaje.** Usa capítulo y verso, sección o identificador interno.
   No cites solo el nombre general de la obra si la edición ofrece una referencia
   más precisa.
4. **Comprueba la capa textual.** Verifica si la frase aparece en el texto base,
   en un comentario, en el aparato crítico, en una introducción editorial o en
   una traducción. Atribúyela a esa capa exacta.
5. **Separa las obras.** Una T1 debe tener una obra clásica principal. Si la
   explicación necesita combinar varias obras o comparar sus doctrinas, crea
   otra T1 o una T2; no presentes la síntesis como si procediera de un único
   pasaje.
6. **Comprueba fecha y derechos del objeto exacto.** La licencia de un proyecto,
   repositorio o dominio no siempre es la licencia de cada edición, traducción o
   archivo. Si dos declaraciones difieren, registra la discrepancia y aplica la
   condición compatible más restrictiva.

No escribas "edición consultada", "texto verificado" o equivalentes si solo has
visto una referencia secundaria. Si no puedes abrir y verificar el pasaje,
entrega la tarjeta como `metadata-only` o indica que no se recomienda publicarla.

#### Estructura

```markdown
# [Concepto] en [tradición] según [obra]

## Texto y procedencia
Identifica obra, sección, capítulo o verso, lengua original, edición utilizada
y datación aproximada de la composición. Añade editor o responsable, versión,
estado editorial —por ejemplo, edición crítica o colación provisional— y DOI o
identificador estable cuando existan. Distingue la fecha antigua de la fecha de
la edición moderna.

## Términos originales
Incluye los términos relevantes en escritura original y transliteración, con
una traducción breve y prudente. Una traducción no debe ocultar ambigüedades.

## Significado dentro de su sistema
Explica el concepto desde la lógica interna del texto, sin traducirlo
automáticamente a fisiología moderna.

## Matices textuales
Ambigüedades, variantes, problemas de traducción y relación con comentarios o
pasajes próximos.

## Relación posible con la pregunta moderna
Describe semejanzas o diferencias como comparación editorial, nunca como
equivalencia ni validación.

## Para seguir leyendo
Ediciones, comentarios o estudios académicos que permitan profundizar en el
concepto y su recepción.

## Fuente primaria
Edición o corpus, responsable, versión, referencia exacta, URL profunda al
pasaje o archivo y DOI o identificador estable cuando exista.
```

#### Frontmatter

```yaml
---
title: "Ayurveda clásico: [concepto] en [obra]"
source_url: "https://URL-EXACTA-DE-LA-EDICION-O-PASAJE"
doi: "DOI-DE-LA-VERSION-SI-EXISTE"
publication_date: "AAAA-MM-DD"
source_kind: tradition-context
source_type: traditional-primary-source-summary
rights_status: unknown
limitations:
  - "Describe un concepto de un texto médico clásico, no una entidad biomédica moderna."
  - "Indica el estado editorial y las limitaciones de la versión consultada."
  - "No establece equivalencias con biomarcadores o diagnósticos modernos."
  - "No ofrece una recomendación terapéutica."
---
```

Sustituye todos los marcadores por datos comprobados. Elimina `doi` si no
existe; no inventes uno ni conserves texto de ejemplo. Mantén `rights_status:
unknown` hasta comprobar los derechos y cámbialo solo cuando la licencia o el
permiso de la versión concreta lo justifique. Un documento `unknown` no está
listo para publicación.

En `publication_date` usa la fecha de la edición o transcripción consultada. La
datación aproximada del texto antiguo se explica en el cuerpo. No uses `s.f.`,
`sin fecha`, `n.d.` ni la fecha de composición antigua en este campo: si no
puedes comprobar una fecha válida en formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`,
omite el campo y mantén el documento como borrador. Verifica los derechos de la
edición digital concreta: que una obra antigua sea de dominio público no
convierte automáticamente una traducción, edición crítica o transcripción
moderna en contenido reutilizable.

Si traduces directamente una expresión antigua, identifícala como traducción
editorial o tentativa de VitaMap. No presentes una traducción propia como cita
publicada por la edición consultada.

Los límites y anacronismos deben estar presentes, pero no tienen que dominar la
tarjeta. T1 debe permitir comprender qué dice el texto y por qué el concepto
ocupa un lugar en ese sistema antes de explicar qué comparación moderna sería
impropia.

### 5.3 T2 — Contexto histórico o filológico

Esta capa explica cómo especialistas interpretan el término o cómo cambió entre
textos, comentarios y práctica posterior.

Fuentes válidas:

- ediciones críticas;
- historia de la medicina publicada por universidades;
- artículos filológicos o históricos revisados por pares;
- catálogos y corpus académicos con procedencia editorial;
- antropología, filosofía, historia de la ciencia, estudios religiosos y tesis
  universitarias pertinentes.

No uses T2 para introducir opiniones de divulgadores actuales como si fueran la
interpretación tradicional dominante.

#### Estructura

```markdown
# [Concepto tradicional]: contexto histórico y variantes

## Fuente estudiada
Obra, pasaje y tradición textual.

## Cómo se ha interpretado
Resumen de la discusión histórica o filológica.

## Variantes y desacuerdos
Diferencias entre ediciones, comentarios, escuelas o traducciones.

## Encuentro con preguntas actuales
Qué ilumina la comparación, dónde deja de ser útil y qué sería anacrónico.

## Debate académico
Interpretaciones relevantes, preguntas abiertas y desacuerdos entre
especialistas.

## Para profundizar
Artículos, monografías, ediciones o tesis, indicando brevemente qué perspectiva
aporta cada referencia.

## Fuente principal
Cita académica y URL, DOI o referencia verificable.
```

### 5.4 T3 — Evaluación científica moderna

Esta capa evalúa prácticas, productos o afirmaciones tradicionales mediante
fuentes como NCCIH, revisiones sistemáticas o consensos científicos. No habla en
nombre de la tradición y no sustituye a T1.

Aquí sí corresponde la exigencia metodológica clínica: definir intervención,
preparación, población, comparador, desenlace, magnitud, seguridad y certeza. T3
no debe utilizarse para calificar el valor histórico, filosófico o cultural de
T1 y T2.

#### Estructura

```markdown
# [Práctica o afirmación tradicional]: evaluación científica actual

## Qué se ha investigado
Define con precisión la intervención, población y resultado estudiados.

## Qué muestran los estudios
Resultados favorables, negativos, mixtos o inconclusos y grado de certeza.

## Seguridad y límites
Riesgos, interacciones y problemas de calidad de la evidencia.

## Lectura equilibrada
Diferencia entre plausibilidad, asociación y eficacia clínica; qué permanece
abierto y qué investigación ayudaría a aclararlo.

## Estudios para profundizar
Revisiones, ensayos, registros o tesis pertinentes, con una nota breve sobre su
aportación y sus límites.

## Fuente principal
Cita y URL.
```

Usa `source_kind: tradition-context` y
`source_type: traditional-evidence-review-summary`.

Si existen resultados discrepantes, presenta los relevantes en ambas
direcciones y explica las diferencias de método. No conviertas "evidencia
insuficiente" en "la tradición es falsa", ni un resultado favorable en
validación global del sistema tradicional.

---

## 6. Jerarquía de fuentes

### Para T1 y T2

1. Edición crítica o corpus académico con referencia de pasaje.
2. Facsímil o edición histórica en dominio público.
3. Traducción académica con derechos compatibles.
4. Comentario clásico identificable.
5. Estudio histórico o filológico revisado por pares.

Recursos académicos útiles para descubrir y verificar textos incluyen SARIT y
GRETIL para obras sánscritas. Son puntos de descubrimiento, no prueba automática
de que una obra concreta esté incluida. Su presencia en un corpus académico no
sustituye abrir el archivo, verificar el pasaje y comprobar la licencia de cada
transcripción o edición.

### Para T3

| Fuente | Ideal para |
|---|---|
| NCCIH | Evaluación científica de prácticas y productos complementarios |
| NIH Office of Dietary Supplements | Vitaminas, minerales y mecanismos |
| MedlinePlus | Divulgación sanitaria institucional |
| Revisiones sistemáticas identificadas en PubMed | Estado de la evidencia |
| Sociedades científicas | Consensos y mecanismos de su especialidad |

Una página periodística o divulgativa puede ayudar a descubrir un tema, pero no
debe ser fuente principal de T1, T2 o T3.

Una publicación académica con derechos cerrados puede incluirse como referencia
bibliográfica —título, autor, fecha, DOI y descripción breve— sin incorporar su
texto al RAG. La tarjeta publicable debe seguir apoyándose en una edición o
fuente principal con derechos compatibles.

---

## 7. Checklist de calidad

- [ ] Es una tarjeta C, T1, T2 o T3; no mezcla sus funciones.
- [ ] Aporta una intención distinta de las tarjetas A y B.
- [ ] No existe ya una tarjeta equivalente en el lote.
- [ ] `source_kind` y `source_type` corresponden al documento real.
- [ ] La fuente es vigente y reputada.
- [ ] La fuente principal permite el uso declarado y no prohíbe RAG o embeddings.
- [ ] `publication_date` coincide con la fecha indicada por la fuente.
- [ ] Cada afirmación importante está respaldada por una fuente declarada.
- [ ] No contiene diagnósticos, tratamientos ni dosis.
- [ ] La incertidumbre está expresada con claridad.
- [ ] En T1 se identifica obra, pasaje, lengua y edición.
- [ ] La URL conduce a la edición, archivo o pasaje real, no solo a una portada.
- [ ] Se ha comprobado que cada pasaje citado existe en la fuente declarada.
- [ ] Se distinguen texto base, comentario, aparato crítico y traducción.
- [ ] La tarjeta tiene una sola obra clásica principal; las comparaciones entre
      obras se han separado en otra T1 o una T2.
- [ ] Se registra versión y estado editorial cuando la edición es dinámica o
      provisional.
- [ ] En T1 se explica qué no dice el texto y se evitan equivalencias anacrónicas.
- [ ] T1 explica primero el concepto dentro de su sistema y deja espacio a sus
      matices antes de marcar límites modernos.
- [ ] En T2 se distinguen interpretaciones, variantes y desacuerdos.
- [ ] T2 presenta el encuentro ciencia-tradición como debate académico, no como
      enfrentamiento ni equivalencia.
- [ ] En T3 se describe la calidad y los límites de la evidencia moderna.
- [ ] T3 incluye resultados relevantes favorables, negativos o inconclusos sin
      emitir un juicio global sobre la tradición.
- [ ] Se ofrecen ediciones, artículos, monografías o tesis para profundizar
      cuando existan.
- [ ] Las fuentes comerciales pueden estudiarse como recepción contemporánea,
      pero nunca actúan como autoridad textual, histórica o clínica.
- [ ] Una obra antigua no se confunde con una traducción moderna ni con sus derechos.
- [ ] Incluye 2–4 limitaciones honestas.

---

## 8. Formato de entrega

Antes de cada documento indica:

```text
Tarjeta: C · Curiosidad científica
Pregunta que pretende responder:
- ¿Por qué la forma activa de la vitamina D funciona como una hormona?
```

Después entrega un bloque de código Markdown con el archivo completo.

Nombres:

```text
[tema]-curiosidad-[gancho]-[fuente].md
[tema]-[tradicion]-fuente-clasica-[obra].md
[tema]-[tradicion]-contexto-historico-[fuente].md
[tema]-[tradicion]-evaluacion-cientifica-[fuente].md
```

Usa minúsculas, sin tildes y con guiones en el nombre del archivo.
