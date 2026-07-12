# Propuesta · Visualización de analíticas (comparativa temporal y con la norma)

Versión 0.2 · 2026-07-11
Estado: dirección aprobada · fundamento técnico inicial en implementación

## 0. Estado de implementación

La primera base ya existe en el repositorio:

- el modelo de marcador personal conserva los campos originales y admite
  `marker_id`, unidad UCUM, rango estructurado y estado de normalización;
- la normalización inicial es determinista y conservadora: propone identidad y
  unidad solo ante coincidencias exactas conocidas y no convierte unidades;
- `getLabSeries` construye series desde la memoria autorizada, conserva la
  procedencia y declara si los puntos son comparables;
- `LabValueBand` representa un valor frente al intervalo del propio informe sin
  semáforo ni veredicto cromático;
- `LabTimeline` dibuja el sendero solo cuando las unidades son comparables; si
  no lo son, conserva la cronología pero interrumpe la lectura como tendencia;
- `/guide/visualization` permite revisar el primer componente con datos
  sintéticos antes de conectarlo al chat o a datos personales.
- `/memory/map` construye ya un mapa real desde la memoria autenticada del
  usuario, sin API pública ni intervención del LLM en los valores;
- `HealthMapViewModel` declara versión de esquema y taxonomía, política de no
  conversión/no diagnóstico y `edges: []` por diseño;
- las perspectivas **Territorios**, **Última analítica** y **Evolución** usan
  `query_groups` únicamente como agrupaciones de navegación;
- las unidades distintas se representan en carriles separados y solo se unen
  puntos que comparten la misma unidad normalizada;
- la lectura de memoria bloquea symlinks que intenten salir del directorio del
  usuario y la página fuerza renderizado privado sin caché compartida.
- el chat adjunta una lámina opcional únicamente ante intención personal de
  laboratorio; la selección se deriva de `marker-scope` y los valores proceden
  de las series estructuradas, no del texto generado por el LLM;
- "última analítica" limita también la lámina a la fecha más reciente, mientras
  que una petición de evolución conserva la serie longitudinal.

Todavía no están implementados el plano autónomo de Ayurveda ni las relaciones
revisadas del futuro grafo. No se dibujan aún aristas clínicas:
`health_area_routes`, `query_groups` y `relacionado_con` no se reinterpretan
como causalidad o equivalencia.

## 1. Qué se pide

Que, al consultar sobre sus analíticas, el usuario pueda acceder a
visualizaciones de sus propios datos en dos modos:

- **Comparativa temporal** — un marcador a lo largo del tiempo (cómo ha
  evolucionado su LDL entre analíticas sucesivas);
- **Comparativa con la norma** — su valor frente al intervalo de referencia.

Con una condición estética explícita: que no resulte **fría y racional** (un
panel clínico que produce ansiedad y falsa autoridad) ni un **juguete o
videojuego** (gamificación: puntuaciones, medallas, rachas, confeti, "health
score 82/100").

## 2. La tensión, resuelta con vuestro propio lenguaje

El punto medio no hay que inventarlo: ya está escrito en
`docs/VitaWende-vision-estetica.txt`. La estética VitaWende **es** la respuesta
a "ni fría ni juguete":

| Polo a evitar | Síntoma visual | Antídoto VitaWende |
|---|---|---|
| Frío / clínico | Rojo "ALTO", semáforo, rejilla estéril, blanco hospital, precisión decimal innecesaria | Penumbra habitable, verde esmeralda con luz propia, franja de calma en vez de zona roja |
| Juguete / videojuego | Puntuaciones, medallas, rachas, barras hacia una "meta", caras emoji | Restricción y escala generosa; la seriedad nace de la calma, no de la severidad clínica |

Tres principios rectores derivados del cuaderno estético:

1. **Reconocimiento, no invención.** "El musgo se aparta y los trazos
   aparecen." La visualización no se impone como un dashboard: **emerge** cuando
   la persona pregunta, como una runa que se descubre. Vive dentro de la
   conversación, no en un panel frío aparte.
2. **Luz interna, nunca agresiva.** El dato más reciente brilla con luz propia
   (esmeralda); el resto reposa en penumbra. Nada parpadea ni urge. "El tiempo
   aquí no corre — está disponible": las líneas se dibujan despacio al revelarse.
3. **Escala generosa, un marcador a la vez.** Un solo marcador, mucho aire
   alrededor, tipografía serena. La sobriedad es lo que aleja del juguete.

## 3. La restricción que manda sobre todo: el guardrail (ADR-006)

VitaMap no diagnostica, no prescribe y **no fija objetivos individuales**
(ver `docs/ARQUITECTURA...` §5 y ADR-013). Una visualización de "tu valor frente
a la norma" es justo donde es fácil romper esa promesa sin querer. Reglas de
diseño no negociables:

- **Sin veredicto cromático.** Nunca pintar un valor como "malo" (nada de
  rojo/verde como juicio). El color comunica recencia y calma, no normalidad.
- **La "norma" es una franja descriptiva, no una sentencia.** Se rotula
  *"intervalo de referencia indicado en este informe"*, no *"ANORMAL"*. No se
  presupone que el intervalo describa una distribución poblacional ni se
  convierte en un juicio sobre la persona.
- **Procedencia visible en cada punto.** Cada medición enlaza a la analítica de
  origen (laboratorio, método, fecha). El intervalo de referencia se toma
  **del propio informe del usuario** como fuente primaria; los rangos
  poblacionales generales son contexto, no objetivo. Esto conecta con el
  grounding por identificador de la etapa E4.
- **Límites junto a la tendencia.** Una tendencia no es un diagnóstico: los
  números varían por laboratorio, método, hora, hidratación, etc. Ese texto
  acompaña siempre a la comparativa temporal.
- **El texto del asistente sigue pasando por el guardrail.** La visualización es
  determinista (ver §5); la prosa que la rodea se clasifica como cualquier otra
  respuesta.

## 4. Diseño concreto de las dos vistas

### 4.1 Comparativa temporal — "el sendero"

Una línea orgánica, no un gráfico bursátil. Cada punto es un momento fechado a
lo largo de un sendero que la persona ha ido recorriendo. El punto más reciente
brilla en esmeralda; los anteriores reposan en penumbra. La línea se dibuja
despacio al aparecer. Sin rejilla dura: solo el sendero, las fechas y, al fondo
y muy difuminada, la franja de referencia para dar contexto sin gritar.

Interacción mínima: tocar un punto revela el valor, la fecha y un enlace a la
analítica de origen. Nada más.

### 4.2 Comparativa con la norma — "la franja de calma"

El intervalo de referencia se representa como una **banda luminosa suave** —la
franja declarada por ese informe—, no como "zona normal verde / zona roja". El
valor de la persona se sitúa **en relación** con esa banda, sin
que su posición fuera de ella se coloree como alarma. El lenguaje hace el trabajo
que el color no debe hacer: descriptivo, con procedencia y con sus límites.

Honestidad sobre "la norma": para muchos marcadores no existe un único intervalo
universal (varía por sexo, edad, método, laboratorio). Por eso la fuente
primaria es el rango del propio informe; cualquier rango poblacional se muestra
como contexto etiquetado, coherente con la lógica figura/fondo del ADR-013.

## 5. Encaje técnico (y por qué es seguro)

- **Renderizado en cliente, determinista.** SVG/Canvas dibujado desde los
  números ya extraídos en el frontmatter de la memoria (ADR-003: cada
  observación es `.md` con valores numéricos y `observed_at`). El LLM **no dibuja
  ni inventa** la gráfica: a lo sumo emite una intención estructurada ("muestra
  la serie de LDL"); los datos los pone el cliente. Cero riesgo de alucinación
  numérica, a diferencia de una imagen generada por el modelo.
- **Coste casi nulo en el VPS.** No añade pasadas de LLM ni carga al CCX13 (CPU,
  ya limitado a 50-80 s, ADR-014) ni rompe el no-streaming del chat (ADR-010).
  La gráfica aparece junto a la respuesta ya filtrada por el guardrail.
- **Privacidad intacta.** La serie se construye con los `.md` del propio usuario
  (`data/users/<id>/memory`); nada sale del servidor. El intervalo de referencia
  viene de su propia analítica o del KB compartido.

## 6. Fases sugeridas (coherente con "mejorar por etapa")

- **Fase A (mínima).** Un marcador: línea temporal + franja de referencia,
  invocada desde el chat al preguntar por ese marcador, con procedencia por
  punto y límites. Suficiente para validar la estética con los 3 usuarios piloto.
- **Fase B.** "¿Qué cambió entre dos analíticas?"; etiquetas multilingües
  (ES/DE); comparación de varias mediciones del mismo marcador.
- **Fase C.** Relaciones entre marcadores de un mismo dossier (solo si se pide);
  vista longitudinal. Encaja con el plano estructurado de Postgres previsto para
  Fase 2/3 (ADR-005), no requiere adelantarlo.

## 7. Variante en estudio · Dinámica chat + lámina (sin decidir)

Esta sección registra una variante **abierta**, pendiente de reflexión. No es una
decisión tomada; convive con el modelo puramente inline de §2 (la gráfica que
emerge dentro de la conversación) como alternativa a evaluar.

**Idea.** El modelo inline cubre bien una pregunta puntual con respuesta visual,
pero no el **seguimiento persistente** (alguien que se mide la presión a diario y
quiere ver el último mes mientras conversa: la gráfica inline se va perdiendo al
hacer scroll). La variante: *el chat invoca y ordena; un panel lateral —"la
lámina", no "dashboard"— conserva el dato fijado mientras la conversación
continúa.* Emergencia más permanencia. Se pide con palabras ("muéstrame mi
presión del último mes") y la lámina obedece.

**Clase de dato que la justifica.** Las constantes auto-medidas (presión, peso,
glucosa) son densas, diarias y ruidosas, a diferencia de los marcadores de
laboratorio (escasos y episódicos). Esa densidad diaria es lo que pide una
superficie persistente y no solo una gráfica inline.

**Bucle de entrada por el chat.** Como la medición es diaria, escribir
`presión 120/78 hoy` en el mismo campo guarda la observación en memoria y
actualiza la lámina. Un solo lugar para conversar y para registrar; sin
formulario aparte.

**Cautela reforzada (presión).** Es el dato más sensible al guardrail por los
umbrales de hipertensión. La franja se mantiene atribuida y descriptiva
("intervalo indicado por la fuente seleccionada"), sin "ALTO" en rojo ni semáforo, con la
advertencia de que una lectura aislada no se interpreta sola. No se suaviza el
ruido en una falsa tendencia limpia: mostrar la dispersión es parte del mensaje.

**Bifurcaciones aún por decidir (dependen del gusto, no de la técnica):**

1. ¿La lámina está siempre visible (más "panel", riesgo de frío) o aparece solo
   al fijar algo (más fiel a "el musgo se aparta")? Inclinación inicial: vacía y
   en penumbra por defecto, cobra vida al fijar el primer dato.
2. ¿Una sola lámina enfocada (refuerza la sobriedad anti-juguete) o varias
   fijables (vigilar presión + peso a la vez)? Inclinación inicial: empezar por
   una y medir si se pide más.

En móvil la lámina no es una segunda columna sino una tarjeta plegable fijada
arriba, con la conversación debajo.

## 8. Resumen de decisiones propuestas

- La visualización **emerge en la conversación** al preguntar, no es un panel
  aparte (principio "reconocimiento, no invención").
- **Sin semáforo ni veredicto cromático**; el color comunica recencia y calma.
- La norma es una **franja descriptiva** con procedencia, no una sentencia.
- **Procedencia y límites** acompañan siempre a la gráfica (enlaza con E4).
- **Renderizado determinista en cliente** desde el frontmatter; el LLM no dibuja
  los números.
- Sin coste extra de inferencia ni cambios en el guardrail o el no-streaming.
- Adopción **por fases**, empezando por un único marcador.
