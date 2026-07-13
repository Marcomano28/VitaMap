# Pausa curiosa · Una ventana para explorar sin seguir analizando

Versión 0.1 · 2026-07-13
Estado: esbozo de producto y plan de implementación

### Estado técnico · 2026-07-13

La Fase 1 está implementada en el repositorio, pendiente de despliegue:

- endpoint autenticado `/api/curiosity`, separado de `/api/chat`;
- lectura exclusiva del KB compartido, sin índice ni valores personales;
- filtro duro por `science-curiosity-summary`, `seccion: curiosidad`, derechos y
  catálogo piloto;
- selección relacionada mediante markers canónicos o general cuando no existe
  tema/C exacta;
- exclusión de tarjetas vistas durante la sesión;
- tarjeta determinista dentro del chat con fuente, límite, `Explorar esto` y
  `Volver al tema`;
- botón disponible en el chat vacío y bajo respuestas seguras;
- piloto limitado a español hasta disponer de cuerpos editoriales en alemán;
- ocho tarjetas C revisadas en el catálogo inicial, elegidas entre 54
  disponibles en la preparación local.

La habilitación por idioma, el estado de localización y los gates que debe
superar el catálogo se definen en
`docs/HOJA-DE-RUTA-MULTILINGUE-NIVELES-Y-CURIOSIDAD.md`.

También existe `corpus-preparation/PROMPT-PAUSA-CURIOSA.md` para investigar
nuevas candidatas sin relajar el contrato editorial.

## 1. Idea central

VitaMap puede ofrecer una pausa voluntaria dentro de la exploración de salud:
una tarjeta breve, visual y bien documentada que permita cambiar de aire sin
abandonar la curiosidad por el cuerpo.

No sería una recomendación clínica ni otra interpretación de la analítica. Su
función sería:

- aliviar la densidad de una conversación médica;
- recuperar el placer de descubrir;
- mostrar que el cuerpo es más amplio que un resultado;
- abrir caminos que la persona puede explorar más tarde;
- reforzar VitaMap como mapa de conocimiento, no solo como lector de informes.

Principio rector:

> Una pausa cambia la perspectiva, no desvía ni trivializa lo que preocupa a la
> persona.

## 2. Nombre y tono

Nombre de trabajo recomendado: **Pausa curiosa**.

Posibles textos del control:

- `Abrir una curiosidad`;
- `Cambiar de perspectiva`;
- `Una pausa sobre el cuerpo`.

Evitaría `Dato curioso`, porque puede sonar a trivia desechable, y
`Sorpréndeme`, porque empuja hacia el sensacionalismo y la mecánica de contenido
infinito.

La tarjeta debe resultar ligera, pero no bromista. Puede asombrar sin utilizar
titulares como “no creerás…”, cifras espectaculares sin contexto o afirmaciones
que transformen un promedio en una regla para todas las personas.

## 3. Tres clases de pausa

### A. Relacionada con el tema

Es la primera versión recomendada. Si la conversación trata sobre LDL, puede
abrir una curiosidad sobre el transporte de colesterol. Si trata sobre glucosa,
puede explicar el fenómeno del alba o por qué la glucemia no permanece plana
durante la noche.

Utiliza las tarjetas C que ya existen:

```text
source_type: science-curiosity-summary
seccion: curiosidad
```

Ventaja: el desvío sigue conectado con lo que la persona está aprendiendo, pero
deja de mirar su resultado concreto.

### B. General sobre el cuerpo

Permite desconectar del tema activo. Ejemplos posibles, solo después de
verificar fuentes y formulación:

- renovación de diferentes tejidos;
- por qué algunos tipos celulares duran días y otros muchos años;
- cómo cambia la piel de forma continua;
- qué parte del hueso se remodela;
- por qué el intestino necesita una superficie tan extensa;
- cómo el organismo mantiene varios ritmos diarios.

Estas tarjetas no deben usar la memoria personal ni insinuar que la curiosidad
tiene relación con un resultado del usuario.

### C. Una ventana a la ciencia reciente

Puede presentar un avance reciente, pero es la modalidad más delicada y no debe
formar parte del primer piloto.

Un “avance” suele atravesar varias etapas: resultado inicial, replicación,
validación, posible utilidad clínica y adopción. La tarjeta debe indicar con
claridad en cuál se encuentra.

Nunca se generará desde titulares ni mediante un agregador automático de
noticias. Necesita revisión editorial, fecha visible, fuente primaria o
institucional, límites y una fecha de revisión o caducidad.

## 4. Experiencia propuesta

### Dentro del chat

Después de una respuesta segura puede aparecer un control discreto:

> `¿Quieres cambiar de perspectiva? · Abrir una curiosidad`

Al pulsarlo se despliega una tarjeta debajo de la respuesta, sin crear un nuevo
turno del asistente y sin consultar la memoria personal.

La tarjeta contiene:

1. un título breve;
2. una idea memorable;
3. una explicación de dos o tres párrafos;
4. “qué no significa” o el límite principal;
5. fuente y fecha;
6. dos salidas: `Volver al tema` y `Explorar esto`.

`Explorar esto` sí puede iniciar una nueva pregunta en el chat. La persona
decide si convierte la pausa en un nuevo camino.

### Un botón, dos comportamientos

El control puede estar disponible también cuando el chat está vacío. No hace
falta pedir a la persona que elija previamente entre “relacionada” y “general”:
VitaMap puede resolverlo con el contexto disponible.

```text
si existe un tema activo y tiene tarjeta C
  → mostrar una curiosidad de ese tema

si existe un tema activo pero no tiene tarjeta C
  → ofrecer una curiosidad general
  → no presentar una tarjeta cercana como si estuviera directamente relacionada

si no existe tema activo
  → elegir una curiosidad al azar del catálogo general aprobado
```

Ejemplos:

- conversación sobre LDL → curiosidad C de LDL o transporte de lipoproteínas;
- conversación sobre glucosa → curiosidad C sobre ritmos de glucosa;
- chat vacío → una curiosidad general sobre células, tejidos, ritmos o medición;
- tema sin C → tarjeta general claramente presentada como cambio de tema.

El botón conserva un único texto: `Abrir una curiosidad`. La tarjeta puede
indicar discretamente `Relacionada con este tema` o `Una ventana distinta` para
que la persona entienda por qué apareció.

### En la página del mapa

Puede existir también una pequeña ventana separada: **Algo que quizá no sabías**.
No debe ocupar el centro ni competir con los datos personales. Cambia cuando la
persona lo solicita, no cada pocos segundos.

### En móvil

La curiosidad aparece como una tarjeta plegable bajo la respuesta. No debe
abrirse como modal ni tapar la conversación.

## 5. Qué no debe hacer

- No aparecer automáticamente después de cada respuesta.
- No interrumpir una consulta urgente, un bloqueo de seguridad o un aviso de
  crisis.
- No mostrarse inmediatamente después de información que pueda resultar
  emocionalmente difícil, salvo petición explícita.
- No utilizar valores personales para elegir la curiosidad.
- No decir “esto te interesa porque tu LDL está alto”.
- No recomendar pruebas, productos, dietas o tratamientos.
- No crear una secuencia infinita de tarjetas.
- No utilizar puntos, rachas, recompensas o porcentajes de conocimiento.
- No guardar intereses sin una acción expresa de la persona.

La pausa debe ser una puerta, no un mecanismo para prolongar artificialmente el
tiempo dentro de la aplicación.

## 6. Encaje con el corpus actual

La arquitectura ya dispone de la pieza editorial adecuada: la tarjeta C de
curiosidad científica. No hace falta crear un nuevo tipo documental para la
primera versión.

Campos principales:

```yaml
source_type: science-curiosity-summary
seccion: curiosidad
marker:
  - glucosa-en-ayunas
```

Para curiosidades generales puede utilizarse un marcador o concepto canónico
cuando exista. No se debe usar `[general]` indiscriminadamente ni inventar un
marker para una cifra llamativa. Si el concepto todavía no existe en
`corpus-taxonomy.json`, primero se propone su identidad y su utilidad para el
mapa.

En una fase posterior podría evaluarse un metadato opcional:

```yaml
curiosity_scope: marker | system | body-general | research-frontier
```

No se añadirá a la taxonomía hasta validar que mejora realmente la selección.

## 7. Selección segura y determinista

La pausa no debe pedir al LLM que invente una curiosidad.

Flujo recomendado:

```text
usuario pulsa “Abrir una curiosidad”
  → servidor recibe el tema activo si existe, no los valores personales
  → consulta únicamente tarjetas con seccion=curiosidad
  → filtra por source_type= science-curiosity-summary
  → busca coincidencia exacta de marker cuando existe tema activo
  → si no existe coincidencia o no hay tema, usa el catálogo general aprobado
  → excluye tarjetas ya vistas durante la sesión
  → devuelve cuerpo, fuente, fecha y límites
  → la interfaz renderiza la tarjeta de forma determinista
```

La restricción por `seccion` debe ser fuerte para este endpoint. No basta con la
preferencia suave utilizada por el chat general: una pausa curiosa no puede
devolver accidentalmente una tarjeta A, una interpretación personal o una capa
tradicional.

El LLM puede intervenir después si la persona pulsa `Explorar esto`, pero no es
necesario para presentar la tarjeta.

### Qué significa “al azar”

La elección aleatoria ocurre únicamente dentro de un conjunto previamente
revisado. No consulta al azar todo el KB, no usa internet y no pide al modelo que
invente una curiosidad.

El selector debe aplicar antes:

1. estado publicado y revisado;
2. derechos `permitted` o `licensed`;
3. `source_type: science-curiosity-summary`;
4. `seccion: curiosidad`;
5. idioma preferente cuando exista;
6. exclusión de tarjetas vencidas o retiradas;
7. exclusión de identificadores ya vistos en la sesión.

Después puede barajar las tarjetas restantes mediante una semilla de sesión. La
misma sesión no repite tarjetas hasta agotar el pequeño catálogo; al agotarlo,
puede indicar que no hay otra curiosidad revisada en vez de iniciar un carrusel
sin fin.

## 8. Privacidad y seguridad

### Memoria personal

El endpoint de curiosidad no consulta el índice del usuario. Para relacionar la
pausa con la conversación solo recibe identificadores canónicos del tema, por
ejemplo `colesterol-ldl`, nunca valores, fechas ni texto completo del informe.

### Registro

Puede conservarse localmente durante la sesión una lista de tarjetas ya vistas
para evitar repeticiones. No hace falta crear un perfil persistente de intereses.

Si posteriormente se permite `Guardar para explorar`, esa acción debe ser
voluntaria, visible y borrable.

### Contenido

- Todas las afirmaciones llevan fuente.
- Las cifras incluyen población, unidad, periodo y grado de variación cuando
  sean pertinentes.
- Los promedios no describen automáticamente a una persona.
- La antigüedad celular se formula por tipo celular y método; “las células de
  un órgano viven X” suele ser una simplificación excesiva porque un mismo
  órgano contiene poblaciones diferentes.
- Cifras como “kilogramos de piel al año” solo se publican si existe una fuente
  adecuada y si se explica que son estimaciones variables. Si no, se descartan
  aunque sean memorables.
- Un estudio reciente no se presenta como avance clínico consolidado.

## 9. Diseño visual

La pausa puede sentirse como una pequeña ventana iluminada dentro de la
conversación:

- color y luz comunican cambio de perspectiva, no autoridad;
- una ilustración o diagrama simple puede acompañar la idea;
- el movimiento, si existe, explica un proceso y termina en una imagen estable;
- debe respetar `prefers-reduced-motion`;
- fuente y límite permanecen visibles;
- no debe parecer publicidad, carrusel social ni tarjeta coleccionable.

Ejemplos visuales:

- renovación celular: varias escalas temporales, no una cuenta regresiva;
- piel: capas que se desplazan gradualmente;
- hueso: construcción y retirada simultáneas;
- ritmos biológicos: un ciclo de luz suave;
- transporte de lípidos: partículas con funciones distintas, sin héroes ni
  villanos.

## 10. Plan de implementación

### Fase 0 · Inventario editorial

1. Enumerar todas las tarjetas C publicadas.
2. Revisar cuáles son realmente curiosidades y cuáles duplican tarjetas A o D.
3. Comprobar fuente, fecha, derechos, `evidence` y límites.
4. Elegir entre 8 y 12 tarjetas seguras para el piloto.
5. Incluir distintos sistemas, no solo analíticas metabólicas.

Resultado: un pequeño catálogo curado, no una generación automática.

### Fase 1 · Pausa relacionada en el chat

1. Añadir `Abrir una curiosidad` bajo respuestas educativas seguras.
2. Crear un endpoint autenticado que consulte solo el corpus compartido.
3. Aplicar filtro duro `science-curiosity-summary` + `seccion=curiosidad`.
4. Pasar únicamente marker, sistema o área temática del turno.
5. Renderizar la tarjeta sin LLM.
6. Añadir `Volver al tema` y `Explorar esto`.
7. Limitar a una tarjeta abierta por respuesta.
8. Mostrar el mismo botón en el estado vacío del chat y, en ese caso, elegir
   entre el catálogo general aprobado.
9. Si el tema activo no tiene C exacta, ofrecer una tarjeta general etiquetada
   como cambio de perspectiva, no una relación aproximada.

Resultado: la persona puede cambiar de aire sin perder el hilo ni exponer datos.

### Fase 2 · Pausa general

1. Añadir una opción explícita `Algo distinto`.
2. Crear categorías amplias: células y tejidos, ritmos, sentidos, movimiento,
   microbiología, historia de la medición y fronteras de investigación.
3. Elegir la tarjeta con una semilla de sesión y excluir vistas recientes.
4. Evitar personalización basada en analíticas o historial clínico.

Resultado: desconexión real del tema activo, pero dentro del propósito de
VitaMap.

### Fase 3 · Ciencia reciente revisada

1. Crear un flujo editorial separado en `/admin/corpus`.
2. Exigir fuente primaria más contexto institucional cuando exista.
3. Registrar etapa: inicial, replicada, validada o aplicada.
4. Añadir `review_after` para volver a comprobarla.
5. Retirar automáticamente de la selección —no borrar— tarjetas cuya revisión
   haya vencido.

Resultado: una ventana a la frontera científica sin convertir VitaMap en un
agregador de titulares.

### Fase 4 · Microvisualizaciones

1. Seleccionar dos curiosidades cuya comprensión mejore visualmente.
2. Crear una versión estática accesible.
3. Añadir animación breve solo si mejora la explicación.
4. Validar comprensión y recuerdo, no tiempo de permanencia.

Resultado: patrón visual reutilizable y medido.

## 11. Pruebas de aceptación

- La curiosidad nunca muestra valores, fechas o documentos personales.
- Solo recupera tarjetas C autorizadas.
- No aparece en respuestas bloqueadas, crisis o avisos urgentes.
- La persona distingue una curiosidad de una interpretación clínica.
- La fuente y el límite son visibles sin desplegar menús secundarios.
- `Explorar esto` inicia un nuevo tema sin alterar el mensaje anterior.
- No repite la misma tarjeta durante una sesión corta.
- La interfaz funciona sin animación.
- Una tarjeta sobre ciencia reciente muestra fecha y madurez de la evidencia.
- No existe desplazamiento infinito ni recompensa por abrir más tarjetas.

## 12. Prioridad propuesta

Construir primero únicamente la **pausa relacionada con el tema**, reutilizando
tarjetas C ya revisadas de LDL, glucosa, vitamina D y otros marcadores con buena
cobertura.

No empezaría todavía por estadísticas generales ni avances recientes. Esas dos
modalidades requieren ampliar taxonomía, fuentes y revisión editorial. La
primera versión permitirá comprobar si la pausa realmente relaja y despierta
curiosidad o si simplemente añade más información a una conversación ya densa.

La señal de éxito no será cuántas tarjetas abre la persona, sino si después de
la pausa puede volver al tema con más interés y menos sensación de carga.
