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

Para un tema pueden existir hasta cinco tipos de tarjeta:

| Tarjeta | Pregunta principal | Estado |
|---|---|---|
| **A · Interpretación** | "¿Qué mide y qué significa este resultado?" | Obligatoria para cada marcador |
| **B · Alimentación y factores modificables** | "¿Qué factores cotidianos se relacionan con este marcador?" | Solo cuando haya una fuente oficial útil |
| **C · Curiosidad científica** | "¿Qué aspecto interesante ayuda a comprenderlo?" | Opcional; se produce con el brief de enriquecimiento |
| **D · Lectura conjunta** | "¿Cómo se leen juntos estos marcadores?" | Solo cuando una fuente describa la relación de forma expresa |
| **E · Seguimiento temporal** | "¿Qué significa que este valor cambie con el tiempo?" | Solo cuando una fuente permita explicar comparabilidad, variación o seguimiento |

Ejemplo para colesterol LDL:

```text
colesterol-ldl-interpretacion-medlineplus.md
colesterol-ldl-alimentacion-factores-medlineplus.md
colesterol-curiosidad-[gancho]-[fuente].md
perfil-lipidico-lectura-conjunta-[fuente].md
colesterol-ldl-seguimiento-temporal-[fuente].md
```

No generes cinco tarjetas por obligación. Si B, C, D o E no aportan una
respuesta distinta y bien respaldada, entrega solo las que correspondan. No
mezcles las intenciones en un único documento.

Cada archivo tiene:

1. **Frontmatter YAML** compatible con la interfaz de VitaMap.
2. **Cuerpo Markdown** centrado en una intención.

Antes de redactar, identifica si el tema ya existe en
`corpus-preparation/corpus-taxonomy.json`. Si existe, usa sus valores
canónicos. Si no existe, no improvises una carpeta o un vocabulario nuevo:
propón primero la entrada de taxonomía que habría que añadir y explica qué
hueco de cobertura resuelve.

---

## 3. Frontmatter compatible con VitaMap

Copia esta estructura. Los nombres de campo no se cambian. Los campos facetados
deben seguir `corpus-preparation/corpus-taxonomy.json`: mismo `marker`, mismas
categorías, mismas áreas de salud y mismas relaciones cuando ya existan.

```yaml
---
title: "Colesterol LDL: interpretación general"
source_url: "https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html"
source_language: en
source_jurisdiction:
  - US
publication_date: "2025-05-05"
source_kind: institutional-education
source_type: lab-interpretation-summary
rights_status: permitted
facets_version: 1
tarjeta_id: colesterol-ldl-colesterol-ldl-interpretacion-medlineplus
dominio: laboratorio
tipo:
  - analito
marker:
  - colesterol-ldl
categoria:
  - perfil-lipidico
muestra:
  - suero
  - plasma
sistema:
  - cardiovascular
  - endocrino-metabolico
area_de_salud:
  - salud-cardiovascular
  - longevidad
seccion: interpretacion
alias:
  - ldl
  - colesterol ldl
relacionado_con:
  - id: colesterol-hdl
    relacion: mismo_panel
    direccion: simetrica
  - id: trigliceridos
    relacion: mismo_panel
    direccion: simetrica
evidence:
  certeza: alta
limitations:
  - "Síntesis editorial de VitaMap; no es una copia de la página original."
  - "Los valores son referencias generales, no objetivos individuales."
  - "El riesgo cardiovascular global modifica la interpretación."
  - "No ofrece una recomendación de tratamiento."
---
```

> El bloque `evidence` y el `direccion` de `relacionado_con` son el **Contrato
> mínimo de evidencia (v0)**. Aquí aparece su forma corta (una tarjeta de
> interpretación bien establecida). La forma completa, las reglas de cuándo es
> obligatorio y el vocabulario controlado están en la sección **3 bis**.

### Reglas de los campos

| Campo | Regla |
|---|---|
| `title` | 3–240 caracteres. Debe identificar el tema y la intención. |
| `source_url` | URL oficial de la fuente principal. Es obligatorio aportar `source_url`, `doi` o `pmid`. |
| `source_language` | Idioma real de la fuente enlazada, no de la tarjeta. Usa código ISO breve: `de`, `en`, `es`, `zh`, etc. Para público alemán, prioriza `de` cuando exista una fuente equivalente y fiable. |
| `source_jurisdiction` | País o marco institucional principal de la fuente: `DE`, `EU`, `US`, `GB`, `INT`, etc. Puede ser lista. |
| `publication_date` | Fecha real de publicación o última revisión indicada visiblemente por la página concreta de la fuente. Formato `AAAA`, `AAAA-MM` o `AAAA-MM-DD`. No la inventes y no uses el encabezado HTTP `Last-Modified` como sustituto de una fecha editorial visible. |
| `source_kind` | Solo uno de los tres valores de la sección 8. |
| `source_type` | Usa `lab-interpretation-summary` para A, `nutrition-lifestyle-summary` para B, `lab-pattern-interpretation-summary` para D o `lab-longitudinal-interpretation-summary` para E. |
| `rights_status` | Solo `permitted`, `licensed`, `metadata-only` o `unknown`. No presupongas que acceso gratuito equivale a permiso. |
| `facets_version` | Versión de la taxonomía aplicada. Usa la versión vigente de `corpus-taxonomy.json`. |
| `tarjeta_id` | Identificador estable derivado de ruta/nombre de archivo sin `.md`, en minúsculas con guiones. |
| `dominio` | Dominio del corpus: normalmente `laboratorio` en este brief. Si el tema es transversal, usa el dominio definido en la taxonomía. |
| `tipo` | Naturaleza de la tarjeta según taxonomía: `analito`, `panel`, `vitamina`, `mineral`, `condicion`, `intervencion`, etc. Puede ser lista. |
| `marker` | Lista de marcadores canónicos en minúsculas-con-guiones. Si cubre varios (lectura conjunta, panel), declara todos: `[vitamina-d, calcio, fosfato, pth]`. Si es transversal, usa `[general]`. No uses alias como marker. |
| `categoria` | Categoría de laboratorio cuando aplique: `perfil-lipidico`, `glucemia-insulina`, `hematologia`, `perfil-tiroideo`, etc. Usa la taxonomía. |
| `muestra` | Tipo de muestra cuando aplique: `suero`, `plasma`, `sangre-total`, `orina`, `heces`, `saliva`, `cabello`. |
| `sistema` | Sistema fisiológico relacionado. Puede ser lista. Usa la taxonomía. |
| `area_de_salud` | Capa puente entre lenguaje del usuario y corpus: `energia-fatiga`, `salud-cardiovascular`, `control-glucemico`, etc. Puede ser lista. |
| `seccion` | Intención recuperable del fragmento: A=`interpretacion`, B=`alimentacion-factores`, D=`lectura-conjunta`, E=`seguimiento`. |
| `tradicion` | Solo cuando la tarjeta pertenezca claramente a una tradición identificable (`ayurveda`, `mtc`, `acupuntura`). No lo uses para prácticas complementarias modernas por defecto. |
| `alias` | Sinónimos y formas de búsqueda que puede escribir el usuario; no sustituyen a `marker`. |
| `relacionado_con` | Enlaces explícitos entre marcadores o intervenciones, con `id` canónico y `relacion` breve (`lectura_conjunta`, `mismo_panel`, `modifica_interpretacion`, `afecta_absorcion`, etc.). El `id` debe ser un **marcador canónico** de la taxonomía, no la clave de topic ni el nombre científico (p. ej. `huang-lian`, no `coptis-chinensis`). |
| `relacionado_con[].direccion` | `simetrica` (la relación vale en ambos sentidos: `mismo_panel`, `lectura_conjunta`) o `dirigida` (A influye sobre B: `modifica_interpretacion`, `se_calcula_con`, `afecta_absorcion`). Ver sección 3 bis. |
| `relacionado_con[].contexto` | Opcional. Texto breve: en qué condición aplica la relación (p. ej. "en inflamación"). |
| `evidence` | Contrato mínimo de evidencia (v0). Ver sección 3 bis. |
| `limitations` | Lista de 3–5 advertencias honestas sobre los límites del documento. Es el lugar de las afirmaciones que la fuente **no** permite sostener (no inventes un campo aparte). |

Usa ortografía y acentos correctos también en el frontmatter. El título se
muestra al usuario en las tarjetas de cita.

El modelo prepara un borrador. No declares que ha sido revisado o aprobado por
una persona; ese estado lo registra VitaMap durante la revisión administrativa.

### Fechas editoriales por fuente

- ODS/NIH no es una fuente única con una fecha única: cada ficha concreta
  (`Zinc`, `Magnesium`, `Iron`, etc.) puede tener su propio pie `Updated:`.
  Para `publication_date`, usa siempre esa línea visible de la ficha enlazada,
  no el encabezado HTTP `Last-Modified`, porque puede cambiar con redespliegues
  del CMS. Dos tarjetas ODS pueden tener fechas distintas si apuntan a fichas
  distintas; deben coincidir solo cuando apuntan a la misma URL.
- En MedlinePlus usa la fecha visible de la propia página de tema o prueba
  médica. No sustituyas esa fecha por metadatos técnicos del servidor.

## 3 bis. Contrato mínimo de evidencia (v0)

Esta es la **única parte nueva del frontmatter** respecto a versiones anteriores
del brief, y es **obligatoria para tarjetas nuevas**. No cambia cómo investigas:
hace legible por máquina la auditoría de la sección 7 que ya haces al leer la
fuente. Captúralo **ahora**, mientras tienes la fuente abierta; reconstruir la
certeza o el porqué de una relación más tarde obliga a releerlo todo.

Estos campos hoy **no se consumen** en la recuperación (son inertes hasta el
Tramo 2 de `docs/DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md`). Se capturan para
no tener que rellenarlos en una pasada futura. Su forma se valida en
`apps/web/scripts/test-marker-taxonomy.ts`: un valor fuera del vocabulario
rompe la build.

### El bloque `evidence`

```yaml
evidence:
  certeza: moderada          # alta | moderada | baja | muy-baja   (siempre)
  direccion: a-favor         # a-favor | en-contra | incierta      (solo si hay afirmación)
  poblacion: "adultos sanos" # texto libre, opcional (solo si la evidencia es población-específica)
  motivos_descenso:          # solo si certeza < alta; lista de los dominios de abajo
    - imprecision
    - evidencia-indirecta
```

- **`certeza`** (siempre): traduce los tres niveles de la sección 7. *Bien
  establecido* → `alta`; consistente pero con matices → `moderada`; señal real
  con límites serios → `baja`; apenas preliminar → `muy-baja`. La declara el
  editor **citando la fuente**, no es un cálculo propio de VitaMap.
- **`direccion`** (condicional): solo cuando la tarjeta sostiene una afirmación
  de eficacia o asociación (típico en C, D, E, evidencia moderna T3/M3/AC3).
  Una tarjeta puramente descriptiva (una A que explica "qué mide la GGT") **no
  lleva `direccion`**: no afirma un efecto.
- **`poblacion`** (opcional): solo si el resultado depende de la población
  (p. ej. umbral de ferritina en inflamación). En educación general, omítelo.
- **`motivos_descenso`** (solo si `certeza` no es `alta`): por qué no es mayor.
  Vocabulario controlado, alineado con los tipos de incertidumbre de la
  sección 7:

  | Valor | Tipo de incertidumbre (sección 7) |
  |---|---|
  | `riesgo-de-sesgo` | estudios con problemas de diseño o conducción |
  | `inconsistencia` | resultados que no concuerdan entre estudios |
  | `evidencia-indirecta` | población, intervención o desenlace distintos del de la tarjeta |
  | `imprecision` | muestras pequeñas, intervalos amplios |
  | `sesgo-de-publicacion` | probable falta de estudios negativos |

`certeza` **no es** lo mismo que la marca de terreno que ve el usuario. La marca
combina la certeza con la dependencia del contexto; un dato de `certeza: alta`
puede seguir siendo "cruce de caminos" si su lectura cambia con la persona. No
intentes fijar la marca aquí: solo declara la firmeza de la evidencia.

### `relacionado_con` con dirección

Añade `direccion` a cada relación (y `contexto` cuando ayude):

```yaml
relacionado_con:
  - id: huang-lian            # marcador CANÓNICO, nunca la clave de topic ni el nombre científico
    relacion: contiene_compuesto
    direccion: dirigida
  - id: glucosa-en-ayunas
    relacion: modifica_interpretacion
    direccion: dirigida
    contexto: "en seguimiento de control glucémico"
```

- `simetrica`: la relación vale en ambos sentidos (`mismo_panel`,
  `lectura_conjunta`, `misma_familia_analitica`).
- `dirigida`: una cosa influye sobre otra (`modifica_interpretacion`,
  `se_calcula_con`, `afecta_absorcion`, `precursor_dietetico`,
  `contiene_compuesto`).

### Ejemplo completo — tarjeta de evidencia con afirmación

```yaml
evidence:
  certeza: baja
  direccion: a-favor
  poblacion: "adultos con dislipemia"
  motivos_descenso:
    - riesgo-de-sesgo
    - inconsistencia
```

> Una afirmación de eficacia con `certeza: baja` debe leerse y redactarse como
> "horizonte abierto", no como promesa. El guardarraíl de la sección 6 manda: la
> etiqueta nunca debe sonar más firme que la evidencia. Rigor honesto, no
> precisión fingida.

### Reglas de facetado

1. Usa `corpus-taxonomy.json` como fuente de verdad. No inventes nuevos valores
   si ya existe un valor canónico.
2. Si el grupo existe, copia sus facets base y ajusta solo lo que la tarjeta
   requiera por intención o relación.
3. Si la tarjeta es D o E y relaciona varios marcadores, `marker` debe ser una
   lista con todos los marcadores relevantes.
4. No confundas alias con markers. Ejemplo: `INR` apunta a `tp-inr`; no es
   alias de `vitamina-k`.
5. `seccion` debe reflejar la intención de recuperación, no el tema general.
6. Si falta un grupo entero, entrega primero una propuesta de entrada para
   `corpus-taxonomy.json` antes de escribir tarjetas.
7. Si falta una relación importante, declárala en `relacionado_con` solo cuando
   la fuente la sostenga de forma expresa.
8. `area_de_salud` es el puente runtime para motivos de consulta difusos
   ("estoy cansado", "ánimo bajo"). Usa solo valores canónicos existentes. No
   escribas `query_groups` ni `health_area_routes` dentro de una tarjeta: esos
   campos viven únicamente en `corpus-taxonomy.json`. Si falta una ruta de
   motivo, propón primero la ampliación de taxonomía.

### Regla de idioma de fuente

VitaMap está orientado principalmente a usuarios en alemán, aunque también
responde en español. Cuando prepares una tarjeta:

1. Si existe una fuente alemana o europea equivalente, fiable y con derechos
   compatibles, prefierela para `source_url`.
2. No sustituyas una fuente fuerte por una alemana peor solo por idioma.
3. Si la mejor fuente está en inglés, úsala y declara `source_language: en`.
4. Añade términos alemanes útiles en el cuerpo cuando mejoren la recuperación,
   pero no finjas que la fuente enlazada está en alemán.
5. Para Alemania/UE prioriza, cuando corresponda: IQWiG/Gesundheitsinformation,
   RKI, BfR, BfArM, G-BA, AWMF, EMA/EFSA y sociedades europeas o alemanas.

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

Cuando se solicite expresamente una **tarjeta A multinivel**, aplica además
`corpus-preparation/MODULO-TARJETA-A-MULTINIVEL.md`. Ese módulo sustituye solo
la estructura de encabezados y la longitud orientativa de la tarjeta A; no
modifica las reglas de fuentes, derechos, taxonomía, evidencia o seguridad de
este brief. No improvises el formato multinivel sin leerlo completo.

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
Explica los límites de un valor aislado sin diagnosticar. Distingue, cuando sea
pertinente, entre lo que la prueba mide con solidez y lo que todavía necesita
contexto, otras pruebas o confirmación.

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
Explica la frontera del conocimiento en lenguaje cotidiano, sin convertir la
tarjeta en una discusión entre especialistas.

## Alcance
Aclara que la información general no es una pauta personalizada.

## Fuente principal
Cita completa y URL oficial.
```

Esta tarjeta puede explicar relaciones generales, pero no debe contestar "qué
debo hacer yo", diseñar dietas, prescribir ejercicio ni sugerir dosis.

---

## 5 bis. Tarjeta D — Lectura conjunta

Solo créala cuando una fuente declarada describa de forma expresa por qué varios
marcadores se leen juntos o qué aporta su combinación. No construyas patrones,
cocientes, umbrales ni árboles diagnósticos a partir de conocimiento de memoria.

Responde a preguntas como:

- "¿Por qué me han pedido estos marcadores a la vez?"
- "¿Cómo se lee este panel como conjunto?"
- "¿Qué añade un marcador a la interpretación de otro?"

### Estructura

```markdown
# [Panel o relación]: cómo se leen juntos [marcadores]

## Qué marcadores forman el grupo
Nombra todos los marcadores que la tarjeta relaciona.

## Por qué se leen juntos
Explica qué información aporta el patrón que no aporta una cifra aislada.

## Qué patrones generales ayudan a orientar
Describe solo relaciones presentadas expresamente por las fuentes. Usa lenguaje
de orientación, nunca de diagnóstico.

## Qué no permite concluir el conjunto
Explica qué causas, decisiones o conclusiones siguen necesitando síntomas,
antecedentes, medicación, otras pruebas o criterio profesional.

## Fuente principal
Cita completa y URL oficial.
```

Reglas propias:

1. La tarjeta es relacional y educativa; no interpreta el caso concreto de una
   persona.
2. Cada relación debe estar respaldada expresamente por una fuente declarada.
3. No introduzcas cocientes ni puntos de corte salvo que la fuente los publique.
4. Un patrón puede acotar el terreno, pero no nombrar por sí solo una enfermedad.
5. Aborda un solo panel o relación principal por tarjeta.
6. Longitud orientativa: 300–550 palabras.

Usa `source_type: lab-pattern-interpretation-summary`. El módulo
`BRIEF-TARJETA-D-lectura-conjunta.md` desarrolla estas reglas.

---

## 5 ter. Tarjeta E — Seguimiento temporal

La tarjeta E explica cómo pensar una secuencia de mediciones. No calcula ni
interpreta la tendencia concreta de una persona: aporta el conocimiento general
necesario para distinguir un cambio potencialmente informativo de una
comparación engañosa.

Solo créala cuando una fuente declarada permita explicar uno o varios de estos
aspectos:

- variabilidad biológica dentro de una misma persona;
- comparabilidad entre laboratorios, métodos, unidades o condiciones de toma;
- diferencia entre una medición aislada y un cambio persistente;
- utilidad y límites del seguimiento seriado del marcador.

Responde a preguntas como:

- "¿Importa más este valor o cómo ha cambiado?"
- "¿Se pueden comparar estas dos analíticas?"
- "¿Qué diferencia hay entre una oscilación y una tendencia?"
- "¿Un resultado estable significa que todo está bien?"

### Estructura

```markdown
# [Marcador o grupo]: cómo interpretar cambios con el tiempo

## Qué puede aportar una serie temporal
Explica qué añade disponer de varias mediciones fechadas.

## Cuándo son comparables dos resultados
Describe unidades, método, laboratorio, preparación y contexto relevantes.

## Cómo distinguir cambio, variación y persistencia
Explica los conceptos respaldados por la fuente sin inventar porcentajes de
cambio significativo.

## Qué no permite concluir una tendencia
Aclara que estabilidad no equivale necesariamente a salud y cambio no equivale
por sí solo a empeoramiento, mejoría o causa concreta.

## Fuente principal
Cita completa y URL oficial.
```

Reglas propias:

1. No llames "tendencia" a dos cifras sin fechas y condiciones mínimamente
   comparables.
2. No conviertas una diferencia numérica en cambio clínicamente significativo
   salvo que una fuente aplicable defina ese criterio.
3. Señala cambios de unidad, método, laboratorio, ayuno, hora, enfermedad aguda,
   embarazo o medicación cuando la fuente los considere relevantes.
4. No extrapoles una dirección futura a partir de pocos puntos.
5. Distingue valor estable, oscilación, cambio sostenido y dato no comparable.
6. Longitud orientativa: 250–500 palabras.

Usa `source_type: lab-longitudinal-interpretation-summary`. El módulo
`BRIEF-TARJETA-E-seguimiento-temporal.md` desarrolla estas reglas.

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

## 7. Cómo representar la frontera científica

La ciencia no debe presentarse ni como una colección de verdades cerradas ni
como una disputa permanente donde todo vale lo mismo. La persona necesita
entender hasta dónde llega cada afirmación sin tener que seguir el debate
académico.

Cuando el tema lo requiera, organiza internamente la evidencia en tres niveles:

1. **Bien establecido:** qué mide la prueba, qué mecanismo está aceptado o qué
   asociación está respaldada de forma consistente.
2. **Dependiente del contexto:** qué cambia según método, laboratorio,
   población, preparación, síntomas, medicación o combinación con otros datos.
3. **Abierto o emergente:** qué señal es plausible o está siendo investigada,
   pero todavía no permite una conclusión clínica general.

No es necesario mostrar estas tres etiquetas literalmente. Exprésalas en uno o
dos párrafos claros. Una formulación útil puede ser:

> Sabemos medir X con bastante precisión. Lo que este resultado no permite
> saber por sí solo es Y, porque varias situaciones pueden producir el mismo
> patrón.

### Tipos de incertidumbre que no deben mezclarse

- **Variabilidad biológica:** el valor cambia realmente dentro de una misma
  persona.
- **Variabilidad preanalítica o analítica:** influyen extracción, postura,
  ayuno, hora, tubo, transporte, método o laboratorio.
- **Falta de especificidad:** el marcador es real, pero varias causas producen
  el mismo resultado.
- **Desacuerdo entre criterios:** distintas guías usan umbrales o propósitos
  diferentes.
- **Evidencia emergente:** existe una señal inicial, pero faltan replicación,
  tamaño, duración o resultados clínicos.

No uses la incertidumbre para asustar ni para desacreditar la ciencia. Tampoco
la ocultes. Su función es evitar espejismos: asociaciones convertidas en causas,
mecanismos convertidos en tratamientos o resultados de grupo convertidos en
promesas individuales.

### Auditoría antes de redactar

Antes de crear una tarjeta, busca respuesta documentada a estas preguntas:

1. ¿Qué mide exactamente la prueba y qué no mide?
2. ¿El resultado es medido directamente o calculado?
3. ¿Qué factores fisiológicos, preanalíticos o medicamentosos pueden alterarlo?
4. ¿Existe un artefacto conocido capaz de producir un resultado falso?
5. ¿Qué otros marcadores suelen aportar contexto?
6. ¿La fuente habla de cantidad, función, asociación, riesgo o desenlace
   clínico? No los trates como equivalentes.
7. ¿Dónde está la frontera actual y cómo puede explicarse sin jerga?

---

## 8. El valor de `source_kind`

| Valor | Cuándo usarlo | `source_type` típico |
|---|---|---|
| `institutional-education` | Información de organismos públicos de salud como NIH, NIDDK, MedlinePlus, CDC, OMS o IQWiG. Será el más común. | `lab-interpretation-summary`, `nutrition-lifestyle-summary`, `lab-pattern-interpretation-summary`, `lab-longitudinal-interpretation-summary` |
| `clinical-evidence` | Guías clínicas formales, revisiones sistemáticas o consensos científicos. | `clinical-guideline`, `systematic-review`, `scientific-consensus` |
| `tradition-context` | Perspectivas sobre Ayurveda, MTC, acupuntura u otras tradiciones. No se usa en este brief. | `traditional-perspective-summary` |

No clasifiques una página institucional como `clinical-evidence` solo porque
sea fiable. La clasificación describe el tipo de documento.

---

## 9. Cobertura priorizada

Para cada marcador produce primero la tarjeta A. Produce la B solo cuando
exista una fuente apropiada y la intención sea claramente distinta.

Las tarjetas D y E tampoco son cuotas. Antes de producirlas, realiza una
auditoría de cobertura:

| Dimensión | Pregunta |
|---|---|
| Interpretación individual | ¿Existe una tarjeta A suficiente? |
| Relación | ¿Qué otros marcadores o paneles aportan contexto documentado? |
| Temporalidad | ¿La fuente explica variabilidad, comparabilidad o seguimiento? |
| Límite | ¿Qué no puede concluirse ni siquiera al combinar o seguir los datos? |

### Fase previa obligatoria cuando se amplía corpus

Antes de redactar material nuevo, entrega una mini-auditoría:

```text
Grupo: [topic/carpeta]
Estado en taxonomía: existe / falta entrada
Tarjetas existentes revisadas: A / B / C / D / E / tradición / seguridad
Hueco que se propone cubrir: [intención concreta]
Motivo de recuperación: [qué consulta del usuario debería encontrar esta tarjeta]
Facets base: [marker, categoria, sistema, area_de_salud, seccion]
Relaciones necesarias: [relacionado_con o "ninguna"]
Fuente candidata: [URL/DOI/PMID]
Decisión: redactar / no redactar / proponer entrada de taxonomía
```

Si el grupo falta en `corpus-taxonomy.json`, no redactes todavía como si el
grupo existiera. Propón primero:

```json
{
  "nuevo_topic": {
    "dominio": "laboratorio",
    "tipo": ["analito"],
    "marker": ["nuevo-marker"],
    "categoria": ["categoria-canónica-o-propuesta"],
    "muestra": ["suero"],
    "sistema": ["sistema"],
    "area_de_salud": ["area"],
    "alias": ["sinónimo frecuente"],
    "relacionado_con": [
      { "id": "marker-relacionado", "relacion": "lectura_conjunta" }
    ]
  }
}
```

Marca explícitamente los huecos no cubiertos. No rellenes un hueco solo porque
parezca lógico: debe haber fuente apropiada, derechos compatibles e intención
distinta.

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

### Tarjetas D prioritarias

- Perfil lipídico: colesterol total, LDL, HDL, no HDL y triglicéridos
- Panel hepático: ALT/GPT, AST/GOT, GGT, fosfatasa alcalina y bilirrubina
- Función renal: creatinina, eGFR y, cuando la fuente lo contemple, albuminuria
- Hemograma: hemoglobina, hematocrito, VCM y otros índices eritrocitarios
- Leucocitos y fórmula leucocitaria
- Glucosa en ayunas y HbA1c
- TSH y T4 libre

### Tarjetas E prioritarias

- Creatinina y eGFR: valor aislado frente a evolución
- HbA1c: ventana temporal y cambios que tardan en reflejarse
- TSH y T4 libre: seguimiento y condiciones de comparabilidad
- Perfil lipídico: comparación entre mediciones y condiciones de la muestra
- Hemoglobina y hematocrito: variación, hidratación y persistencia
- Vitamina D: comparabilidad entre métodos y laboratorios

---

## 10. Fuentes preferentes

Prioriza fuentes oficiales, públicas y verificables.

| Fuente | Ideal para |
|---|---|
| MedlinePlus | Pruebas de laboratorio y educación sanitaria |
| NIDDK | Diabetes, riñón y aparato digestivo |
| NIH Office of Dietary Supplements | Vitaminas y minerales |
| CDC | Salud general y prevención |
| OMS / WHO | Criterios y educación sanitaria global |
| IQWiG / Gesundheitsinformation.de | Información sanitaria en contexto alemán |
| RKI, BfR, BfArM, G-BA, AWMF | Contexto alemán, seguridad, regulación, guías y salud pública |
| EMA / EFSA / Comisión Europea | Contexto europeo, medicamentos, seguridad alimentaria y regulación |
| USDA FoodData Central | Composición de alimentos |
| IFCC, EFLM, ADLM y sociedades de medicina de laboratorio | Variabilidad biológica, métodos, interferencias y fase preanalítica |
| Academias y sociedades profesionales nacionales | Guías, consensos y estándares dentro de su ámbito |
| Universidades y hospitales académicos | Explicaciones especializadas cuando identifican autoría, revisión y fecha |
| PubMed Central y revistas de acceso abierto | Revisiones y estudios para preguntas que las fuentes institucionales no resuelven |

Redacta en español. Si un término alemán puede mejorar la recuperación,
añádelo entre paréntesis en la primera sección.

En MedlinePlus prioriza páginas de temas de salud y de pruebas médicas. Excluye
la A.D.A.M. Medical Encyclopedia (`/ency/article/`) salvo que exista una licencia
expresa para VitaMap.

Las páginas de universidades, laboratorios y sociedades no son automáticamente
fuentes publicables: comprueba autoría, revisión editorial, fecha y derechos.
Para una afirmación clínica importante, prioriza una guía, revisión sistemática
o fuente institucional sobre una explicación comercial de laboratorio.

Una publicación científica no debe añadirse solo porque sea reciente. Úsala
cuando responda una pregunta concreta sobre método, interferencia, variabilidad
o frontera del conocimiento. Comprueba si sus resultados son directamente
aplicables al marcador, la muestra y la población de la tarjeta.

---

## 11. Checklist de calidad

- [ ] La tarjeta es A, B, D o E y responde a una intención reconocible.
- [ ] No existe ya otra tarjeta equivalente en el lote.
- [ ] El frontmatter contiene campos compatibles con VitaMap y facets del vocabulario canónico.
- [ ] Si el topic falta en `corpus-taxonomy.json`, se propone entrada de taxonomía antes de redactar.
- [ ] `marker`, `categoria`, `sistema`, `area_de_salud`, `seccion`, `alias` y `relacionado_con` son coherentes con la taxonomía.
- [ ] Cada `relacionado_con[].id` es un marcador canónico (no la clave de topic ni el nombre científico) y declara `direccion` (`simetrica`/`dirigida`).
- [ ] Incluye el bloque `evidence` con `certeza` (Contrato mínimo v0, sección 3 bis); `direccion` solo si hay afirmación; `motivos_descenso` si `certeza` no es `alta`.
- [ ] `source_kind` y `source_type` corresponden al documento real.
- [ ] `rights_status` refleja derechos comprobados.
- [ ] La fuente no prohíbe derivados, embeddings, indexación o uso en RAG.
- [ ] `source_url` apunta a la fuente principal real y vigente.
- [ ] `source_language` y `source_jurisdiction` describen la fuente enlazada.
- [ ] Para público alemán, se ha comprobado si existe una fuente DE/EU equivalente.
- [ ] `publication_date` coincide con la fecha indicada por la fuente.
- [ ] Cada afirmación importante puede comprobarse en una fuente declarada.
- [ ] Los rangos aparecen solo si la fuente los publica y están atribuidos.
- [ ] No contiene diagnósticos ni recomendaciones de tratamiento o dosis.
- [ ] No mezcla en una tarjeta interpretación individual, hábitos, curiosidad,
      lectura conjunta, seguimiento temporal o tradición.
- [ ] Si es D, cada relación entre marcadores está respaldada de forma expresa.
- [ ] Si es E, distingue cambio observado, variación y comparabilidad.
- [ ] No interpreta un patrón o una tendencia personal dentro del corpus general.
- [ ] Distingue cantidad, función, asociación, mecanismo y beneficio clínico.
- [ ] Explica la incertidumbre relevante sin exagerarla ni ocultarla.
- [ ] Ha comprobado interferencias, artefactos y factores preanalíticos pertinentes.
- [ ] Incluye 3–5 limitaciones honestas.
- [ ] Incluye `## Fuente principal` con cita y URL.

---

## 12. Formato de entrega

Antes de cada lote indica la auditoría de cobertura. Antes de cada documento
indica:

```text
Tarjeta: A · Interpretación
Preguntas que pretende responder:
- ¿Qué mide la glucosa en ayunas?
- ¿Cómo se interpreta de forma general?
Facets clave:
- marker: [glucosa-en-ayunas]
- seccion: interpretacion
- area_de_salud: [control-glucemico, energia-fatiga]
```

Después entrega un bloque de código Markdown con el archivo completo.

Nombres:

```text
[tema]-interpretacion-[fuente].md
[tema]-alimentacion-factores-[fuente].md
[panel-o-grupo]-lectura-conjunta-[fuente].md
[tema]-seguimiento-temporal-[fuente].md
```

Usa minúsculas, sin tildes y con guiones en el nombre del archivo.
