# Brief especializado — Vitaminas y micronutrientes para el corpus RAG

## 1. Propósito y autoridad

Este módulo se utiliza para investigar **una vitamina o micronutriente por vez**
y preparar tarjetas educativas para VitaMap.

Complementa:

- `PROMPT-INVESTIGACION-RAG.md`, que define arquitectura A/B/D/E, seguridad,
  frontmatter facetado, derechos y formato de entrega;
- `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`, que define la tarjeta C;
- `BRIEF-TARJETA-D-lectura-conjunta.md`, para relaciones entre marcadores;
- `BRIEF-TARJETA-E-seguimiento-temporal.md`, para cambios entre mediciones.

Si este módulo difiere del brief principal, **prevalece
`PROMPT-INVESTIGACION-RAG.md`**. Este archivo no sustituye ni modifica sus
reglas.

Usa siempre `corpus-preparation/corpus-taxonomy.json` como vocabulario canónico
para `marker`, `categoria`, `muestra`, `sistema`, `area_de_salud`, `alias` y
`relacionado_con`. Si el nutriente, analito o panel falta en la taxonomía,
propón primero la entrada de topic antes de redactar tarjetas.

**Principio rector:**

> Una vitamina puede existir en varias formas químicas, proceder de alimentos o
> suplementos y medirse mediante uno o varios biomarcadores. Ingesta, absorción,
> concentración sanguínea, reservas, función biológica y resultado clínico son
> dimensiones relacionadas, pero no equivalentes.

El objetivo es que la persona comprenda:

- qué sustancia o metabolito aparece realmente en su analítica;
- qué puede y qué no puede decir ese resultado;
- en qué alimentos se encuentra el nutriente y bajo qué formas;
- qué modifica su absorción, utilización y medición;
- cómo se relaciona con otros marcadores;
- qué cambia al comparar resultados en el tiempo;
- por qué déficit, suficiencia, ingesta recomendada y toxicidad no son una misma
  escala.

---

## 2. Alcance

El módulo se aplica principalmente a:

- vitamina A y carotenoides provitamina A;
- vitaminas B1, B2, B3, B5, B6, B7, B9 y B12;
- vitamina C;
- vitamina D;
- vitamina E;
- vitamina K.

También puede adaptarse a minerales y otros micronutrientes esenciales, pero
solo cuando la instrucción los nombre expresamente. No presupongas que las
formas químicas, biomarcadores o reglas de las vitaminas se trasladan a un
mineral.

Este módulo no se utiliza para:

- plantas, hongos, algas o productos botánicos: usa
  `PROMPT-INVESTIGACION-RAG-ESPECIES-MEDICINALES.md`;
- evaluar una marca o producto comercial concreto;
- prescribir suplementos, dosis o pautas de tratamiento;
- convertir un nutriente en explicación universal de síntomas;
- producir tarjetas sobre una vitamina que no tenga relación con la analítica o
  con una intención educativa documentada.

---

## 3. Entrada de trabajo

Antes de investigar, completa este bloque:

```text
Tema:
Vitamina o micronutriente:
Marcador o nombre tal como aparece en la analítica:
Tipo de muestra, si se conoce:
Unidad, si se conoce:
País o contexto regulatorio relevante:
Carpeta del dossier existente:
Estado en corpus-taxonomy.json: existe / falta entrada / requiere ampliar
Tarjetas ya existentes:
Preguntas prioritarias del usuario:
```

Si el marcador no está definido, no empieces redactando una tarjeta. Primero
determina qué pruebas podrían corresponder al nombre solicitado y comunica la
ambigüedad.

Ejemplo:

```text
Tema: vitamina A
Vitamina o micronutriente: vitamina A
Marcador o nombre tal como aparece en la analítica: retinol
Tipo de muestra: suero
Unidad: µmol/L
País o contexto regulatorio relevante: España/Alemania
Carpeta del dossier existente: vitamina-a
Tarjetas ya existentes: ninguna
Preguntas prioritarias del usuario:
- ¿Qué mide el retinol?
- ¿Qué alimentos aportan vitamina A?
- ¿Es lo mismo retinol que betacaroteno?
```

---

## 4. Puerta de identidad del nutriente

No investigues alimentos, déficit o toxicidad antes de aclarar la identidad.

Responde internamente:

1. ¿Cuál es el nombre común y cuál es el nombre químico o familia química?
2. ¿Existe una sola molécula o un conjunto de vitámeros?
3. ¿Hay formas activas, precursoras, de almacenamiento o metabolitos?
4. ¿La forma presente en alimentos animales es la misma que la de alimentos
   vegetales?
5. ¿La forma de suplementos coincide con la alimentaria?
6. ¿Existen nombres comerciales o abreviaturas que puedan confundirse con el
   nutriente?
7. ¿La analítica mide la vitamina, un metabolito, una proteína transportadora,
   un producto funcional o una consecuencia indirecta?
8. ¿La fuente distingue con claridad esas formas?

No agrupes formas distintas bajo una sola palabra si esa simplificación cambia
la interpretación.

Ejemplos de distinciones que deben investigarse cuando correspondan:

- retinol, ésteres de retinilo y carotenoides provitamina A;
- vitamina D2, D3, 25(OH)D y 1,25(OH)2D;
- folato alimentario, ácido fólico y folato sérico o eritrocitario;
- cobalaminas totales, ácido metilmalónico, homocisteína y
  holotranscobalamina;
- alfa-tocoferol frente a otras formas de vitamina E;
- filoquinona, menaquinonas y pruebas indirectas relacionadas con vitamina K;
- piridoxal-5-fosfato y otras formas de vitamina B6.

Los ejemplos orientan la búsqueda. No conviertas la lista en afirmaciones de la
tarjeta sin una fuente declarada.

---

## 5. Puerta de identidad analítica

Antes de crear una tarjeta A, documenta:

| Pregunta | Respuesta necesaria |
|---|---|
| ¿Qué mide exactamente el laboratorio? | Sustancia, metabolito o prueba funcional |
| ¿En qué muestra? | Suero, plasma, sangre total, eritrocitos, orina u otra |
| ¿Cómo se expresa? | Unidad y formato del informe |
| ¿Es directo o indirecto? | Medición directa, cálculo o indicador funcional |
| ¿Qué periodo refleja? | Ingesta reciente, concentración circulante, reservas o estado más prolongado |
| ¿Qué método se usa? | Solo cuando la fuente muestre que cambia la comparación |
| ¿Qué altera el resultado? | Ayuno, hora, inflamación, función renal o hepática, embarazo, medicación, suplementos, transporte o almacenamiento |
| ¿Existe una prueba confirmatoria? | Solo si una fuente explica cuándo aporta información distinta |

### Regla de marcador real

La tarjeta A debe corresponder al **nombre que puede aparecer en una analítica**,
no a la vitamina como concepto abstracto.

Ejemplos de títulos posibles:

```text
Vitamina D (25-OH): interpretación general del análisis
Retinol sérico: interpretación general de la vitamina A
Folato sérico y folato eritrocitario: diferencias de interpretación
Vitamina B12: interpretación general del análisis
```

No crees una tarjeta A genérica si no existe una prueba suficientemente definida
o si la medición no es habitual ni interpretable con las fuentes disponibles.
En ese caso entrega:

```text
No se recomienda todavía una tarjeta A.
Motivo: no se ha identificado un marcador de laboratorio suficientemente
definido o una fuente publicable que explique su interpretación.
```

---

## 6. Distinciones que deben permanecer separadas

### 6.1 Ingesta no es concentración

Que una persona consuma un alimento no permite predecir directamente su valor en
sangre. Entre ambos intervienen:

- forma química;
- cantidad real consumida;
- preparación y procesado;
- absorción intestinal;
- transporte;
- almacenamiento;
- conversión metabólica;
- función renal y hepática;
- inflamación;
- medicamentos y suplementos;
- variación individual.

### 6.2 Concentración no es reserva

Un valor circulante puede responder a ingesta reciente, regulación fisiológica o
redistribución y no representar de manera directa las reservas corporales.
Explica esta diferencia solo cuando la fuente la documente para el marcador.

### 6.3 Reserva no es función

La cantidad disponible de un nutriente no demuestra por sí sola que todas las
funciones dependientes de él sean normales. Una prueba funcional tampoco debe
presentarse automáticamente como medición directa de la vitamina.

### 6.4 Necesidad nutricional no es rango de laboratorio

No confundas:

- ingesta dietética recomendada o referencia poblacional;
- valor diario de una etiqueta;
- límite máximo tolerable de ingesta;
- intervalo de referencia del laboratorio;
- umbral utilizado por una guía para una finalidad concreta;
- concentración asociada a toxicidad;
- objetivo individual.

Una cifra de ingesta no interpreta una concentración sanguínea y un punto de
corte analítico no prescribe una dosis.

### 6.5 Asociación no es beneficio

Que una concentración baja se asocie con una enfermedad no demuestra que
suplementar prevenga o trate esa enfermedad. Separa:

```text
papel fisiológico
≠ asociación observacional
≠ corrección de una carencia
≠ beneficio clínico en personas sin carencia
```

---

## 7. Auditoría de cobertura antes de redactar

Revisa primero el dossier y las carpetas relacionadas. No dupliques una tarjeta
porque el mismo nutriente aparezca en varios contextos.

Completa esta matriz:

| Dimensión | Pregunta |
|---|---|
| Identidad | ¿Se distinguen las formas químicas relevantes? |
| Analítica | ¿Existe una tarjeta A del marcador exacto? |
| Alimentación | ¿Existe una B claramente distinta y útil? |
| Biodisponibilidad | ¿Se explica absorción y utilización sin convertirlo en consejo? |
| Fortificación | ¿Se distingue alimento natural, enriquecido y suplemento? |
| Seguridad | ¿Se separan déficit, exceso e interacciones? |
| Relación | ¿Existe una relación documentada con otros marcadores? |
| Temporalidad | ¿La fuente explica qué cambia rápido o lentamente y cuándo dos resultados son comparables? |
| Curiosidad | ¿Hay una idea C distinta que mejore la comprensión? |
| Duplicación | ¿La información ya vive en otro dossier y basta con una referencia breve? |

Después propone únicamente las tarjetas necesarias.

---

## 8. Tarjeta A — Interpretación especializada

Sigue la estructura A del brief principal y añade, cuando sea aplicable:

### En `Qué mide esta prueba`

- nombre exacto del analito;
- formas o metabolitos que incluye y excluye;
- tipo de muestra;
- diferencia entre medición directa e indicador indirecto;
- aspecto del estado nutricional que pretende representar.

### En `Cómo se interpreta de forma general`

- usa primero el intervalo del laboratorio;
- incluye puntos de corte solo cuando la fuente los publique y atribúyelos;
- conserva la unidad original;
- ofrece conversiones únicamente si una fuente o una conversión dimensional
  inequívoca permite hacerlo sin alterar el significado;
- distingue bajo, alto, insuficiente, deficiente, adecuado o tóxico solo como los
  defina la fuente;
- aclara si distintas organizaciones utilizan criterios diferentes para
  propósitos distintos.

### En `Qué puede cambiar la interpretación`

Investiga:

- ingesta o suplementos recientes;
- ayuno y hora de extracción;
- embarazo y edad;
- inflamación;
- malabsorción;
- función renal o hepática;
- proteínas transportadoras;
- medicamentos;
- método de laboratorio;
- exposición ambiental relevante, como luz solar para vitamina D;
- artefactos e interferencias.

### En `Qué no permite concluir por sí solo`

Aclara:

- si el resultado no identifica la causa;
- si un valor normal no excluye una carencia funcional;
- si una cifra baja no demuestra ingesta insuficiente;
- si una cifra alta no equivale automáticamente a toxicidad;
- qué prueba relacionada añade una dimensión diferente.

No conviertas esta última sección en una lista extensa de enfermedades.

---

## 9. Tarjeta B — Alimentación, absorción y factores

Para vitaminas, la tarjeta B debe ser más específica que la plantilla general.
Solo créala si existe una fuente oficial que permita responder de forma útil.

### Preguntas que pretende responder

- "¿Qué alimentos contienen esta vitamina?"
- "¿Está en la misma forma en alimentos animales y vegetales?"
- "¿Se absorbe igual de todas las fuentes?"
- "¿Qué diferencia hay entre un alimento natural, uno fortificado y un
  suplemento?"
- "¿Qué situaciones dificultan su absorción o utilización?"

### Estructura

```markdown
# [Vitamina]: alimentos, formas y factores de absorción

## Qué formas aporta la alimentación
Explica las formas químicas relevantes y si el organismo necesita convertirlas.

## Fuentes alimentarias
Agrupa alimentos representativos. Distingue fuentes naturales y fortificadas.

## Qué modifica la absorción o utilización
Describe biodisponibilidad, preparación, grasa dietética, interacciones,
malabsorción, medicamentos u otros factores solo cuando la fuente los respalde.

## Alimentos, fortificación y suplementos no son equivalentes
Explica diferencias de forma, concentración, previsibilidad y riesgo sin
recomendar productos ni dosis.

## Qué se sabe y qué no
Separa composición alimentaria, absorción, modificación del marcador y beneficio
clínico.

## Alcance
Aclara que no es una dieta, tratamiento ni pauta de suplementación.

## Fuente principal
Cita y URL oficial.
```

### Reglas para alimentos

1. Prioriza categorías comprensibles antes que largas tablas.
2. Si incluyes cantidades, usa una fuente oficial de composición y conserva
   ración, unidad, estado del alimento y procedencia.
3. No presentes una cantidad puntual como propiedad universal del alimento.
4. No uses "mejor fuente" sin criterio explícito.
5. Distingue alimento crudo, cocinado, seco, fortificado o enriquecido cuando
   cambie la cantidad.
6. No supongas que la fortificación es igual en todos los países.
7. Indica que la etiqueta del producto concreto es la referencia para alimentos
   fortificados.
8. No conviertas una lista de alimentos en recomendación de consumo.
9. No afirmes que un alimento normalizará una analítica.
10. No confundas presencia química con biodisponibilidad.

### Equivalentes nutricionales

Algunas vitaminas utilizan unidades que integran actividad o biodisponibilidad,
por ejemplo equivalentes dietéticos. Inclúyelas solo si:

- la fuente oficial las define;
- explicarlas ayuda a entender alimentos o etiquetas;
- puedes distinguirlas de la unidad del laboratorio;
- no las conviertes en una dosis individual.

---

## 10. Suplementos, fortificación y seguridad

El tema de suplementos puede aparecer en A o B como contexto, pero no debe ocupar
la tarjeta completa salvo que exista una intención separada y el brief principal
permita esa categoría.

Mantén estas fronteras:

- alimento natural no equivale a alimento fortificado;
- alimento fortificado no equivale a suplemento;
- una forma química de suplemento no es automáticamente superior a otra;
- mayor biodisponibilidad no significa mayor beneficio clínico;
- corregir una carencia no demuestra beneficio de dosis altas en personas sin
  carencia;
- "natural" no significa seguro;
- una ingesta máxima tolerable no es una meta;
- toxicidad por suplemento no implica el mismo riesgo en alimentos;
- las formas, dosis y vías de administración no son intercambiables.

Investiga, cuando corresponda:

- riesgo de acumulación;
- interacciones con medicamentos;
- enmascaramiento de otra carencia;
- interferencia con pruebas de laboratorio;
- embarazo y lactancia;
- enfermedad renal o hepática;
- cirugía digestiva o malabsorción;
- exposición simultánea desde varios productos;
- diferencia entre uso oral, inyectable u otra vía.

No indiques que una persona debe iniciar, suspender o cambiar un suplemento.

---

## 11. Tarjeta C — Curiosidad científica

Usa `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`.

La curiosidad debe aportar una sola idea que no repita A o B. Son buenos
ángulos:

- por qué el análisis mide un metabolito y no la vitamina de partida;
- cómo una forma precursora se convierte en activa;
- por qué una vitamina necesita transportadores;
- por qué el cuerpo almacena algunas vitaminas y otras se eliminan con mayor
  rapidez;
- por qué una prueba funcional puede cambiar antes o después que la
  concentración;
- por qué una forma presente en un alimento no equivale a la misma actividad
  biológica.

Evita curiosidades basadas únicamente en etimología, marketing o récords
alimentarios si no mejoran la comprensión de la analítica.

---

## 12. Tarjeta D — Relación con otros marcadores

Usa el brief D y crea la tarjeta solo cuando una fuente describa expresamente la
relación.

Antes de redactar, clasifica cada marcador:

| Función en la relación | Ejemplo abstracto |
|---|---|
| Marcador principal | Concentración de la vitamina o metabolito |
| Marcador confirmatorio | Prueba que ayuda a confirmar estado funcional |
| Marcador de contexto | Función renal, hepática, inflamación o transporte |
| Consecuencia relacionada | Hemograma, mineral o prueba funcional |
| Factor de confusión | Marcador que cambia la interpretación |

No basta con que dos sustancias compartan una vía bioquímica. La fuente debe
explicar qué añade una medición a la otra.

Relaciones que pueden investigarse, sin asumirlas:

- B12, ácido metilmalónico, homocisteína, folato y hemograma;
- folato sérico, folato eritrocitario, B12 y VCM;
- 25(OH)D, calcio, fosfato, PTH y función renal;
- retinol, inflamación, proteínas transportadoras y función hepática;
- vitamina E y contexto lipídico;
- pruebas relacionadas con coagulación y vitamina K, dejando claro si son
  indirectas.

No produzcas una tarjeta D si la relación solo puede construirse mediante
conocimiento general no declarado.

---

## 13. Tarjeta E — Seguimiento temporal

Usa el brief E. Para vitaminas, investiga además:

- qué periodo refleja el biomarcador;
- si responde rápido a comidas o suplementos recientes;
- si existen reservas que amortiguan el cambio;
- si la vida media o velocidad de respuesta depende de una situación clínica;
- si el método o laboratorio dificultan comparar resultados;
- si el seguimiento usa siempre el mismo analito o cambia entre formas;
- si la fuente permite distinguir cambio de ingesta, redistribución y cambio de
  reservas.

No deduzcas una velocidad de corrección, una frecuencia de control ni una
respuesta esperada a partir de fisiología general.

Una tarjeta E no debe decir:

```text
Este valor debería subir en X semanas.
Repita la analítica en X meses.
Esta tendencia demuestra que el suplemento funciona.
```

Solo puede describir plazos o estrategias de seguimiento cuando una fuente
aplicable los presente de forma general y atribuida, sin convertirlos en pauta
personalizada.

---

## 14. Casos que requieren cautela especial

Esta tabla orienta la investigación; no sustituye las fuentes.

| Tema | Distinción que debe comprobarse |
|---|---|
| Vitamina A | Retinol preformado, carotenoides provitamina A, equivalentes nutricionales, inflamación y función hepática |
| Vitamina B1 | Forma medida y diferencia entre concentración y prueba funcional |
| Vitamina B2 | Biomarcador utilizado y dependencia del método |
| Vitamina B3 | Niacina alimentaria, síntesis desde triptófano y equivalentes de niacina |
| Vitamina B5 | Disponibilidad de una prueba clínica útil antes de crear A |
| Vitamina B6 | Forma medida, función renal, inflamación y exposición a suplementos |
| Biotina | Interferencia de suplementos con otras pruebas de laboratorio |
| Folato/B9 | Folato natural, ácido fólico, fortificación, equivalentes dietéticos, suero frente a eritrocitos y relación con B12 |
| Vitamina B12 | Concentración total, marcadores funcionales, absorción, medicamentos y función renal |
| Vitamina C | Sensibilidad a ingesta reciente, muestra, manipulación y almacenamiento |
| Vitamina D | D2/D3, 25(OH)D frente a forma activa, método, calcio/PTH, riñón, hígado y exposición solar |
| Vitamina E | Forma medida y relación con lípidos o transporte |
| Vitamina K | Forma dietética y límites de pruebas indirectas de coagulación |

Si una fuente institucional general no resuelve una cautela analítica, busca una
fuente de medicina de laboratorio o una publicación abierta que responda esa
pregunta concreta. No rellenes el hueco de memoria.

---

## 15. Fuentes preferentes

Aplica todas las reglas de derechos del brief principal.

| Fuente | Uso preferente |
|---|---|
| NIH Office of Dietary Supplements | Formas, funciones, alimentos, absorción, grupos de riesgo, ingestas de referencia, exceso e interacciones |
| MedlinePlus Medical Tests | Nombre de la prueba, muestra, preparación e interpretación general |
| OMS/WHO | Salud pública, poblaciones, embarazo, fortificación y criterios internacionales |
| CDC | Fortificación, embarazo y programas de prevención cuando sean competencia del organismo |
| EFSA | Referencias dietéticas y límites de ingesta en contexto europeo |
| USDA FoodData Central | Cantidades en alimentos concretos y formas de presentación |
| IFCC, EFLM, ADLM y sociedades de laboratorio | Métodos, interferencias, variabilidad y comparabilidad |
| NIDDK, NHLBI, NINDS y otros institutos NIH | Relaciones con órganos o sistemas dentro de su competencia |
| IQWiG, BfR y organismos nacionales | Contexto alemán o europeo, seguridad y educación sanitaria |

### Reglas de selección

1. Usa ODS para nutrición, pero no presupongas que su ficha interpreta por sí
   sola una prueba clínica.
2. Usa MedlinePlus para pruebas, pero comprueba si la página realmente trata la
   vitamina concreta.
3. No uses una base de composición de alimentos para afirmar absorción o
   beneficio clínico.
4. No uses una guía de ingesta para interpretar un valor sanguíneo.
5. No uses una página comercial de laboratorio como fuente principal si existe
   una fuente institucional o profesional adecuada.
6. Una revisión científica cerrada puede orientar la búsqueda, pero la tarjeta
   publicable necesita una fuente con derechos compatibles.
7. Comprueba la fecha real de revisión y la página concreta.
8. No uses páginas de la A.D.A.M. Medical Encyclopedia.

---

## 16. Control de duplicación

Antes de entregar:

1. Busca el nutriente por nombre, abreviatura, forma química y marcador.
2. Revisa carpetas relacionadas: hemograma, función renal, función hepática,
   minerales y otros micronutrientes.
3. Conserva cada explicación en el dossier donde responde mejor a la intención.
4. Si una relación necesita contexto de otra tarjeta, resume solo lo
   imprescindible y enlaza conceptualmente mediante una tarjeta D.
5. No repitas listas de alimentos en A, C, D o E.
6. No repitas interpretación clínica dentro de B.
7. No conviertas una curiosidad C en una segunda tarjeta B.
8. No crees una tarjeta por cada forma química si una sola tarjeta puede
   distinguirlas con claridad.
9. Separa formas en tarjetas distintas cuando correspondan a pruebas,
   muestras o preguntas realmente diferentes.

---

## 17. Checklist especializado

Además del checklist principal:

- [ ] Se ha identificado la forma química o familia de vitámeros.
- [ ] Se ha identificado el analito real del informe.
- [ ] Se distingue muestra, unidad y método cuando importan.
- [ ] No se confunden ingesta, concentración, reservas y función.
- [ ] No se confunde ingesta recomendada con intervalo de laboratorio.
- [ ] La tarjeta B distingue fuentes naturales, fortificadas y suplementos.
- [ ] Las cantidades de alimentos conservan ración, unidad y fuente.
- [ ] Se ha comprobado la variación regional de fortificación.
- [ ] Se explica biodisponibilidad solo con respaldo.
- [ ] No se infiere que consumir un alimento normalizará el marcador.
- [ ] Déficit y exceso se tratan como preguntas distintas.
- [ ] El límite máximo tolerable no se presenta como objetivo.
- [ ] Se han comprobado interacciones, interferencias y poblaciones vulnerables.
- [ ] Las relaciones D están descritas expresamente por una fuente.
- [ ] La tarjeta E no inventa tiempos de respuesta ni frecuencia de control.
- [ ] La tarjeta C aporta una idea distinta de A y B.
- [ ] No existe una tarjeta equivalente en otro dossier.

---

## 18. Formato de entrega

Entrega primero una auditoría breve:

```markdown
## Identidad investigada
- Nutriente:
- Formas relevantes:
- Marcador principal:
- Tipo de muestra:
- Unidades encontradas:
- Ambigüedades:
- Estado en taxonomía:
- Facets base:
  - marker:
  - categoria:
  - muestra:
  - sistema:
  - area_de_salud:
  - alias:

## Cobertura existente
| Intención | Archivo existente | Estado |
|---|---|---|
| A | ... | suficiente / corregir / falta |
| B | ... | suficiente / corregir / falta |
| C | ... | suficiente / corregir / opcional |
| D | ... | suficiente / corregir / no justificada |
| E | ... | suficiente / corregir / no justificada |

## Propuesta
- Tarjetas que crear:
- Tarjetas que corregir:
- Tarjetas que retirar o fusionar:
- Tarjetas no recomendadas y motivo:
- Entrada de taxonomía a añadir o ampliar:
- Relaciones `relacionado_con` que deben declararse:
```

Después entrega cada archivo según el formato del brief principal.

Al final incluye:

```markdown
## Control final
- Fuentes y fechas verificadas:
- Derechos verificados:
- Duplicados revisados:
- Relaciones no incluidas por falta de respaldo:
- Facets coherentes con `corpus-taxonomy.json`:
- Archivos listos para revisión humana:
```

---

## 19. Instrucción reutilizable

Para aplicar este módulo, usa:

```text
Investiga [VITAMINA O MICRONUTRIENTE] para el corpus RAG de VitaMap.

Aplica conjuntamente:
- PROMPT-INVESTIGACION-RAG.md
- PROMPT-INVESTIGACION-RAG-VITAMINAS-Y-MICRONUTRIENTES.md
- PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md solo si propones una tarjeta C
- BRIEF-TARJETA-D-lectura-conjunta.md solo si propones una tarjeta D
- BRIEF-TARJETA-E-seguimiento-temporal.md solo si propones una tarjeta E

Marcador tal como aparece en la analítica: [MARCADOR]
Tipo de muestra: [MUESTRA O DESCONOCIDA]
Unidad: [UNIDAD O DESCONOCIDA]
País o contexto: [PAÍS]
Carpeta que debes auditar: [RUTA]

Primero audita las tarjetas existentes y las carpetas relacionadas.
Después identifica la forma química, el analito real y los límites de la prueba.
Propón únicamente tarjetas con una intención distinta y una fuente publicable.
No repitas información ya cubierta y no redactes relaciones o tendencias por
inferencia.
```
