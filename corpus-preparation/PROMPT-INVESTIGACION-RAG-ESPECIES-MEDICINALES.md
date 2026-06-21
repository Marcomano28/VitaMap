# Brief de investigación — Especies con uso medicinal documentado

## 1. Propósito

Este brief prepara tarjetas RAG sobre plantas, hongos, algas, cianobacterias y
otros organismos comercializados o descritos por su uso medicinal.

Debe permitir responder preguntas como:

- "¿Qué organismo es realmente la ashwagandha?"
- "¿Se usa la raíz, la hoja o un extracto?"
- "¿Qué diferencia hay entre reishi, micelio y cuerpo fructífero?"
- "¿Qué uso tradicional está documentado y en qué fuente?"
- "¿Qué se ha investigado para una condición concreta?"
- "¿Qué riesgos, interacciones o problemas de calidad existen?"

**Principio rector:**

> "Medicinal" describe un uso, una investigación o una forma de
> comercialización. No demuestra eficacia, seguridad ni equivalencia entre una
> especie, un extracto, un compuesto aislado y un producto comercial.

**Postura editorial:**

> La identidad y las afirmaciones clínicas exigen precisión estricta. El uso
> histórico o tradicional exige otra clase de rigor: buena atribución,
> comprensión contextual y respeto por el lenguaje de la tradición, no un
> veredicto clínico insertado en cada párrafo.

La figura y el fondo cumplen funciones distintas. M1, M3 y M4 delimitan el
organismo, la evidencia moderna y la seguridad. M2 deja respirar el fondo
histórico y cultural: explica cómo una comunidad, texto o sistema médico
comprendió y utilizó la especie, sin obligarlo a expresarse como farmacología
moderna.

Esto no rebaja el estándar. Cambia la pregunta:

- ante una afirmación sobre un parámetro clínico, exige preparación exacta,
  comparador, desenlace, tamaño, incertidumbre y seguridad;
- ante un uso tradicional, exige fuente, época, región, material, preparación,
  vocabulario y contexto;
- ante una comparación entre ambos, muestra semejanzas y diferencias sin
  convertirlas en equivalencia ni en combate;
- cuando exista debate, orienta hacia etnobotánica, historia de la medicina,
  antropología, filología, farmacopeas, monografías y tesis académicas;
- excluye como autoridad la publicidad, las tiendas, las marcas y la
  divulgación que repite relatos sin procedencia.

No uses "ancestral", "milenario" o expresiones semejantes como sello de
autoridad. Pueden emplearse si la fuente permite precisar qué tradición,
periodo y continuidad histórica describen.

Este brief no sustituye:

- `PROMPT-INVESTIGACION-RAG.md`, usado para interpretación de analíticas y
  factores cotidianos;
- `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`, usado para curiosidades y
  capas tradicionales vinculadas a un dossier temático;
- `PROMPT-INVESTIGACION-RAG-ACUPUNTURA.md`, usado para el corpus especializado
  de acupuntura.

---

## 2. Unidad editorial

El dossier se organiza por organismo o materia prima claramente identificada,
no por términos comerciales vagos como "detox", "adaptógeno", "mezcla para la
inmunidad" o "hongo medicinal".

Cada archivo debe pertenecer a una sola capa:

| Capa | Función | `source_kind` | `source_type` |
|---|---|---|---|
| **M1 · Identidad** | Organismo, nombres, parte utilizada y formas de producto | `institutional-education` | `medicinal-species-identity-summary` |
| **M2 · Uso documentado** | Uso histórico o tradicional, significado contextual y debate académico | `tradition-context` | `traditional-medicinal-use-summary` |
| **M3 · Evidencia moderna** | Evaluación clínica de una preparación y una indicación concretas | `clinical-evidence` | `natural-product-evidence-summary` |
| **M4 · Seguridad** | Efectos adversos, interacciones, poblaciones vulnerables y calidad | `institutional-education` | `natural-product-safety-summary` |

No es obligatorio producir las cuatro tarjetas. Solo se crea una capa cuando
responde una intención diferente y dispone de una fuente adecuada.

Ejemplos:

- una especie con taxonomía confusa puede necesitar M1 antes que ninguna otra;
- una especie tóxica puede justificar M1 y M4 aunque no exista evidencia de
  beneficio;
- una investigación clínica sobre un extracto concreto puede justificar M3 sin
  que exista una M2;
- un uso tradicional no debe producir M3 si no ha sido investigado.

---

## 3. Puerta de identidad obligatoria

No investigues beneficios antes de aclarar qué se está estudiando.

Responde internamente:

1. ¿Es una planta, un hongo, un alga, una cianobacteria u otro organismo?
2. ¿Cuál es el nombre científico aceptado y qué autoridad taxonómica lo respalda?
3. ¿Qué sinónimos científicos o nombres comunes pueden generar confusión?
4. ¿Qué parte se utiliza: raíz, rizoma, hoja, corteza, fruto, semilla, talo,
   micelio, cuerpo fructífero u otra?
5. ¿La fuente estudia el organismo entero, polvo, infusión, aceite, extracto,
   compuesto aislado o producto multingrediente?
6. ¿La preparación está estandarizada? ¿A qué compuesto y con qué método?
7. ¿El producto contiene potenciadores de absorción, excipientes u otros
   ingredientes que cambien su seguridad o comparabilidad?
8. ¿La especie descrita en la fuente coincide con la del producto o práctica
   sobre la que se hará la afirmación?

Si la identidad o preparación no puede determinarse, no redactes una conclusión
general. Entrega:

```text
No se recomienda todavía una tarjeta de evidencia o seguridad.
Motivo: la especie, parte utilizada o preparación no está identificada con
precisión suficiente para trasladar los hallazgos.
```

### Casos que requieren cautela especial

- **Hongos:** separar micelio, cuerpo fructífero, esporas y extractos; registrar
  el sustrato cuando afecte a la composición.
- **Algas:** distinguir macroalgas de microalgas.
- **Cianobacterias:** no presentarlas botánicamente como algas aunque se
  comercialicen con ese nombre.
- **Mezclas:** no atribuir a una especie el efecto de un producto
  multingrediente.
- **Compuestos aislados:** curcumina no equivale a cúrcuma; berberina no
  equivale a todas las plantas que la contienen.
- **Nombres comunes:** "ginseng", "reishi", "cúrcuma" o "kelp" pueden cubrir
  especies o productos diferentes.

---

## 4. Fuentes de identidad

Usa una autoridad adecuada al tipo de organismo y abre la ficha concreta:

| Organismo | Fuentes iniciales |
|---|---|
| Plantas | Plants of the World Online (Kew), MPNS, IPNI, GRIN Taxonomy |
| Hongos | MycoBank, Index Fungorum y literatura taxonómica especializada |
| Algas | AlgaeBase y catálogos académicos especializados |
| Cianobacterias | NCBI Taxonomy y literatura taxonómica reciente |

Una base taxonómica identifica el organismo, pero no demuestra un uso
tradicional, una eficacia clínica ni una seguridad.

Comprueba los derechos del objeto exacto. Si la base permite consultar datos
pero no queda claro que su contenido pueda incorporarse a un RAG, usa los datos
para verificar identidad y busca una fuente compatible para la síntesis. No
marques `permitted` por el mero hecho de que una página sea pública.

---

## 5. Frontmatter compatible con VitaMap

> **Contrato mínimo de evidencia (v0).** Aplica además el bloque `evidence` y el
> `relacionado_con[].direccion` de `PROMPT-INVESTIGACION-RAG.md` §3 bis. El bloque
> `evidence` (con `certeza`) es obligatorio en M3 (evidencia moderna) y M4
> (seguridad); en M1 (identidad) y M2 (uso documentado) puede omitirse. Atención
> aquí: `relacionado_con[].id` es un **marcador canónico**, nunca el nombre
> científico ni la clave de topic (usa `huang-lian`, no `coptis-chinensis`;
> `goldenseal`, no `hydrastis-canadensis`).

El administrador actual conserva estos campos:

```yaml
---
title: "Título que identifica especie e intención"
source_url: "https://URL-PRINCIPAL"
source_language: en
source_jurisdiction:
  - GB
publication_date: "AAAA-MM-DD"
source_kind: institutional-education
source_type: medicinal-species-identity-summary
rights_status: permitted
facets_version: 1
tarjeta_id: curcuma-curcuma-identidad-powo
dominio: sustancias-naturales
tipo:
  - especie_medicinal
  - suplemento
marker:
  - curcuma
sistema:
  - osteoarticular
  - digestivo
area_de_salud:
  - antiinflamatorio
  - antioxidante
seccion: identidad
alias:
  - cúrcuma
  - turmeric
  - Curcuma longa
limitations:
  - "Límite específico de la tarjeta."
---
```

También admite `doi` y `pmid`.

Usa `corpus-preparation/corpus-taxonomy.json` como vocabulario canónico para
`dominio`, `tipo`, `marker`, `sistema`, `area_de_salud`, `alias` y
`relacionado_con`. Si la especie no existe en la taxonomía, propón primero la
entrada de topic antes de redactar la tarjeta.

Los detalles botánicos y de producto siguen perteneciendo al cuerpo de la
tarjeta M1 salvo que exista un campo operativo específico. Puedes incluirlos en
el texto con una estructura clara:

```yaml
organism_type: plant
scientific_name: "Curcuma longa L."
accepted_name_source: "Kew POWO"
common_names:
  - cúrcuma
part_used:
  - rizoma
preparation:
  - polvo
  - extracto
tradition:
  - ayurveda
```

No uses esos campos botánicos como frontmatter operativo todavía: `dominio`,
`tipo`, `marker`, `sistema`, `area_de_salud`, `seccion`, `alias` y
`relacionado_con` sí son operativos; `scientific_name`, `part_used` y
`preparation` siguen siendo contenido editorial.

Mapeo habitual de `source_type` a `seccion`:

| `source_type` | `seccion` |
|---|---|
| `medicinal-species-identity-summary` | `identidad` |
| `traditional-medicinal-use-summary` | `uso-documentado` |
| `natural-product-evidence-summary` | `evidencia` |
| `natural-product-safety-summary` | `seguridad` |

---

## 6. M1 — Identidad y formas de producto

### Intención

Responde:

- "¿Qué especie es?"
- "¿Qué parte se usa?"
- "¿Es lo mismo la planta que su extracto?"
- "¿Qué nombres pueden confundirse?"

### Estructura

```markdown
# [Nombre común] ([nombre científico]): identidad y formas de producto

## Identidad
Nombre aceptado, autoridad, familia o grupo biológico y tipo de organismo.

## Nombres y posibles confusiones
Sinónimos científicos relevantes, nombres comunes y especies próximas que no
deben considerarse equivalentes.

## Parte utilizada
Parte o material del organismo descrito por la fuente.

## Formas de producto
Alimento, polvo, infusión, extracto, aceite, compuesto aislado o mezcla.

## Qué no permite concluir
La identidad no demuestra eficacia ni seguridad.

## Fuentes
Fuente institucional y autoridad taxonómica verificadas.
```

### Reglas

1. Usa nombres científicos en cursiva y conserva la autoridad cuando la fuente
   la publique.
2. Distingue raíz de rizoma, micelio de cuerpo fructífero y organismo de
   compuesto aislado.
3. No incluyas una lista enciclopédica de todos los sinónimos: registra los que
   puedan afectar a recuperación, compra o seguridad.
4. No describas indicaciones terapéuticas en M1.
5. Longitud orientativa: 200–450 palabras.

---

## 7. M2 — Uso histórico o tradicional documentado

### Intención

Responde:

- "¿Dónde y cómo se ha utilizado tradicionalmente?"
- "¿Qué parte y preparación describe la fuente?"
- "¿La afirmación procede de un texto, una farmacopea o una monografía?"

### Fuente exigida

Debe existir una tradición, región o corpus identificable. Prioriza:

1. texto histórico o clásico verificable;
2. farmacopea o monografía regulatoria;
3. estudio histórico o etnobotánico académico;
4. antropología médica, historia de la medicina o tesis universitaria;
5. fuente institucional que atribuya claramente el uso.

No uses blogs, tiendas, clínicas, marcas ni frases como "se ha usado durante
miles de años" sin una referencia concreta.

M2 no es una versión débil de M3 ni una antesala que deba disculparse por no ser
un ensayo clínico. Responde una pregunta histórica y cultural distinta. Describe
el uso desde la lógica y el vocabulario de la fuente antes de compararlo con
categorías modernas.

### Estructura

```markdown
# [Especie] en [tradición o región]: uso documentado

## Fuente y contexto
Obra, monografía, región, tradición, fecha y edición.

## Material y preparación
Parte utilizada y forma descrita por la fuente.

## Uso dentro de su contexto
Qué afirma la fuente con su propio vocabulario, qué función atribuye a la
especie y cómo se integra en su sistema de conocimiento o práctica cotidiana.

## Continuidades, variantes y debate
Diferencias entre regiones, épocas, textos, preparaciones o interpretaciones
académicas. No inventes una tradición uniforme si las fuentes muestran
desacuerdos.

## Relación con preguntas actuales
Qué aspectos pueden compararse o investigarse y cuáles perderían su sentido al
traducirse directamente a diagnósticos o mecanismos modernos.

## Para profundizar
Ediciones, estudios etnobotánicos, artículos históricos, monografías o tesis
académicas, indicando qué aporta cada referencia.

## Fuente principal
Cita y URL exacta.
```

M2 documenta y contextualiza un uso; no tiene que emitir un veredicto de
eficacia. Si la consulta pregunta por resultados clínicos, crea o recupera M3.
La tarjeta puede cerrar con preguntas de investigación o lecturas académicas,
no necesariamente con una negación.

M2 puede existir y recuperarse por sí sola cuando la pregunta sea histórica,
etnobotánica o cultural. No añadas una M3 como corrección automática; añádela
cuando la persona pregunte por eficacia, seguridad o una comparación moderna.

---

## 8. M3 — Evidencia moderna por indicación

### Intención

Responde una sola pregunta clínica o funcional:

- "¿Qué se ha investigado sobre cúrcuma y artrosis de rodilla?"
- "¿Qué evidencia existe sobre reishi y fatiga relacionada con cáncer?"

No redactes "beneficios de [especie]" como una sola tarjeta.

### Estructura

```markdown
# [Preparación] para [indicación]: qué muestra la evidencia

## Qué se estudió
Especie, parte, preparación, formulación, población, comparador y desenlaces.

## Qué muestran los estudios
Resultados favorables, negativos, mixtos o inconclusos y su certeza, sin
extrapolar más allá de la preparación estudiada.

## Problemas de comparabilidad
Dosis, duración, estandarización, biodisponibilidad, mezclas y variación entre
productos.

## Lectura equilibrada
Diferencia entre señal preliminar, eficacia confirmada y utilidad individual.
Explica qué permanece abierto y qué estudio ayudaría a resolverlo.

## Estudios para profundizar
Revisiones, ensayos y registros pertinentes, con una frase sobre la aportación y
el límite de cada referencia.

## Fuente principal
Revisión sistemática, guía o síntesis institucional.
```

### Jerarquía de fuentes

1. guía o evaluación institucional vigente;
2. revisión sistemática o metaanálisis de buena calidad;
3. ensayo clínico para una pregunta estrecha;
4. estudio preclínico solo para mecanismo, nunca para afirmar eficacia humana.

Un ensayo aislado no justifica una tarjeta general sobre eficacia. Una
asociación, un mecanismo o un resultado de laboratorio no equivalen a beneficio
clínico.

Si los estudios discrepan, incluye los resultados relevantes en ambas
direcciones y examina preparación, población, comparador, desenlace, duración,
potencia y riesgo de sesgo. No conviertas "evidencia insuficiente" en "no
funciona", ni "existen estudios" en "eficacia establecida".

---

## 9. M4 — Seguridad

### Intención

Responde:

- "¿Qué efectos adversos se conocen?"
- "¿Puede interactuar con medicamentos?"
- "¿Hay riesgos en embarazo, lactancia, hígado o riñón?"
- "¿Importa la calidad o contaminación del producto?"

### Estructura

```markdown
# [Especie o preparación]: seguridad y precauciones

## Efectos adversos conocidos
Frecuencia o gravedad solo cuando la fuente permita describirlas.

## Interacciones y poblaciones vulnerables
Medicamentos, embarazo, lactancia, infancia, cirugía y enfermedades relevantes.

## Calidad e identificación
Adulteración, contaminación, sustitución de especies y variabilidad.

## Límites
Ausencia de datos no equivale a seguridad.

## Fuente principal
Fuente institucional, regulatoria o revisión de seguridad.
```

### Reglas

1. La seguridad puede depender de la preparación y la duración.
2. No conviertas una lista de interacciones teóricas en contraindicaciones
   confirmadas.
3. Distingue uso alimentario de suplementos concentrados.
4. No propongas dosis, calendarios, suspensiones de medicación ni
   automonitorización.
5. Los eventos graves deben atribuirse con precisión: señal, casos, asociación
   o causalidad evaluada.

---

## 10. Diferencias que nunca deben borrarse

Toda investigación debe conservar estas separaciones:

```text
especie != parte utilizada
parte utilizada != preparación
preparación != extracto estandarizado
extracto != compuesto aislado
compuesto aislado != producto comercial
uso tradicional != eficacia clínica
actividad de laboratorio != beneficio en personas
ausencia de daño observado != seguridad demostrada
```

Si una fuente estudia curcumina con piperina, no presentes el resultado como
evidencia para cualquier cúrcuma culinaria. Si estudia un extracto de cuerpo
fructífero, no lo extrapoles automáticamente al micelio.

Estas diferencias ordenan el corpus; no establecen que una clase de fuente deba
desautorizar a las demás. El uso tradicional, la composición química, el
mecanismo experimental y el resultado clínico pueden convivir si cada tarjeta
declara qué pregunta responde y con qué autoridad.

---

## 11. Derechos y trazabilidad

- Abre la página, monografía, artículo o ficha exactos.
- Registra la fecha real de publicación o última revisión.
- Comprueba licencia y condiciones del objeto utilizado.
- No presupongas que acceso abierto significa permiso para derivados o RAG.
- No uses texto de tiendas, marcas o fichas comerciales como fuente principal.
- No copies monografías completas; redacta una síntesis trazable.
- Una obra o artículo académico cerrado puede citarse por título, autor, fecha,
  DOI y una caracterización breve en `Para profundizar`. Esto no permite
  incorporar su texto ni usarlo como fuente principal `permitted`.
- Si los derechos son `unknown` o `metadata-only`, la tarjeta no está lista para
  publicación.
- Cada afirmación importante debe poder localizarse en una fuente declarada.

El `rights_status` corresponde al objeto principal incorporado. Una referencia
bibliográfica cerrada no cambia por sí sola los derechos de una tarjeta apoyada
en una fuente principal compatible.

---

## 12. Checklist

- [ ] La tarjeta es M1, M2, M3 o M4 y no mezcla funciones.
- [ ] Existe una intención de consulta distinta.
- [ ] El organismo y su nombre científico están identificados.
- [ ] Se distingue planta, hongo, alga o cianobacteria.
- [ ] Se identifica la parte utilizada.
- [ ] Se identifica la preparación estudiada.
- [ ] No se confunde especie, extracto, compuesto y producto.
- [ ] M2 atribuye el uso a una tradición y fuente concretas.
- [ ] M2 explica el uso desde su contexto antes de compararlo con biomedicina.
- [ ] M2 refleja variantes o desacuerdos y no fabrica una tradición uniforme.
- [ ] M2 orienta hacia fuentes académicas y no termina necesariamente en un
      veredicto clínico.
- [ ] M3 cubre una sola indicación y describe población y formulación.
- [ ] M3 incluye resultados relevantes favorables, negativos o inconclusos.
- [ ] M4 diferencia uso alimentario y suplemento concentrado cuando corresponde.
- [ ] La fuente es institucional, regulatoria, taxonómica o académica adecuada.
- [ ] Fecha, URL, DOI o PMID han sido verificados.
- [ ] Los derechos de la fuente principal permiten publicación en el RAG.
- [ ] Las referencias cerradas son orientación bibliográfica y no aportan texto
      protegido al RAG.
- [ ] La incertidumbre y los problemas de comparabilidad están expresados.
- [ ] La figura clínica no borra el contexto histórico o cultural, y el fondo
      tradicional no se presenta como eficacia clínica.
- [ ] No contiene recomendaciones, dosis ni instrucciones de tratamiento.
- [ ] Incluye entre 2 y 5 limitaciones honestas.

---

## 13. Formato de entrega

Antes de cada documento indica:

```text
Capa: M3 · Evidencia moderna
Pregunta que pretende responder:
- ¿Qué muestra la evidencia sobre cúrcuma oral y artrosis de rodilla?
```

Después entrega el archivo Markdown completo.

Nombres:

```text
[especie]-identidad-[fuente].md
[especie]-uso-documentado-[tradicion]-[fuente].md
[especie]-evidencia-[indicacion]-[fuente].md
[especie]-seguridad-[fuente].md
```

Usa minúsculas, sin tildes y con guiones en el nombre del archivo.
