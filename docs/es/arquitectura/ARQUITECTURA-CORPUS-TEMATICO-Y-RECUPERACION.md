# Arquitectura del corpus temático y evolución de la recuperación

Versión 0.3 · 2026-07-11
Estado: documento editorial y técnico activo · revisión figura-fondo y grafo

## 1. Propósito

Este documento resume las decisiones tomadas durante la preparación del primer
corpus real de VitaMap:

- cómo organizar el conocimiento alrededor de un tema concreto;
- qué ángulos deben vivir en documentos separados;
- cómo distinguir conocimiento biomédico, curiosidad científica y tradición;
- cómo investigar, verificar, revisar y publicar cada tarjeta;
- cómo funciona actualmente la recuperación con QMD;
- qué limitaciones tiene el sistema presente;
- qué mejoras conviene introducir a medida que crezcan el corpus y el número de
  usuarios.

No sustituye a:

- `docs/es/arquitectura/QMD-EVOLUCION-VITAMAP.md`, que gobierna la integración técnica de QMD;
- `docs/es/arquitectura/DECISIONS.md`, que registra las decisiones arquitectónicas;
- los briefs de `corpus-preparation/`, que sirven para producir las tarjetas.

Su función es conectar esas piezas en un modelo editorial común.

## 1.1 Principio de producto: GPS de analíticas

VitaMap nace para ayudar a una persona común a comprender un conjunto de
analíticas sin perderse entre indicadores aislados. La metáfora operativa es un
**GPS de salud** o una **cabina de instrumentos explicada**:

- los valores son señales medibles;
- los paneles organizan instrumentos que conviene leer juntos;
- las relaciones muestran qué añade contexto, qué modifica una interpretación y
  qué pertenece al mismo sistema;
- la memoria personal permite situar la evolución y el contexto;
- el RAG recupera explicaciones, límites y fuentes;
- la interfaz muestra primero lo necesario para dar el siguiente paso, no todo el
  grafo a la vez.

La **analítica biomédica es la figura por defecto** porque el punto de partida
del producto son datos medibles y preguntas clínicas o educativas sobre esos
datos.

Las tradiciones constituyen un **fondo complementario con identidad y
continuidad propias**. No son una traducción antigua de la analítica ni una
capa decorativa. Pueden adquirir foco local cuando la persona pide explícitamente
una perspectiva tradicional o una comparación, pero no desplazan la prioridad
clínica del producto ni heredan el nivel de evidencia de la biomedicina.

Fórmula de diseño:

> **Prioridad estable, foco adaptable.**  
> Analítica como figura por defecto; tradiciones como fondo autónomo y opcional;
> comparación sin equivalencia.

## 2. Decisión central

> Un tema no se representa mediante un documento enciclopédico ni mediante
> cientos de respuestas prefabricadas. Se representa como un dossier lógico de
> tarjetas independientes, cada una centrada en una intención recuperable.

Por ejemplo, "colesterol LDL" no es una única unidad informativa. Una persona
puede estar preguntando:

- qué significa su resultado;
- qué factores de alimentación y estilo de vida se relacionan con él;
- por qué el organismo utiliza lipoproteínas;
- qué dice una fuente clásica ayurvédica sobre un concepto temáticamente
  cercano;
- qué ha investigado la ciencia moderna sobre una práctica tradicional;
- cuáles son los límites de cualquier comparación.

Estas preguntas necesitan fuentes, lenguaje y cautelas diferentes. Mezclarlas
en un único documento reduce la precisión de la recuperación y aumenta el riesgo
de que una fuente hable con una autoridad que no le corresponde.

## 3. Dossier lógico por tema

### 3.1 La unidad física sigue siendo el Markdown

Cada tarjeta es un archivo `.md` con:

1. frontmatter YAML para procedencia, clasificación y revisión;
2. un cuerpo Markdown centrado en una intención principal;
3. una o varias formulaciones de la pregunta que pretende responder;
4. límites explícitos sobre lo que la fuente no permite concluir.

El dossier es una agrupación conceptual. No requiere que todos los archivos
vivan en una carpeta especial ni que el usuario vea una jerarquía de carpetas.
QMD indexa el contenido; la relación entre tarjetas se conserva mediante
títulos coherentes y, más adelante, metadatos temáticos.

### 3.2 Ángulos biomédicos básicos

Para un marcador, panel o concepto clínico pueden existir hasta cinco tipos de
tarjeta biomédica:

| Tarjeta | Intención | Ejemplo para LDL | `source_type` |
|---|---|---|---|
| **A · Interpretación** | Qué mide y cómo se interpreta de forma general | "¿Qué significa mi LDL?" | `lab-interpretation-summary` |
| **B · Alimentación y estilo de vida** | Factores modificables y contexto cotidiano | "¿Qué hábitos se relacionan con el LDL?" | `nutrition-lifestyle-summary` |
| **C · Curiosidad científica** | Mecanismo o idea memorable que amplía comprensión | "¿Por qué LDL y HDL transportan colesterol?" | `science-curiosity-summary` |
| **D · Lectura conjunta** | Qué aporta leer varios marcadores como panel o relación | "¿Cómo se leen juntos LDL, HDL y triglicéridos?" | `lab-pattern-interpretation-summary` |
| **E · Seguimiento temporal** | Cómo pensar comparabilidad, variación y persistencia | "¿Qué significa que mi LDL cambie con el tiempo?" | `lab-longitudinal-interpretation-summary` |

No es obligatorio producir las cinco. Una tarjeta solo existe si:

- responde una intención diferente;
- tiene una fuente adecuada;
- aporta algo que no está ya cubierto;
- puede redactarse sin exagerar ni convertir educación general en consejo
  individual.

D y E cubren dimensiones diferentes. D explica relaciones generales entre
marcadores. E explica principios generales para comparar mediciones. Ninguna de
las dos interpreta por sí sola el patrón o la evolución concreta de una
persona: esa composición necesita recuperar además su memoria personal.

### 3.3 Capas tradicionales

Cuando existe una relación históricamente defendible pueden añadirse:

| Tarjeta | Intención | `source_type` |
|---|---|---|
| **T1 · Fuente clásica** | Qué dice un texto clásico identificable | `traditional-primary-source-summary` |
| **T2 · Contexto histórico o filológico** | Cómo se interpreta, traduce o transforma el concepto | `traditional-scholarly-context-summary` |
| **T3 · Evaluación científica moderna** | Qué se ha investigado sobre una práctica o afirmación tradicional | `traditional-evidence-review-summary` |

Las tres capas no forman una escala de menor a mayor verdad. Responden preguntas
distintas:

- T1 aporta autoridad textual dentro de una tradición;
- T2 aporta contexto académico sobre esa tradición;
- T3 evalúa una práctica mediante métodos científicos modernos.

Una T3 no habla en nombre del texto clásico. Una T1 no demuestra eficacia
clínica. Una similitud entre T1 y biomedicina no constituye validación mutua.

### 3.4 Acupuntura

La acupuntura necesita un dossier especializado:

| Tarjeta | Intención | `source_type` |
|---|---|---|
| **AC1 · Fuente clásica** | Pasaje histórico y significado contextual | `acupuncture-primary-source-summary` |
| **AC2 · Nomenclatura** | Nombre, caracteres, evolución y código moderno | `acupuncture-terminology-summary` |
| **AC3 · Evidencia por indicación** | Investigación sobre una sola condición | `acupuncture-evidence-review-summary` |
| **AC4 · Seguridad** | Riesgos y límites generales | `acupuncture-safety-summary` |

No se genera una tarjeta de acupuntura para cada biomarcador. "Punto para bajar
el LDL" no es una intención admisible si la relación procede de una
reinterpretación comercial o no puede documentarse.

### 3.5 Especies con uso medicinal documentado

Las plantas, hongos, algas, cianobacterias y otros organismos comercializados o
descritos por su uso medicinal necesitan un dossier especializado. "Medicinal"
describe un uso documentado o una investigación; no demuestra eficacia ni
seguridad.

| Tarjeta | Intención | `source_kind` | `source_type` |
|---|---|---|---|
| **M1 · Identidad** | Organismo, nombres, parte utilizada y formas de producto | `institutional-education` | `medicinal-species-identity-summary` |
| **M2 · Uso documentado** | Uso histórico o tradicional con una fuente identificable | `tradition-context` | `traditional-medicinal-use-summary` |
| **M3 · Evidencia moderna** | Investigación sobre una preparación y una indicación concretas | `clinical-evidence` | `natural-product-evidence-summary` |
| **M4 · Seguridad** | Efectos adversos, interacciones, calidad y poblaciones vulnerables | `institutional-education` | `natural-product-safety-summary` |

Antes de crear M2, M3 o M4 debe superarse una puerta de identidad: nombre
científico, tipo de organismo, parte utilizada y preparación. No se extrapolan
resultados entre especie, extracto, compuesto aislado y producto comercial.
Tampoco se equiparan raíz y rizoma, micelio y cuerpo fructífero, macroalga y
cianobacteria.

Las cuatro capas no son obligatorias. Una especie puede necesitar solo identidad
y seguridad; una M3 puede existir sin M2 si la investigación moderna no parte de
una práctica tradicional verificable.

### 3.6 Figura y fondo: prioridad estable, foco adaptable

Las capas del dossier no tienen el mismo papel en el producto.

VitaMap parte de analíticas, resultados y relaciones entre indicadores. Por eso,
ante una consulta clínica, educativa o ambigua sobre salud, la **biomedicina
medible ocupa la figura por defecto**. Es el plano que organiza la lectura
principal, las cautelas clínicas, la evidencia moderna y la seguridad.

Las tradiciones —Ayurveda, medicina china y otras— forman un **fondo
complementario**. Ese fondo no es una sombra ni una traducción imperfecta de la
figura. Conserva:

- lenguaje propio;
- fuentes propias;
- relaciones internas propias;
- límites explícitos frente a la biomedicina.

La asignación de figura y fondo no es totalmente simétrica ni completamente
intercambiable. La prioridad estructural del producto sigue siendo clínica. Sin
embargo, el **foco de una consulta concreta puede adaptarse**:

| Intención | Figura | Fondo |
|---|---|---|
| Resultado, analítica, seguridad o eficacia | Analítica y evidencia moderna | Tradición opcional o ausente |
| Pregunta tradicional explícita | Red interna de la tradición | Analítica como referencia separada cuando sea pertinente |
| Comparación explícita | Ambos planos lado a lado | Ninguno se fusiona con el otro |

Una tarjeta no tiene `figura` o `fondo` como propiedad permanente. Declara:

- plano epistemológico;
- tradición, si aplica;
- función editorial;
- procedencia;
- límites.

La recuperación y la interfaz deciden la prominencia según la intención.

Las tangencias entre planos son contactos limitados, no equivalencias. Una
coincidencia temática, una traducción aproximada o una asociación de
investigación no transfieren:

- identidad;
- causalidad;
- capacidad diagnóstica;
- autoridad clínica;
- grado de evidencia.

Cuando ambos planos formulan una afirmación clínica comprobable, la afirmación
se evalúa con el estándar clínico correspondiente. La tradición no se convierte
por ello en biomarcador, y una fuente clásica no demuestra eficacia moderna.

Esta regla gobierna tanto el corpus como la recuperación y el GPS visual:

> El grafo técnico puede contener todos los planos; el mapa del usuario muestra
> primero lo que ayuda a comprender su pregunta sin perder el contexto.
### 3.7 Ejemplo: dossier LDL

Un dossier razonable puede contener:

```text
colesterol-ldl-interpretacion-medlineplus.md
colesterol-ldl-alimentacion-factores-cdc.md
colesterol-curiosidad-ldl-hdl-transportadores-nhlbi.md
colesterol-ldl-ayurveda-fuente-clasica-susrutasamhita.md
```

Podrían añadirse una T2 o T3 si aparece una pregunta distinta y una fuente
adecuada. No se crean para completar una cuota.

## 4. Qué significa "una intención recuperable"

No significa escribir una respuesta distinta para cada posible pregunta.

Significa que el documento tiene una función dominante suficientemente clara
para que:

- su título coincida con la intención;
- BM25 encuentre sus términos principales;
- la búsqueda vectorial reconozca paráfrasis;
- el fragmento recuperado no mezcle respuestas incompatibles;
- el LLM sepa qué autoridad y qué límites tiene la fuente.

Una tarjeta puede responder muchas formulaciones próximas:

```text
¿Qué es el LDL?
¿Qué significa tener el LDL alto?
¿Cómo se interpreta este valor?
¿Es lo mismo LDL que colesterol total?
```

No necesita cuatro documentos. Necesita una tarjeta A bien redactada.

### 4.1 Cuándo separar

Conviene separar cuando cambie uno de estos elementos:

- la intención de la persona;
- la fuente principal;
- la clase de autoridad;
- el nivel de seguridad requerido;
- el sistema de conocimiento;
- la condición clínica estudiada;
- la conclusión que puede sostenerse.

### 4.2 Cuándo no separar

No conviene crear otro archivo cuando solo cambie:

- una pequeña variante de redacción;
- un sinónimo;
- el orden de la misma explicación;
- una pregunta que el documento existente ya responde claramente;
- un detalle que cabe como subsección breve sin cambiar la intención.

La meta no es maximizar el número de documentos. Es maximizar la precisión y la
reutilización de cada unidad.

## 5. Dimensiones de los datos

Cada tarjeta combina varias dimensiones que no deben confundirse:

| Dimensión | Pregunta que responde | Ejemplo |
|---|---|---|
| **Tema** | ¿De qué trata? | colesterol LDL |
| **Intención** | ¿Qué quiere comprender la persona? | interpretación |
| **Procedencia** | ¿Qué clase de fuente es? | educación institucional |
| **Tipo documental** | ¿Qué función editorial cumple? | resumen de analítica |
| **Sistema de conocimiento** | ¿Biomedicina, Ayurveda, MTC...? | Ayurveda |
| **Estado editorial** | ¿Está revisado y publicado? | aprobado |
| **Derechos** | ¿Puede incorporarse al RAG? | licensed |
| **Limitaciones** | ¿Qué no permite concluir? | no fija objetivos individuales |

En el piloto, VitaMap implementa de forma obligatoria:

```yaml
title:
source_url:
source_language:
source_jurisdiction:
publication_date:
source_kind:
source_type:
rights_status:
limitations:
```

Durante la publicación administrativa añade estado, revisión, versión y fechas
de auditoría.

### 5.1 Idioma y jurisdicción de la fuente

VitaMap puede responder en español o alemán, pero el idioma de la respuesta no
debe confundirse con el idioma de la fuente enlazada. Por eso el corpus modela:

```yaml
source_language: de
source_jurisdiction:
  - DE
```

`source_language` describe la página o documento usado como fuente principal
(`de`, `en`, `es`, `zh`, etc.). `source_jurisdiction` describe el marco
institucional o geográfico principal (`DE`, `EU`, `US`, `GB`, `INT`, etc.).

Como el público principal previsto es alemán, el criterio editorial y técnico
es:

1. Si existe una fuente alemana o europea equivalente, fiable y reutilizable,
   debe preferirse para una tarjeta dirigida a usuarios en alemán.
2. Si la mejor fuente disponible está en inglés, se usa igualmente y se declara
   `source_language: en`.
3. No se rebaja la calidad de evidencia solo para conseguir un enlace alemán.
4. La interfaz y el prompt deben poder mostrar que una fuente es alemana,
   europea, estadounidense o de otro marco.

La recuperación no filtra de forma dura por idioma. QMD no permite filtrar
`search` por frontmatter; por tanto, VitaMap recupera candidatos, aplica los
filtros de marcador/intención disponibles y después reordena suavemente para
priorizar `de/DE` y `EU` cuando el `locale` del chat es alemán. Si el corpus no
contiene una fuente alemana equivalente para ese tema, se conserva la mejor
fuente disponible.

Esto implica una tarea editorial concreta: los próximos lotes del corpus deben
buscar activamente fuentes DE/EU —por ejemplo IQWiG/Gesundheitsinformation,
RKI, BfR, BfArM, G-BA, AWMF, EMA/EFSA o sociedades europeas/alemanas— cuando
sean apropiadas para la pregunta.

Pendiente de diseño: separar en la interfaz la **fuente citada** de una posible
**lectura complementaria**. `source_url` debe seguir apuntando al documento
exacto usado para construir y citar la tarjeta, aunque exista una versión en
otro idioma. Para no falsear la trazabilidad, las variantes lingüísticas o
páginas equivalentes futuras deberían modelarse en un campo distinto, por
ejemplo:

```yaml
source_alternates:
  - language: de
    jurisdiction:
      - DE
    label: Gesundheitsinformation.de
    url: https://...
  - language: es
    jurisdiction:
      - US
    label: MedlinePlus en español
    url: https://...
```

La UI podría mostrar esas URLs en una pestaña o bloque "Lectura complementaria",
sin mezclarlas con las fuentes realmente usadas por el RAG en esa respuesta.

### 5.2 Idioma del cuerpo y variantes localizadas

> **Revisión 2026-07-13:** esta sección conserva la hipótesis incremental que
> sirvió para el piloto. La decisión operativa revisada vive en
> `HOJA-DE-RUTA-MULTILINGUE-NIVELES-Y-CURIOSIDAD.md` y prevalece, en especial,
> sobre dos puntos de la propuesta histórica: el cuerpo español deja de ser una
> garantía suficiente para alemán y la preferencia suave en un único conjunto
> de resultados se sustituye progresivamente por rendiciones revisadas y
> proyecciones QMD por `content_locale` dentro del mismo corpus lógico.

`source_language` no resuelve por sí solo el problema multilingüe: describe la
fuente, no el idioma del cuerpo redactado por VitaMap. Una tarjeta puede estar
escrita en español a partir de una fuente inglesa, o en alemán a partir de una
fuente alemana. Para evitar esa mezcla, la siguiente evolución debe separar:

```yaml
source_language: en      # idioma de la fuente citada
content_language: es     # idioma del cuerpo VitaMap
```

La hipótesis original fue un **híbrido incremental**, no dos corpus
independientes:

1. **Cuerpo ES como capa base editorial.** La tarjeta canónica se redacta,
   revisa y mantiene primero en español mientras el corpus nace y se estabiliza.
2. **Variantes DE solo donde aporten.** Para los top-N marcadores esperables en
   consultas alemanas, o cuando una fuente DE/EU cambie el encuadre práctico, se
   crea una variante alemana revisada.
3. **Fallback por traducción del LLM.** Si no existe cuerpo DE revisado, la
   respuesta en alemán puede traducir o adaptar el cuerpo ES recuperado, dejando
   claro qué fuente sostiene la afirmación. Esa traducción no se convierte en
   tarjeta oficial salvo revisión editorial.
4. **Preferencia por fuente local cuando mejora la trazabilidad.** Una variante
   DE puede usar una fuente alemana o europea propia si es equivalente o mejor
   para el usuario alemán. No se crea solo por traducir.

Convención futura posible:

```text
fosforo/fosfato-interpretacion-medlineplus.es.md
fosforo/fosfato-interpretacion-medlineplus.de.md
```

Con frontmatter mínimo para vincular variantes:

```yaml
canonical_card_id: fosforo-fosfato-interpretacion-medlineplus
content_language: de
locale_variant: de-DE
localized_from: es
localization_status: reviewed
```

Los campos conceptuales deben seguir compartidos o validados como equivalentes
entre variantes: `marker`, `categoria`, `muestra`, `sistema`, `area_de_salud`,
`seccion`, `relacionado_con` y `evidence`. Pueden variar `title`, `alias`,
`limitations` si el idioma o la fuente local lo exige, y el cuerpo textual. Si
la variante DE usa otra fuente principal, `source_url`, `source_language` y
`source_jurisdiction` deben describir esa fuente exacta; el vínculo conceptual
se conserva mediante `canonical_card_id`.

La recuperación debe tratar el idioma como preferencia, no como partición dura:
para `locale=de`, priorizar una variante `content_language: de`; si no existe,
recuperar la tarjeta base y responder en alemán con traducción controlada. El
grafo, la taxonomía y la cobertura de ángulos viven en la tarjeta conceptual, no
en dos mundos paralelos.

#### Por qué no crear dos corpus independientes

Dos corpus físicos separados, uno ES y otro DE, parecen simples al principio,
pero introducen riesgos de mantenimiento y calidad:

- **Deriva editorial:** una corrección clínica, una retirada o una actualización
  de fuente puede aplicarse en un idioma y olvidarse en el otro.
- **Contradicciones invisibles:** dos tarjetas homólogas pueden terminar con
  `evidence`, limitaciones o relaciones distintas sin que el usuario lo vea.
- **Duplicación del grafo:** `marker`, `relacionado_con`, paneles y rutas de
  salud se duplican, aumentando el coste de validación y los falsos huecos.
- **Recuperación peor ante fallback:** una consulta alemana puede quedar sin
  respuesta si el corpus DE no tiene variante, aunque el corpus ES sí tenga una
  tarjeta sólida.
- **Más coste operativo:** más embeddings, más índices, más revisión, más tests
  y más decisiones de retirada/versionado.
- **Trazabilidad más confusa:** cuesta saber si dos documentos son traducciones,
  adaptaciones con fuente local, o piezas conceptualmente distintas.
- **Medición fragmentada:** los benchmarks de recuperación se dividen por idioma
  y dejan de medir la salud del dossier conceptual completo.

La separación física solo tendría sentido si en el futuro los corpus tuvieran
políticas, permisos, modelos de recuperación o gobernanza claramente distintos.
Mientras el objetivo sea ofrecer el mismo conocimiento con variantes de
presentación y localización, el modelo correcto es una tarjeta conceptual con
cuerpos localizados.

### 5.3 Taxonomía y vocabulario runtime

La arquitectura separa fuentes de verdad por responsabilidad:

- los Markdown son la fuente de verdad editorial y documental;
- `corpus-taxonomy.json` gobierna identidad de conceptos, markers, aliases y
  grupos de consulta durante la migración;
- el registro de predicados gobierna la gramática de las relaciones — vive en
  [REGISTRO-PREDICADOS.md](REGISTRO-PREDICADOS.md), que hoy cubre además el
  contrato de arista (nodo, procedencia, ciclo de vida, validaciones): no son
  todavía dos artefactos separados, sino uno con ambas responsabilidades;
- el registro de aristas gobierna conexiones concretas y su procedencia — mismo
  documento, §2 (Modelo base) y §6-8;
- las rutas de consulta gobiernan heurísticas de recuperación y no se consideran
  relaciones científicas.

El plan priorizado para construir este grafo (qué falta, en qué orden, y por qué
—incluida la política de expansión de la Etapa E3.5 más abajo—) vive en
[PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md](PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md).

Mientras el registro de aristas no exista como artefacto separado,
`relacionado_con` sigue siendo el contenedor de compatibilidad. Toda evolución
debe evitar mezclar una ruta editorial —por ejemplo, `fatiga → explorar
ferritina`— con una relación de conocimiento —por ejemplo, `PCR → modifica la
interpretación de ferritina`. La app no mantiene una segunda lista
manual de markers en `marker-scope.ts`; consume
`apps/web/lib/generated/marker-vocabulary.ts`, generado desde la taxonomía con:

```bash
npm run taxonomy:generate --workspace apps/web
```

Esto evita que una tarjeta nueva obligue a editar dos sitios y que un olvido
produzca fallos silenciosos de recuperación.

La taxonomía distingue:

- **marker canónico**: valor que puede aparecer en frontmatter, por ejemplo
  `alt`, `ast`, `ggt`, `fosfatasa-alcalina`.
- **alias**: forma literal que puede escribir una persona, por ejemplo
  `CRP`, `Vitamin D`, `Leberwerte`.
- **query_group**: puente de consulta que no es marker, por ejemplo `higado`,
  `perfil-hepatico`, `anemia`, `perfil-tiroideo`.
- **health_area_route**: motivo de consulta difuso que reutiliza
  `area_de_salud`, por ejemplo `energia-fatiga` cuando la persona dice
  "estoy cansado" o "ich bin müde".

Un `query_group` siempre expande a markers reales. Por eso `higado` puede
activar `alt`, `ast`, `ggt` y `fosfatasa-alcalina`, pero no debe escribirse
como `marker: higado` en una tarjeta.

Un `health_area_route` no es filtro duro. Si la persona menciona un marcador,
manda el marker. Si no hay marker y sí un motivo difuso, VitaMap expande la
query de KB con semillas curadas y reordena los documentos que ya declaran esa
`area_de_salud`. En corto:

- `marker` estrecha;
- `lens` reordena la perspectiva;
- `area_de_salud` ensancha de forma curada.

Las rutas activas hoy son `energia-fatiga`, `estado-animo-estres`, `salud-osea`,
`salud-hormonal`, `salud-piel-cabello-unas` (uñas/piel/cabello, siembra
`ferritina`, `hierro`, `zinc`, `biotina`, `selenio`) y `embarazo-y-lactancia`
(siembra `yodo`, `acido-folico`, `ferritina`, `vitamina-d`, `vitamina-b12`,
`calcio`). `sueno` queda pendiente hasta que exista corpus etiquetado con esa
área.

Contrato de validación:

```bash
npm run test:marker-taxonomy --workspace apps/web
```

Ese test comprueba que el vocabulario generado está sincronizado, que los
grupos de consulta apuntan a markers existentes, que `relacionado_con` no
enlaza IDs desconocidos y que las tarjetas locales no usan markers fuera de la
taxonomía.

### 5.4 Metadatos futuros posibles

Cuando el volumen lo justifique pueden añadirse:

```yaml
topic_id: cholesterol-ldl
intent: interpretation
tradition: ayurveda
aliases:
  - LDL cholesterol
  - colesterol malo
questions_answered:
  - "¿Qué significa mi LDL?"
panel_id: lipid-panel
markers:
  - cholesterol-total
  - cholesterol-ldl
  - cholesterol-hdl
  - triglycerides
source_version: "6.1"
source_checksum: "sha256:..."
supersedes: "document-id-anterior"
next_review_at: "2027-06-01"
organism_type: plant
scientific_name: "Curcuma longa L."
accepted_name_source: "Kew POWO"
part_used:
  - rizoma
preparation:
  - polvo
  - extracto
```

No son necesarios para publicar el primer corpus. Su utilidad futura sería:

- filtrar por intención o tradición;
- mejorar la recuperación multilingüe;
- detectar duplicados;
- relacionar versiones;
- programar revisiones;
- construir dossiers visibles en administración.

`questions_answered` debe contener unas pocas formulaciones representativas,
no cientos de preguntas prefabricadas.

## 6. Método editorial actual

### 6.1 Selección del brief

El flujo usa seis briefs:

```text
PROMPT-INVESTIGACION-RAG.md
  -> tarjetas A, B, D y E

BRIEF-TARJETA-D-lectura-conjunta.md
  -> módulo detallado para D

BRIEF-TARJETA-E-seguimiento-temporal.md
  -> módulo detallado para E

PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md
  -> tarjeta C y capas T1, T2, T3

PROMPT-INVESTIGACION-RAG-ACUPUNTURA.md
  -> capas AC1, AC2, AC3, AC4

PROMPT-INVESTIGACION-RAG-ESPECIES-MEDICINALES.md
  -> capas M1, M2, M3, M4
```

Los metadatos taxonómicos ampliados todavía no forman parte del formulario
administrativo. Hasta que el importador pueda preservarlos, la identidad,
sinónimos, parte utilizada y preparación se registran en el cuerpo de M1.

### 6.2 Investigación

La investigación sigue esta secuencia:

1. definir tema e intención;
2. elegir la clase de fuente adecuada;
3. usar repositorios y consultas iniciales recomendados por el brief;
4. abrir la página, archivo o edición concreta;
5. comprobar pasaje, versión, fecha y licencia;
6. distinguir texto base, comentario, traducción y aparato crítico;
7. redactar una síntesis, no copiar extensamente la fuente;
8. expresar incertidumbres y límites.

Para fuentes clásicas no basta encontrar una obra citada en un catálogo. Debe
abrirse el objeto que contiene el pasaje.

### 6.3 Preparación local

Los documentos pasan por:

```text
source-material/
  -> investigación o material todavía no aprobado

approved-current-structure/<tema>/
  -> dossier temático aprobado con la estructura vigente

previously-uploaded/
  -> copia histórica de documentos subidos antes del modelo por dossiers
```

Estas carpetas no son la KB y QMD no las indexa.

La carpeta aprobada reúne en un mismo dossier las tarjetas biomédicas,
científicas y tradicionales del tema. La separación entre perspectivas se
expresa mediante la intención y los metadatos de cada tarjeta, no mediante
carpetas editoriales aisladas.

`previously-uploaded/` permite conservar trazabilidad sin presentar los
documentos anteriores como plantillas del formato vigente. Mover un archivo
entre estas carpetas no altera los documentos que ya viven en `/data/kb`.

### 6.4 Publicación

El flujo administrativo real es:

```text
Markdown preparado
  -> carga en /admin/corpus
  -> borrador en /data/kb-inbox
  -> revisión de metadatos, contenido y derechos
  -> aprobación humana
  -> publicación en /data/kb
  -> QMD update()
  -> QMD embed()
  -> consulta de prueba
  -> mantenimiento o retirada
```

Los documentos con `rights_status: unknown` o `metadata-only` no pueden
publicarse. La aplicación exige `permitted` o `licensed`.

## 7. Recuperación actual

### 7.1 Fuentes de verdad e índices

Las fuentes de verdad son los Markdown:

```text
/data/users/<user_id>/memory/**/*.md
/data/kb/**/*.md
```

Los índices QMD son derivados y reconstruibles:

```text
/data/users/<user_id>/index.sqlite
/data/kb-index.sqlite
```

### 7.2 Flujo de una pregunta

Actualmente:

```text
pregunta actual
  -> consulta del índice personal
  -> consulta del índice compartido
  -> ambas búsquedas se ejecutan en paralelo
  -> BM25 + búsqueda vectorial
  -> fusión de resultados por QMD
  -> mejor fragmento de cada documento
  -> hasta 3 resultados personales y 3 externos
  -> fragmentos y limitaciones entran en el prompt
  -> respuesta del LLM
  -> guardrail de seguridad
  -> respuesta y tarjetas de cita
```

El historial conversacional llega al LLM. Para recuperación se usa normalmente
el último mensaje; cuando parece una continuación breve, se incorpora además el
último mensaje de la persona para conservar el tema activo. Una regla ligera
añade vocabulario de identidad, seguridad, evidencia o tradición cuando la
intención es explícita.

### 7.3 Perfil QMD actual

La implementación usa:

```ts
queries: [
  { type: "lex", query },
  { type: "vec", query },
]
rerank: false
candidateLimit: 10
```

Esto conserva:

- BM25 para términos literales;
- búsqueda vectorial para significado y paráfrasis;
- fusión híbrida de QMD;
- selección de `bestChunk`.

Por rendimiento en el VPS CPU se desactivan:

- expansión local de consultas;
- Qwen3-Reranker.

La ruta de chat solicita actualmente:

```text
limit: 3
minScore: 0.35
```

Este umbral es una limitación conocida: con puntuaciones RRF sin reranking no
debe interpretarse como probabilidad de relevancia y necesita calibración.

### 7.4 Contexto entregado al modelo

Cada resultado se envuelve como:

```text
<source type="personal" ...>
<source type="evidence" kind="..." document_type="..." ...>
```

Los fragmentos se truncan según su tipo, después de retirar el frontmatter YAML
(cuyos metadatos relevantes ya se incorporan como atributos y limitaciones): la
memoria personal a **600 caracteres** y las tarjetas de evidencia a **2000**,
porque sus matices ("qué no permite concluir", "qué se sabe y qué no") viven al
final del cuerpo y un corte a 600 los amputaba antes de llegar al modelo. Las
`limitations` del frontmatter no se truncan.

La respuesta usa un presupuesto progresivo: breve por defecto y más amplio
cuando la persona pide detalle, comparación, una lista completa o una
explicación paso a paso. El modelo debe responder a la intención inmediata, no
resumir automáticamente todo el dossier recuperado.

### 7.5 Citas actuales

La API devuelve actualmente como citas todos los resultados recuperados. Esto
demuestra recuperación, pero no demuestra que el modelo haya usado cada fuente
en una afirmación concreta.

La dirección deseable es devolver solo las fuentes realmente utilizadas o
relacionar cada afirmación con su identificador de fuente.

## 8. Qué aporta esta arquitectura

### 8.1 Frente a un documento largo

Las tarjetas:

- reducen la mezcla de intenciones;
- producen fragmentos más coherentes;
- permiten actualizar una parte sin reescribir todo el tema;
- facilitan atribución y retirada;
- permiten priorizar perspectivas diferentes.

### 8.2 Frente a 500 preguntas y respuestas

El enfoque evita mantener cientos de respuestas casi duplicadas:

- BM25 resuelve vocabulario literal;
- los embeddings resuelven paráfrasis;
- unas pocas preguntas representativas pueden añadirse como señales;
- el LLM compone la respuesta final usando la tarjeta recuperada.

Las preguntas masivas son más útiles como conjunto de evaluación que como
documentos del corpus.

### 8.3 Frente a organizar únicamente con Obsidian o carpetas

Obsidian puede ser una buena herramienta de autoría, revisión y navegación
humana. Las carpetas, enlaces y mapas de contenido ayudan al equipo editorial.

Sin embargo, por sí solos no mejoran necesariamente la recuperación de VitaMap.
QMD busca el contenido Markdown mediante BM25 y vectores. Lo que más influye es:

- la calidad del texto;
- la claridad de la intención;
- los títulos y términos recuperables;
- los metadatos;
- el tamaño y coherencia de la tarjeta;
- la estrategia de consulta.

Obsidian puede añadirse como interfaz editorial sin convertirse en otro motor de
búsqueda ni duplicar la fuente de verdad.

## 9. Limitaciones presentes

1. Se consultan memoria y todo el KB para cada pregunta, aunque la intención no
   requiera todos los carriles.
2. No existe todavía un router de intención.
3. `source_kind` y `source_type` llegan al prompt, pero no dirigen la búsqueda;
   por tanto, D y E aún no reciben prioridad específica.
4. La continuidad conversacional usa una regla ligera y todavía no resuelve
   referencias complejas o cambios de tema ambiguos.
5. El umbral `minScore` no está calibrado para el perfil RRF sin reranker.
6. Los stores se abren y cierran en cada pregunta, aumentando la latencia.
7. Las citas visibles corresponden a resultados recuperados, no necesariamente
   a fuentes utilizadas.
8. No existe todavía un benchmark versionado por tema.
9. La administración no modela aún dossiers, relaciones ni obsolescencia.
10. La calidad sigue dependiendo mucho de revisión humana y trazabilidad
    editorial, como debe ocurrir en esta etapa.

## 10. Evolución propuesta

Las etapas E0–E6 ordenan la **ingeniería de recuperación**. Su complemento
metodológico —cómo graduar la evidencia (GRADE-lite), anclar markers con códigos
y unidades (FHIR/LOINC/UCUM) y despertar el grafo de relaciones con pesos y
direcciones— vive, en progresión, en
[DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md](DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md).
El §5 de ese documento cruza sus tramos con estas etapas.

### Etapa E0 · Corpus pequeño y medible

Objetivo inmediato:

- completar unos pocos dossiers útiles;
- revisar cada tarjeta manualmente;
- probar consultas reales;
- registrar qué documento debería recuperarse;
- detectar duplicados y huecos antes de ampliar volumen.

Para cada tema se recomienda un conjunto de evaluación de 10 a 20 preguntas:

```yaml
query: "¿Qué significa mi LDL?"
expected:
  - colesterol-ldl-interpretacion-medlineplus.md
must_not_prioritize:
  - colesterol-ldl-ayurveda-fuente-clasica-susrutasamhita.md
```

Estas preguntas no se indexan como respuestas. Sirven para medir recuperación.

Mejoras inmediatas:

1. calibrar o retirar temporalmente `minScore`;
2. comprobar `recall@3` y primer resultado esperado;
3. probar sinónimos y consultas en español y alemán;
4. verificar que una pregunta convencional prioriza A/B y una petición
   tradicional prioriza T1/T2/T3;
5. revisar las citas contra la respuesta.

### Etapa E1 · Router de intención

La evolución debe contemplar tres modos de recuperación y respuesta:

| Modo | Prioridad de recuperación | Comportamiento |
|---|---|---|
| **Lectura clínica** | memoria personal + interpretación, estilo de vida, curiosidad científica y evidencia moderna | Se activa ante analíticas, eficacia, diagnóstico, seguridad y otras preguntas clínicas. Las fuentes biomédicas e institucionales ocupan el primer plano sin convertir la tradición en adversario. |
| **Comparación** | carriles biomédicos y tradicionales recuperados por separado | Expone coincidencias, diferencias, lenguaje propio, tipo de autoridad y nivel de evidencia sin forzar equivalencias entre sistemas. |
| **Perspectiva tradicional** | fuente clásica + contexto histórico o filológico; evidencia moderna y seguridad cuando sean pertinentes | Da protagonismo al sistema solicitado, con atribución clara. No traduce automáticamente sus conceptos a diagnósticos modernos ni añade una refutación clínica ritual. |

Si la persona no selecciona un modo, el router infiere la intención. La
**Lectura clínica es el modo por defecto** para preguntas ambiguas sobre un
resultado, un síntoma, un efecto de salud, eficacia o seguridad;
una petición como "desde Ayurveda", "según la medicina china" o "compáralos"
activa el modo correspondiente para esa consulta.

Los modos no crean tres copias del corpus. Actúan sobre el mismo KB y cambian:

- qué carriles se consultan;
- qué documentos reciben prioridad;
- cómo se organiza la respuesta;
- qué cautelas y comparaciones debe aplicar el modelo.

La memoria personal continúa siendo central en los tres modos cuando contiene
información pertinente. La elección de modo tampoco convierte una fuente en
verdadera ni altera su clasificación editorial.

Antes de buscar, la aplicación puede clasificar la consulta en uno o varios
carriles:

```text
personal
interpretation
lifestyle
science-curiosity
pattern-interpretation
longitudinal-interpretation
traditional-primary
traditional-context
traditional-evidence
medicinal-species-identity
medicinal-use
natural-product-evidence
natural-product-safety
comparison
safety
```

El router no decide la verdad. Decide dónde buscar y qué priorizar.

Ejemplos:

- "¿Qué significa mi LDL?" -> memoria + interpretación;
- "¿Cómo se leen juntos LDL y triglicéridos?" -> memoria + lectura conjunta;
- "¿Ha cambiado mi creatinina?" -> serie personal + seguimiento temporal;
- "¿Qué puedo cambiar en mi alimentación?" -> memoria + estilo de vida;
- "¿Qué dice Ayurveda?" -> tradición primaria + contexto;
- "¿Está demostrado científicamente?" -> evidencia moderna;
- "¿Qué especie es y qué parte se usa?" -> identidad de especie medicinal;
- "¿Tiene riesgos o interacciones?" -> seguridad de producto natural;
- "Compáralos" -> carriles biomédico y tradicional separados.

La primera versión puede usar reglas y términos explícitos. Un clasificador LLM
solo se justifica si mejora las pruebas.

### Etapa E2 · Consulta enriquecida

Para preguntas de seguimiento se puede construir una consulta de recuperación
con:

- último mensaje;
- tema activo de los turnos anteriores;
- intención detectada;
- sinónimos controlados;
- variantes multilingües.

Ejemplo:

```text
mensaje: "¿y desde Ayurveda?"
tema activo: colesterol LDL
consulta de recuperación: "colesterol LDL Ayurveda medas fuente clásica"
```

La consulta enriquecida es interna. No cambia la pregunta original que recibe el
LLM.

### Etapa E3 · Metadatos y dossiers explícitos

Cuando haya suficiente volumen:

- añadir `topic_id`, `intent`, `panel_id`, `markers`, `tradition` y `language`;
- mostrar en administración todas las tarjetas de un dossier;
- detectar intenciones sin cubrir;
- relacionar versiones y documentos sustituidos;
- programar revisión de fuentes;
- conservar checksum del material fuente o de la versión local.

Los filtros pueden aplicarse:

1. antes de buscar, si QMD ofrece un contrato estable adecuado;
2. recuperando más candidatos y filtrando en la aplicación;
3. mediante índices separados si los carriles necesitan políticas diferentes.

No conviene filtrar después de recuperar solo tres candidatos: podría eliminar
todos los resultados relevantes.

### Etapa E3.5 · Expansión controlada por grafo

Desarrollo completo de esta política (knobs, refinamientos, activación de
tangencias con precondición + disparador) en
[PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md §2.5-2.6](PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md).

La expansión por relaciones solo se activa después de disponer de:

- banco de evaluación y baseline previo;
- conceptos canónicos estables;
- predicados tipados;
- aristas con procedencia;
- estado de revisión;
- validadores de dirección, tipos y duplicados.

Primera política recomendada:

```yaml
max_hops: 1
max_neighbors: 4
requires_status: reviewed
explain_path: true
```

Solo se expanden predicados incluidos en una allowlist. Las relaciones de
tangencia permanecen cerradas por defecto y solo pueden participar ante una
intención comparativa o tradicional explícita.

La aplicación registra por qué se recuperó cada vecino. Ejemplo:

> Se recuperó esta tarjeta porque la proteína C reactiva puede modificar cómo se
> interpreta la ferritina en un contexto inflamatorio.

Las rutas de consulta (`health_area_route`, `query_group`) pueden orientar la
búsqueda, pero no se presentan como relaciones clínicas ni se mezclan con el
grafo epistemológico.

### Etapa E4 · Grounding y citas

La respuesta debe evolucionar hacia citas comprobables por afirmación:

1. cada fuente entra al prompt con un identificador estable;
2. el modelo marca qué identificador respalda cada afirmación;
3. el servidor valida que el identificador existía en el contexto;
4. la interfaz muestra solo fuentes utilizadas;
5. una afirmación clínica sin fuente se reescribe o bloquea.

También puede añadirse una comprobación posterior que compare respuesta y
fragmentos antes de mostrarla.

### Etapa E5 · Calidad y rendimiento

Cuando las métricas lo justifiquen:

- mantener el store de KB abierto;
- usar una caché LRU limitada para stores personales;
- ampliar `candidateLimit`;
- activar expansión de consultas;
- evaluar el reranker;
- usar una GPU o un servicio QMD persistente;
- medir latencia fría y caliente.

El reranker debe activarse por mejora demostrada en el benchmark, no solo porque
esté disponible.

### Etapa E6 · Separación física o nueva infraestructura

El KB puede continuar en un único índice mientras:

- la recuperación sea precisa;
- los carriles puedan priorizarse correctamente;
- no existan políticas operativas distintas.

Separar índices clínico, educativo y tradicional se justifica si:

- aparecen mezclas frecuentes pese al router y los metadatos;
- cada corpus necesita ciclos de actualización distintos;
- los permisos o la gobernanza divergen;
- el tamaño perjudica latencia o calidad;
- se requieren modelos o estrategias de búsqueda diferentes.

Postgres puede añadirse como plano de control para:

- catálogo editorial;
- relaciones entre documentos;
- versionado;
- tareas de revisión;
- métricas y analítica estructurada.

QMD puede seguir siendo el motor de recuperación. No es necesario sustituirlo
solo porque aumente el número de documentos.

## 11. Criterios para saber cuándo mejorar

Las mejoras deben responder a métricas y problemas observados:

| Señal | Mejora candidata |
|---|---|
| Preguntas de seguimiento recuperan otro tema | consulta enriquecida con contexto |
| Fuentes tradicionales aparecen en preguntas convencionales | router y filtros por intención |
| El documento correcto queda fuera del top 3 | más candidatos, aliases o reranker |
| Muchas tarjetas casi idénticas | deduplicación y reglas de fusión |
| Citas no respaldan la respuesta | grounding por identificador |
| Fuentes obsoletas permanecen publicadas | versionado y fechas de revisión |
| Latencia dominada por apertura de stores | stores persistentes o servicio QMD |
| Varios curadores editan simultáneamente | catálogo y workflow editorial estructurado |
| Carriles con políticas diferentes | índices físicos separados |

## 12. Siguiente ciclo recomendado

1. Terminar los dossiers clínicos con las tarjetas que aporten intenciones reales.
2. Probar entre 10 y 20 consultas de evaluación sobre esos dossiers.
3. Registrar resultados esperados y errores de recuperación.
4. Evaluar el piloto de cúrcuma con preguntas de identidad, evidencia y seguridad.
5. Comprobar que M1, M3 y M4 no compiten entre sí ni contaminan consultas clínicas.
6. Corregir prompts y recuperación antes de producir corpus masivamente.
7. Solo entonces ampliar a más marcadores, tradiciones o especies.

## 13. Resumen de decisiones

- Markdown continúa siendo la fuente de verdad.
- QMD continúa siendo el motor de recuperación.
- Un tema se modela como dossier lógico de tarjetas.
- Una tarjeta tiene una intención principal, no una pregunta literal única.
- A/B/C/D/E y T1/T2/T3 son funciones distintas, no cuotas.
- VitaMap es un GPS de analíticas: la biomedicina medible es la figura por
  defecto y conserva la prioridad estructural del producto.
- Las tradiciones son un fondo complementario con lenguaje, fuentes y
  relaciones internas propias; no son decoración ni traducción automática.
- El foco puede adaptarse ante una petición tradicional o comparativa explícita,
  pero la adaptación no vuelve simétricos los regímenes de evidencia ni
  transfiere autoridad entre planos.
- La acupuntura usa un brief especializado.
- Las especies con uso medicinal usan un brief especializado y una puerta de
  identidad antes de evaluar evidencia o seguridad.
- Especie, parte, preparación, extracto, compuesto y producto comercial no son
  unidades intercambiables.
- La fuente clásica, el contexto histórico y la evidencia moderna no se
  fusionan.
- Las rutas de búsqueda orientan; el pasaje exacto sigue necesitando
  verificación.
- La revisión humana separa Internet del RAG.
- Las preguntas masivas se usan para evaluación, no para inflar el corpus.
- La siguiente mejora prioritaria es medir recuperación antes de aumentar
  volumen.
- La recuperación evolucionará hacia tres modos guiados por intención: Lectura
  clínica, Comparación y Perspectiva tradicional.
- El router, los metadatos ampliados, el grounding y el reranker se incorporan
  por etapas y con criterios observables.
