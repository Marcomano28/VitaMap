# Brief de investigación — Prácticas complementarias

## 1. Propósito

Este brief prepara tarjetas RAG sobre prácticas de salud complementarias que no
pertenecen a los dossiers de analíticas, especies medicinales o acupuntura.

Puede aplicarse, entre otras, a:

- kinesiología aplicada;
- reflexología;
- reiki y otras prácticas denominadas energéticas;
- osteopatía o quiropráctica cuando la pregunta no corresponda a una profesión
  sanitaria regulada y bien delimitada;
- técnicas manuales, mente-cuerpo o de bienestar con afirmaciones diagnósticas
  o terapéuticas;
- sistemas contemporáneos que combinan elementos de varias tradiciones.

Debe permitir responder preguntas como:

- "¿Qué es esta práctica y qué ocurre normalmente en una sesión?"
- "¿Es lo mismo que una disciplina sanitaria con un nombre parecido?"
- "¿De dónde procede y qué afirma su propio marco?"
- "¿Se ha validado su método diagnóstico?"
- "¿Se ha estudiado para una condición concreta?"
- "¿Qué riesgos directos e indirectos puede tener?"

**Principio rector:**

> Describir una práctica no la valida. Su marco interno, su exactitud
> diagnóstica, su eficacia terapéutica y sus riesgos son preguntas distintas.

**Postura editorial:**

> El objetivo no es zanjar la conversación con una etiqueta, sino ayudar a
> comprender qué se afirma, qué se ha estudiado, qué permanece incierto y dónde
> puede profundizarse mediante fuentes académicas.

Evita tanto la promoción acrítica como el rechazo reflejo. Cuando una persona
pregunte por una práctica:

1. reconoce la pregunta o la experiencia sin confirmar automáticamente su
   interpretación;
2. distingue experiencia personal, marco tradicional, hipótesis y resultado
   científico;
3. explica los acuerdos, desacuerdos y vacíos reales de la literatura;
4. orienta hacia artículos, revisiones, estudios históricos, etnografías o
   tesis académicas pertinentes;
5. conserva una conclusión abierta cuando la evidencia no permite cerrarla.

Una experiencia puede ser significativa sin demostrar el mecanismo que propone
la escuela. Una explicación tradicional puede tener interés histórico,
cultural o filosófico sin convertirse por ello en fisiología demostrada. Del
mismo modo, que un mecanismo no esté validado no autoriza a afirmar que toda
experiencia asociada sea falsa o carezca de interés.

Prioriza el debate **ciencia-tradición documentado académicamente**. Excluye como
autoridad las páginas comerciales, el contenido promocional, los testimonios y
los artículos de divulgación que repiten afirmaciones sin fuentes. Pueden
estudiarse como ejemplos de circulación social o comercial, pero no como prueba
de historia, mecanismo, eficacia o seguridad.

Usa preferentemente la expresión **prácticas complementarias**. No emplees
"terapias paralelas" como categoría editorial: es imprecisa y puede sugerir que
la práctica posee una eficacia comparable o que constituye un sistema
asistencial independiente.

Conserva estas diferencias:

```text
complementaria = utilizada junto con la atención convencional
alternativa = utilizada en lugar de la atención convencional
integrativa = coordinada con la atención convencional
```

No llames "integrativa" a una práctica solo porque una clínica, escuela o marca
utilice ese término.

---

## 2. Cuándo usar otro brief

Este documento no sustituye:

- `PROMPT-INVESTIGACION-RAG.md`, para interpretación de analíticas y factores
  cotidianos;
- `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`, para curiosidades científicas
  y fuentes tradicionales vinculadas a un tema biomédico;
- `PROMPT-INVESTIGACION-RAG-ACUPUNTURA.md`, para acupuntura;
- `PROMPT-INVESTIGACION-RAG-ESPECIES-MEDICINALES.md`, para plantas, hongos,
  algas y otros organismos con uso medicinal documentado.

Una práctica basada principalmente en una especie o producto natural se
investiga con las capas M1-M4. Una tradición histórica amplia, como Ayurveda o
medicina china, se trata con sus fuentes primarias, contexto académico y
evaluación científica, no como una única "terapia".

---

## 3. Unidad editorial

Cada archivo debe responder una intención dominante y pertenecer a una capa:

| Capa | Función | `source_type` |
|---|---|---|
| **PC1 · Qué es** | Definición, procedimiento general, variantes y desambiguación | `complementary-practice-overview-summary` |
| **PC2 · Origen y marco propio** | Historia, escuelas, conceptos, debate académico y afirmaciones atribuidas | `complementary-practice-framework-summary` |
| **PC3 · Evaluación científica** | Validez o eficacia para una pregunta concreta, incluidos resultados favorables, negativos o inciertos | `complementary-practice-evidence-summary` |
| **PC4 · Seguridad y regulación** | Daños directos, riesgos indirectos, cualificación y situación regulatoria | `complementary-practice-safety-summary` |

No es obligatorio producir las cuatro capas. Solo crea una tarjeta cuando:

- responde una intención diferente;
- dispone de una fuente adecuada;
- aporta información útil que no está cubierta;
- puede mantener separados hechos, afirmaciones y evidencia.

Puede haber más de una PC3 si se evalúan afirmaciones distintas. Por ejemplo:

```text
exactitud del test para detectar alergias
fiabilidad entre examinadores
eficacia de la práctica para dolor lumbar
```

No deben fusionarse en una conclusión universal.

---

## 4. Puerta de identidad de la práctica

Antes de investigar resultados, responde internamente:

1. ¿Cuál es el nombre exacto de la práctica?
2. ¿Existen profesiones, disciplinas académicas o técnicas clínicas con un
   nombre parecido?
3. ¿Qué variante, escuela o versión se está describiendo?
4. ¿Qué hace materialmente el profesional durante una sesión?
5. ¿La práctica afirma diagnosticar, tratar, aliviar síntomas, promover
   bienestar o varias cosas a la vez?
6. ¿La afirmación estudiada corresponde realmente a esa variante?
7. ¿La intervención se aplica sola o junto con otras técnicas?
8. ¿El término cambia de significado según el país o la profesión?

Si la práctica o variante no puede delimitarse, no redactes una conclusión
general. Entrega:

```text
No se recomienda todavía una tarjeta de evidencia.
Motivo: la práctica, su variante o la afirmación evaluada no están delimitadas
con precisión suficiente para trasladar los resultados.
```

### Desambiguación obligatoria

Aclara nombres que puedan inducir a error. Por ejemplo:

- kinesiología aplicada no es la ciencia académica del movimiento;
- "test muscular" dentro de una práctica complementaria no equivale
  automáticamente a una exploración neuromuscular clínica;
- masaje de bienestar no equivale a fisioterapia;
- una técnica denominada "energética" no demuestra que mida una energía física.

La similitud de vocabulario no implica equivalencia de formación, método,
regulación ni evidencia.

---

## 5. Frontmatter compatible con VitaMap

El administrador admite:

```yaml
---
title: "Título que identifica práctica e intención"
source_url: "https://URL-PRINCIPAL"
publication_date: "AAAA-MM-DD"
source_kind: institutional-education
source_type: complementary-practice-overview-summary
rights_status: permitted
limitations:
  - "Límite específico de la tarjeta."
---
```

También admite `doi` y `pmid`.

`source_kind` describe la procedencia y función del documento, no si la
conclusión es favorable o desfavorable:

| Valor | Cuándo usarlo |
|---|---|
| `institutional-education` | Información educativa, de seguridad o regulación de organismos públicos y profesionales competentes |
| `clinical-evidence` | Guías, revisiones sistemáticas, consensos o estudios que evalúan validez, fiabilidad, eficacia o daños |
| `tradition-context` | Historia, marco interno o perspectiva propia de una práctica o escuela, claramente atribuida |

PC1 suele usar `institutional-education`, PC2 suele usar
`tradition-context`, PC3 suele usar `clinical-evidence` y PC4 suele usar
`institutional-education`. La fuente real prevalece sobre esta orientación.

No añadas todavía campos nuevos al frontmatter operativo. La variante, el tipo
de afirmación, la profesión y la jurisdicción deben constar en el cuerpo hasta
que el importador pueda conservar metadatos adicionales.

---

## 6. PC1 — Qué es y cómo se distingue

### Intención

Responde:

- "¿Qué es?"
- "¿Qué hace normalmente el profesional?"
- "¿En qué se diferencia de una disciplina con nombre parecido?"
- "¿Qué variantes existen?"

### Fuentes preferentes

1. organismo público de salud;
2. regulador o colegio profesional competente;
3. revisión académica que defina con precisión la práctica;
4. estudio cualitativo, etnográfico o tesis académica sobre la experiencia;
5. fuente histórica o profesional para describir una variante, siempre
   atribuida y sin usarla como prueba de eficacia.

Una web de la propia escuela puede servir para saber qué afirma o enseña esa
escuela, pero no para validar sus diagnósticos, mecanismos o tratamientos.

### Estructura

```markdown
# [Práctica]: qué es

## Aclaración del nombre
Disciplinas, profesiones o técnicas que no deben confundirse.

## En qué consiste
Qué hace materialmente el profesional, sin convertir la descripción en una
guía de autoaplicación.

## Qué pretende evaluar o modificar
Afirmaciones de la práctica, expresadas con atribución.

## Qué puede resultar significativo
Aspectos reflexivos, narrativos, culturales, relacionales o rituales descritos
por participantes o investigación cualitativa, sin convertirlos en prueba del
mecanismo.

## Variantes
Escuelas o versiones relevantes y diferencias que afecten a la evidencia.

## Para profundizar
Preguntas que conviene separar y artículos, estudios cualitativos, etnografías
o tesis académicas pertinentes.

## Fuente principal
Cita y URL exacta.
```

### Reglas

1. Describe acciones observables antes que explicaciones abstractas.
2. Usa "la práctica sostiene", "sus promotores interpretan" o una atribución
   equivalente cuando la afirmación procede del propio sistema.
3. No presentes metáforas, energías, bloqueos o correspondencias como
   estructuras anatómicas o mecanismos demostrados.
4. No adelantes una conclusión global de eficacia si PC1 no tiene una fuente
   adecuada para evaluarla.
5. Si existe investigación cualitativa seria, úsala para comprender la
   experiencia, no para afirmar eficacia clínica.
6. Evita cerrar PC1 con una negación; termina delimitando qué preguntas pasan a
   PC2, PC3 o PC4 y ofreciendo rutas de lectura.
7. Longitud orientativa: 250-500 palabras.

---

## 7. PC2 — Origen y marco propio

### Intención

Responde:

- "¿Quién desarrolló esta práctica y cuándo?"
- "¿Qué escuelas o variantes surgieron?"
- "¿Cómo explica la práctica sus propios conceptos?"
- "¿Qué elementos tomó de otras tradiciones?"

PC2 contextualiza. No demuestra que el marco descrito sea verdadero ni que la
práctica funcione.

### Fuentes preferentes

1. investigación histórica o académica;
2. archivos, obras o documentos primarios verificables;
3. literatura profesional de la práctica para atribuir su propio marco;
4. fuentes de la tradición de origen cuando se afirma haber adoptado uno de sus
   conceptos;
5. historia de la medicina, antropología, sociología, estudios religiosos,
   filosofía o tesis universitarias que analicen la relación entre tradición,
   experiencia y ciencia.

No uses una escuela comercial contemporánea para afirmar el origen universal de
una práctica. Distingue:

```text
lo que documenta una fuente histórica
lo que afirma el fundador
lo que enseña una escuela actual
la interpretación posterior de sus practicantes
```

### Estructura

```markdown
# [Práctica]: origen y marco propio

## Origen documentado
Persona, lugar, periodo y fuentes verificables.

## Evolución y variantes
Escuelas, cambios y desacuerdos relevantes.

## Conceptos del propio marco
Explicación atribuida, sin presentarla como mecanismo validado.

## Préstamos y reinterpretaciones
Conceptos tomados de otras tradiciones y cambios de significado.

## Debate académico
Interpretaciones históricas, antropológicas o filosóficas relevantes y
preguntas que pueden investigarse sin aceptar de antemano el marco interno.

## Límites
Qué parte es historia documentada, interpretación académica, relato interno o
afirmación comercial.

## Para profundizar
Artículos, monografías o tesis pertinentes, indicando qué perspectiva aporta
cada fuente y qué no demuestra.

## Fuente principal
Cita y URL exacta.
```

Si historia y marco interno requieren autoridades documentales diferentes,
crea dos PC2 en lugar de forzar una mezcla.

No reduzcas el debate ciencia-tradición a una oposición entre "verdadero" y
"falso". Pregunta también cómo surgió el concepto, qué función cumple, cómo ha
cambiado, cómo lo viven sus participantes y qué partes son susceptibles de
evaluación empírica. Esto amplía la comprensión sin conceder validez clínica
por asociación.

---

## 8. PC3 — Evaluación científica

### Pregunta obligatoria

Una PC3 evalúa una sola afirmación:

- exactitud de un método diagnóstico;
- fiabilidad o concordancia entre examinadores;
- validez de una medición;
- eficacia para una condición concreta;
- efecto sobre un desenlace concreto.

No redactes una tarjeta titulada "¿Funciona [práctica]?" que mezcle todos los
usos posibles.

### Separaciones críticas

```text
fiabilidad != exactitud
exactitud diagnóstica != eficacia terapéutica
cambio inmediato != beneficio clínico
comparación con no tratamiento != comparación con control simulado
experiencia subjetiva != validación del mecanismo propuesto
ausencia de evidencia != prueba universal de ausencia de efecto
```

Cuando una revisión concluya que la evidencia es insuficiente, conserva esa
formulación. No la conviertas automáticamente en "no funciona" ni en "funciona
igual que el azar".

Una afirmación como "no superó al azar" solo puede aplicarse al método,
comparador, muestra y desenlace de los estudios que realmente lo evaluaron.

Si existen estudios con resultados diferentes, represéntalos. No selecciones
solo los favorables ni solo los negativos. Explica si la discrepancia puede
relacionarse con la muestra, la variante, el comparador, la duración, el tamaño
del estudio o la calidad metodológica.

### Jerarquía de fuentes

1. guía o evaluación institucional vigente;
2. revisión sistemática o metaanálisis;
3. revisión crítica metodológicamente sólida;
4. ensayo o estudio de exactitud para una pregunta estrecha;
5. estudio preclínico solo para mecanismo, nunca para afirmar beneficio en
   personas.

### Estructura

```markdown
# [Práctica o método] para [afirmación]: estado de la evidencia

## Pregunta evaluada
Práctica exacta, variante, población, comparador y desenlace.

## Qué se estudió
Tipo y número de estudios, sin confundir cantidad con calidad.

## Qué muestran los resultados
Resultados favorables, negativos, contradictorios o inconclusos y grado de
certeza.

## Problemas metodológicos
Sesgos, cegamiento, reproducibilidad, controles, tamaño y heterogeneidad.

## Lectura equilibrada
Qué puede sostenerse, qué sigue abierto y qué investigación ayudaría a resolver
la incertidumbre.

## Estudios para profundizar
Revisiones, ensayos, estudios cualitativos o tesis pertinentes, con una frase
sobre la contribución y el límite de cada referencia.

## Fuente principal
Revisión, guía o estudio con URL, DOI o PMID.
```

### Reglas

1. Distingue la prueba diagnóstica del tratamiento posterior.
2. No generalices desde una indicación a todas las enfermedades.
3. No uses testimonios como evidencia de validez o eficacia.
4. No trates la plausibilidad de un mecanismo como resultado clínico.
5. Identifica conflictos de interés relevantes cuando la fuente los declare.
6. Si solo existen estudios pequeños o de mala calidad, dilo sin rellenar el
   hueco con afirmaciones de escuelas o clínicas.
7. No conviertas "evidencia insuficiente" en una negación universal.
8. No presentes "hay estudios" como si significara que la eficacia está
   establecida.
9. Formula qué clase de estudio, comparación o seguimiento falta.

---

## 9. PC4 — Seguridad, daños indirectos y regulación

### Intención

Responde:

- "¿Puede causar daño físico?"
- "¿Qué riesgo existe si se usa para diagnosticar?"
- "¿Puede retrasar atención eficaz?"
- "¿Está regulada esta práctica?"
- "¿Qué formación puede comprobar una persona?"

### Tres dimensiones separadas

#### Daño directo

Incluye lesiones, infecciones, efectos adversos, manipulación física,
contraindicaciones y eventos relacionados con la técnica.

#### Daño indirecto

Incluye:

- falsos diagnósticos;
- falsa tranquilidad;
- retraso de una valoración o tratamiento;
- abandono de medicación;
- dietas restrictivas innecesarias;
- suplementos o pruebas innecesarias;
- costes económicos y dependencia de sesiones;
- atribución de síntomas clínicos a conceptos no validados.

Una práctica físicamente suave no es automáticamente inocua si sus resultados
se usan para tomar decisiones sanitarias.

La seguridad no debe redactarse como una acumulación de advertencias
hipotéticas. Prioriza daños observados, datos de estudios, informes
documentados y riesgos indirectos plausibles que puedan explicarse con una
cadena causal clara.

#### Regulación y cualificación

La regulación depende del país, región, título profesional y fecha. Consulta
fuentes oficiales vigentes y especifica la jurisdicción. No deduzcas
cualificación sanitaria a partir de certificados privados, asociaciones o
títulos internos de una escuela.

### Estructura

```markdown
# [Práctica]: seguridad y límites

## Riesgos directos
Daños conocidos y condiciones que aumentan el riesgo.

## Riesgos indirectos
Consecuencias de diagnósticos, recomendaciones o sustitución de atención.

## Cualificación y regulación
Jurisdicción, profesión regulada si existe y límites del título.

## Cuándo la información no basta
Situaciones que requieren atención sanitaria y no deben demorarse.

## Cómo explorar con mayor seguridad
Preguntas sobre formación, consentimiento, confidencialidad, seguimiento y
distinción entre interpretación simbólica y hecho comprobado.

## Para profundizar
Fuentes de seguridad, ética, regulación o daños terapéuticos relevantes.

## Fuente principal
Organismo público, regulador o revisión de seguridad.
```

### Reglas

1. No confundas "no se han descrito daños" con "se ha demostrado que es
   segura".
2. Distingue el riesgo de la técnica del riesgo de las decisiones derivadas.
3. No ofrezcas instrucciones para realizar maniobras, suspender tratamientos o
   gestionar contraindicaciones por cuenta propia.
4. No extrapoles la regulación de una profesión sanitaria a cualquier persona
   que anuncie una técnica con nombre parecido.
5. Fecha y jurisdicción son obligatorias cuando se describa regulación.
6. No invalides una experiencia personal para explicar un riesgo; diferencia
   su significado subjetivo de las decisiones clínicas o factuales derivadas.
7. Cuando no haya datos específicos, declara el vacío en vez de elaborar una
   lista genérica de peligros.

---

## 10. Prácticas que mezclan tradiciones

Algunas prácticas modernas incorporan términos como:

- meridianos;
- chakras;
- prana o qi;
- memoria corporal;
- bloqueos emocionales;
- detoxificación;
- trauma almacenado.

Antes de incluirlos:

1. identifica qué escuela concreta usa el concepto;
2. localiza una fuente que permita atribuirlo;
3. comprueba si el significado coincide con la tradición de origen;
4. separa la procedencia histórica de la validación científica;
5. evita presentar una reinterpretación moderna como doctrina antigua.

La presencia de un término tradicional no convierte automáticamente la práctica
en Ayurveda, medicina china, yoga clásico ni otra tradición histórica.

Las afirmaciones sobre trauma requieren cautela especial. "Trauma" puede
referirse a una experiencia clínica real, a una metáfora o a una categoría
interna de la escuela. No presentes una técnica como tratamiento del trauma sin
evidencia específica ni permitas que sustituya atención de salud mental.

---

## 11. Derechos y trazabilidad

- Abre la página, artículo, norma o documento exacto.
- Registra la fecha real de publicación o última revisión.
- Comprueba los derechos del objeto concreto.
- Acceso gratuito o presencia de un DOI no equivalen a permiso para RAG.
- Un artículo con todos los derechos reservados puede servir para localizar
  hechos, autores y referencias, pero no debe marcarse `permitted` sin una base
  verificable.
- Una referencia académica cerrada puede aparecer por su título, autor, fecha,
  DOI y breve explicación en `Para profundizar`. Esto no autoriza a incorporar
  su texto completo ni a usarla como fuente principal `permitted`.
- Si el objeto principal solo puede conservarse como referencia, usa
  `rights_status: metadata-only` para ese objeto.
- Si los derechos no están claros, usa `rights_status: unknown`.
- Las tarjetas `unknown` o `metadata-only` no están listas para publicación.
- Prioriza fuentes gubernamentales, institucionales y artículos con licencia
  compatible cuando expresen la misma información.
- No copies extensamente textos de escuelas, manuales ni artículos.
- Cada afirmación importante debe poder localizarse en una fuente declarada.

La tarjeta publicable debe apoyarse principalmente en una fuente con derechos
compatibles. Incluir en su bibliografía el título, DOI y una caracterización
breve de un artículo cerrado no cambia por sí solo el `rights_status` de la
tarjeta. Esas referencias cumplen una función de orientación: no aportan texto
copiado al RAG ni sostienen por sí solas la síntesis publicable.

---

## 12. Límites de seguridad

Las tarjetas no deben:

- diagnosticar a la persona;
- recomendar sustituir atención convencional;
- ofrecer protocolos, número de sesiones o maniobras;
- indicar cómo realizar pruebas diagnósticas no validadas;
- recomendar suspender medicamentos o tratamientos;
- recomendar dietas de eliminación basadas en pruebas no validadas;
- presentar certificados privados como licencia sanitaria;
- afirmar que una mejoría subjetiva demuestra el mecanismo propuesto;
- convertir una tradición o metáfora en anatomía o fisiología demostrada.

---

## 13. Checklist

- [ ] La tarjeta es PC1, PC2, PC3 o PC4 y no mezcla funciones.
- [ ] La práctica y su variante están delimitadas.
- [ ] Se han aclarado profesiones o disciplinas con nombres parecidos.
- [ ] Se distingue lo que ocurre en una sesión de lo que la práctica afirma.
- [ ] Se reconoce el posible significado subjetivo, cultural o narrativo sin
      tratarlo como prueba clínica.
- [ ] PC2 atribuye el marco a una fuente, fundador o escuela concretos.
- [ ] PC2 presenta el debate ciencia-tradición mediante fuentes académicas, no
      comerciales.
- [ ] PC3 evalúa una sola afirmación.
- [ ] PC3 incluye resultados relevantes aunque sean favorables, negativos o
      contradictorios.
- [ ] Se separan fiabilidad, exactitud diagnóstica y eficacia terapéutica.
- [ ] Una conclusión sobre azar está limitada al estudio que la respalda.
- [ ] PC4 distingue riesgos directos e indirectos.
- [ ] La regulación incluye jurisdicción, profesión y fecha.
- [ ] No se usan testimonios, clínicas, marcas o escuelas como prueba de
      eficacia.
- [ ] `source_kind` corresponde al documento real.
- [ ] `source_type` corresponde a la capa.
- [ ] Fecha, URL, DOI o PMID han sido verificados.
- [ ] Los derechos permiten publicar la síntesis en el RAG.
- [ ] Las referencias cerradas se ofrecen solo como orientación bibliográfica,
      sin incorporar su texto ni marcarlas como `permitted`.
- [ ] Incluye una ruta de profundización con artículos, tesis u otras fuentes
      académicas cuando existan.
- [ ] La conclusión orienta y delimita; no cierra la conversación mediante una
      etiqueta o una negación más amplia que la evidencia.
- [ ] Incluye entre 2 y 5 limitaciones honestas.
- [ ] No contiene diagnóstico, tratamiento personalizado ni instrucciones de
      autoaplicación.

---

## 14. Formato de entrega

Antes de cada documento indica:

```text
Capa: PC3 · Evaluación científica
Pregunta que pretende responder:
- ¿Puede el test muscular de la kinesiología aplicada identificar alergias?
```

Después entrega el archivo Markdown completo.

Nombres:

```text
[practica]-que-es-[fuente].md
[practica]-origen-marco-[fuente].md
[practica]-evidencia-[afirmacion]-[fuente].md
[practica]-seguridad-[jurisdiccion-o-fuente].md
```

Usa minúsculas, sin tildes y con guiones en el nombre del archivo.

### Ejemplo de distribución para kinesiología aplicada

```text
kinesiologia-aplicada-que-es-[fuente].md
  -> PC1: definición, procedimiento y diferencia frente a kinesiología académica

kinesiologia-aplicada-origen-marco-[fuente].md
  -> PC2: Goodheart, desarrollo, escuelas y afirmaciones atribuidas

kinesiologia-aplicada-evidencia-test-muscular-[fuente].md
  -> PC3: fiabilidad o exactitud diagnóstica de una afirmación concreta

kinesiologia-aplicada-seguridad-[fuente].md
  -> PC4: riesgos directos, falsos diagnósticos y retraso de atención
```

No uses el ejemplo para completar tarjetas sin investigar. Su función es mostrar
cómo separar las intenciones.
