# VitaMap como mapa para despertar curiosidad

## Concepto de experiencia y plan de implementación por niveles de lenguaje

Versión 0.1 · 2026-07-12
Estado: propuesta de producto · base para validación e implementación

### Estado técnico · 2026-07-12

La base multinivel ya está implementada en el repositorio:

- relectura segura de la tarjeta seleccionada desde el KB;
- parseo determinista de bloques y composición `discover`, `understand`, `deep`;
- límites de tamaño por documento y por bloque;
- enriquecimiento máximo de una tarjeta por respuesta, con fallback al chunk
  clásico para tarjetas antiguas;
- exclusión de informes personales en preguntas conceptuales sobre marcadores;
- selector de profundidad y recomposición de una respuesta sin repetir la
  pregunta;
- sustitución administrativa explícita por `tarjeta_id`, con retiro de la
  versión anterior y rollback si falla la reindexación.

Los tres archivos piloto permanecen en la carpeta de borradores como fuente de
trabajo reproducible. Sus versiones correspondientes —LDL A, glucosa A y
glucosa/HbA1c D— se han sustituido y probado manualmente en el corpus vivo del
piloto. El repositorio no refleja por sí solo ese estado porque el KB operativo
vive en el volumen del VPS.

### Revisión multilingüe · 2026-07-13

La composición funciona, pero su contrato v1 reconoce encabezados españoles y
el alemán depende de la traducción del LLM. La evolución obligatoria —anchors
de bloque independientes del idioma, `content_locale`, rendiciones revisadas y
gates ES/DE— se define en
`docs/HOJA-DE-RUTA-MULTILINGUE-NIVELES-Y-CURIOSIDAD.md`.

## 1. Tesis

VitaMap no debe limitarse a guardar documentos médicos ni a traducir una
analítica. Su propósito más valioso es ayudar a que una persona pase de recibir
números ajenos a **reconocer señales de su propio cuerpo, formular mejores
preguntas y construir progresivamente un mapa personal comprensible**.

El cambio de centro puede expresarse así:

> VitaMap no es un archivo que responde. Es un territorio personal que se
> vuelve visible a medida que la persona aprende a mirarlo.

La propuesta de ofrecer varios niveles de lenguaje es importante y viable.
Resuelve una carencia real: una respuesta puede ser correcta y estar bien
fundamentada, pero fracasar si obliga a la persona a entrar por una puerta
académica antes de haber despertado su interés.

La solución recomendada son **tres profundidades de explicación**, disponibles
en cada tema y elegibles en cada momento. No son tres tipos de usuario, tres
modelos ni tres corpus independientes. Son tres distancias desde las que mirar
el mismo territorio.

## 2. Objetivo de producto

La experiencia debe cultivar cinco movimientos:

1. **Reconocer:** “este dato aparece en mi informe”.
2. **Entender:** “sé, en términos cotidianos, qué observa”.
3. **Relacionar:** “veo con qué otros datos y contextos conviene leerlo”.
4. **Seguir:** “puedo observarlo a lo largo del tiempo sin convertir un cambio
   en diagnóstico”.
5. **Preguntar mejor:** “sé qué desconozco y qué pregunta merece hacer ahora”.

La métrica central no debería ser el número de documentos almacenados ni el
tiempo dentro de la aplicación. Debería ser la **comprensión útil**: temas que la
persona ha explorado, relaciones que ha abierto, fuentes que ha consultado y
preguntas que ha decidido conservar.

## 3. Los tres niveles de lenguaje

### Nivel 1 · Descubrir

Para quien encuentra un término por primera vez o quiere una explicación muy
clara. Usa lenguaje cotidiano, una idea por bloque y, cuando aporta valor, una
metáfora visual breve.

Debe responder:

- ¿qué es esto en palabras normales?;
- ¿qué intenta observar?;
- ¿por qué suele mirarse?;
- ¿qué imagen sencilla me ayuda a recordarlo?;
- ¿cuál es el siguiente detalle que puedo abrir?

No debe infantilizar, ocultar incertidumbre ni convertir la metáfora en una
explicación literal.

Nombre visible sugerido: **Explícamelo fácil**.

### Nivel 2 · Comprender

Es el nivel habitual. Introduce el término correcto, explica el mecanismo
esencial, conecta el dato con su panel y distingue resultado, intervalo de
referencia e interpretación.

Debe responder:

- qué mide exactamente;
- cómo se obtiene y en qué unidades aparece;
- con qué otros marcadores suele leerse;
- de qué condiciones depende;
- qué no permite concluir por sí solo;
- qué muestran los datos personales, cuando la pregunta los incluye.

Nombre visible sugerido: **Quiero entenderlo**.

### Nivel 3 · Profundizar

Para quien quiere mecanismos, matices metodológicos, diferencias entre fuentes,
limitaciones y acceso visible a la evidencia.

Puede incluir:

- fisiología y mecanismo con más detalle;
- método analítico y comparabilidad;
- diferencias entre intervalos, guías y poblaciones;
- calidad, jurisdicción y fecha de la evidencia;
- controversias relevantes;
- límites de extrapolación a una persona concreta.

Nombre visible sugerido: **Muéstrame el detalle**.

### Regla común

Los niveles cambian la **profundidad y el vocabulario**, no los hechos, la
procedencia ni la seguridad. Una explicación sencilla no puede ser menos cierta;
una explicación avanzada no adquiere permiso para diagnosticar.

## 4. No clasificar personas: dejar que elijan la distancia

VitaMap no debería asignar un nivel basándose en edad, estudios, forma de
escribir o supuesta capacidad. Ese tipo de inferencia puede ser condescendiente,
incorrecta y sensible.

Propuesta:

- empezar con **Descubrir** durante el onboarding o con **Comprender** para
  usuarios que ya entran preguntando por un dato concreto;
- mostrar siempre una transición discreta: “Más sencillo” / “Más detalle”;
- permitir cambiar de profundidad en cualquier respuesta sin perder el tema;
- guardar una preferencia solo si la persona lo solicita;
- interpretar frases como “en cristiano”, “¿por qué?”, “con más detalle” o
  “enséñame las fuentes” como controles naturales de profundidad;
- nunca presentar los niveles como principiante, medio y experto.

El nivel es una preferencia de lectura para esta explicación, no una etiqueta de
identidad.

## 5. Patrón editorial: metáfora, anclaje y límite

La analogía de la ciudad para explicar la glucosa es una buena puerta de entrada:
ofrece una escena que la memoria puede conservar. Pero necesita una estructura
que evite que lo memorable sustituya a lo verdadero.

Toda metáfora debería tener tres capas:

1. **Imagen:** una comparación breve y reconocible.
2. **Anclaje literal:** qué representa realmente cada elemento.
3. **Límite:** dónde deja de funcionar la comparación.

Ejemplo editorial:

> **Una imagen para empezar.** Imagina que tu cuerpo es una ciudad y que la
> glucosa es uno de los combustibles que circulan para que sus espacios puedan
> funcionar. La insulina ayuda a muchas células a recibir esa energía.
>
> **Qué significa realmente.** La glucosa en ayunas mide cuánta glucosa hay en
> la sangre después de varias horas sin comer. Ayuda a observar cómo mantiene el
> organismo la disponibilidad de energía cuando no está absorbiendo una comida.
>
> **Hasta dónde sirve la imagen.** El cuerpo no se queda sin actividad durante
> la noche: el hígado puede liberar glucosa y hormonas, sueño, estrés, medicación
> o enfermedad pueden influir. El intervalo aplicable es el indicado por el
> informe y el contexto clínico; un valor aislado no establece una causa.

Esto conserva la potencia de “la ciudad en calma”, pero evita dos simplificaciones
problemáticas: que en ayunas la energía “ya se haya repartido casi toda” y que
exista un rango universal independiente del informe.

## 6. Cómo se sentiría desde el punto de vista del usuario

### Primera visita

La persona no entra en un panel lleno de números. Encuentra su mapa todavía en
penumbra y una invitación concreta:

> Empieza por algo que ya tengas: una analítica, una pregunta o una observación.

Puede subir un documento o elegir “Quiero entender una palabra de mi informe”.
No se le exige conocer categorías médicas.

### Después de subir una analítica

El mapa ilumina los territorios realmente presentes —por ejemplo, glucemia,
lípidos o tiroides— sin otorgar puntos, salud porcentual ni medallas. La persona
puede tocar **Glucosa en ayunas** y recibe primero una explicación corta,
acompañada de tres puertas:

- **Ver mi valor**;
- **Entender cómo funciona**;
- **Ver con qué se relaciona**.

La primera puerta muestra el valor original, fecha, unidad, intervalo del
informe y procedencia. La segunda abre la explicación por niveles. La tercera
muestra relaciones editoriales seguras —panel compartido, lectura conjunta o
contexto—, nunca causalidades inventadas.

### Durante la exploración

La persona puede preguntar normalmente:

- “¿Qué es eso de la glucosa en ayunas?”;
- “explícamelo como si nunca hubiera visto una analítica”;
- “ahora cuéntame el mecanismo”;
- “¿cómo se relaciona con HbA1c?”;
- “¿cómo ha cambiado en mis informes?”;
- “¿de dónde sale esta explicación?”.

La conversación cambia de profundidad sin cambiar de dato ni perder las
fuentes. El mapa conserva el lugar que se está explorando y permite volver.

### Al cerrar una exploración

En lugar de una recomendación automática, aparece una pequeña **brújula**:

- qué has aclarado;
- de qué depende;
- qué no permite concluir;
- qué pregunta podrías guardar para más adelante o para un profesional.

## 7. Curiosidad sin gamificación ni presión para aportar más datos

“Completar el mapa” puede ser una motivación poderosa, pero también puede empujar
a subir información muy sensible o a pedir pruebas innecesarias. Por ello:

- no habrá un porcentaje de salud ni de completitud corporal;
- un territorio vacío significa **“sin datos aportados”**, no “problema” ni
  “tarea pendiente”;
- la aplicación no sugerirá realizar una prueba solo para rellenar el mapa;
- genoma, salud mental, fertilidad y otros dominios sensibles requerirán una
  activación explícita y una explicación clara de privacidad y consecuencias;
- se puede ampliar conocimiento sin aportar datos personales: explorar un tema
  también hace crecer el mapa de comprensión;
- borrar un dato debe apagar ese fragmento sin penalización ni mensajes de
  pérdida de progreso.

La recompensa es descubrir una relación y comprenderla, no acumular datos.

## 8. Arquitectura conceptual

La implementación debe separar cinco planos:

1. **Dato personal estructurado:** valores, unidades, fechas, intervalos y
   procedencia. Nunca los genera el LLM.
2. **Intención:** interpretación, estilo de vida, curiosidad científica, lectura
   conjunta, seguimiento, seguridad o tradición.
3. **Profundidad:** descubrir, comprender o profundizar.
4. **Representación:** texto, banda de valor, sendero temporal, mapa de
   relaciones o microanimación explicativa.
5. **seguridad y evidencia:** límites, fuente, jurisdicción, vigencia y reglas
   anti-diagnóstico.

La profundidad es una dimensión nueva, transversal a las intenciones existentes.
Por ejemplo:

| Intención | Descubrir | Comprender | Profundizar |
|---|---|---|---|
| Qué es LDL | analogía de transporte | función de las lipoproteínas | partículas, ApoB, método y límites |
| Mi valor | valor y rango del informe | contexto y lectura conjunta | comparabilidad y matices de guías |
| Evolución | puntos por fecha | unidades y variabilidad | método, persistencia y limitaciones |
| Curiosidad | idea memorable | mecanismo esencial | fisiología y evidencia primaria |

## 9. Encaje con el corpus y `corpus-taxonomy.json`

La taxonomía actual ya distingue bien la intención mediante `seccion` y
`sections_by_source_type`: `interpretacion`, `curiosidad`, `lectura-conjunta`,
`seguimiento`, `seguridad`, etc. También dispone de `marker_aliases`,
`query_groups` y rutas temáticas.

No conviene reutilizar `seccion` para los niveles de lenguaje: mezclaría qué
pregunta responde una tarjeta con cómo se presenta. Tampoco conviene crear tres
copias de cada documento.

### Propuesta inicial

Mantener la taxonomía v1 intacta durante el prototipo y redactar las tarjetas
prioritarias con bloques editoriales reconocibles:

```markdown
## En una frase
## Una imagen para empezar
## Qué significa realmente
## Cómo se relaciona
## Límites de la explicación
## Si quieres profundizar
## Fuentes
```

El recuperador selecciona la tarjeta por intención y marcador. Como QMD devuelve
un `bestChunk` y el prompt vuelve a truncar la evidencia recuperada, la capa de
composición **no puede alimentarse de ese fragmento**. Una vez seleccionada la
tarjeta, debe releer su cuerpo completo desde el KB, validar la ruta y extraer
los bloques por sus encabezados. Solo los bloques correspondientes a la
profundidad solicitada entran en la composición; no se envía el documento
completo al LLM.

Flujo obligatorio:

```text
consulta
  → QMD localiza y ordena tarjetas
  → selección por intención, marcador y procedencia
  → relectura segura de las tarjetas seleccionadas
  → parseo determinista de bloques editoriales
  → selección por profundidad
  → prompt y representación
```

La relectura debe rechazar escapes del directorio del KB, symlinks, extensiones
no Markdown, documentos demasiado grandes, bloques vacíos y encabezados
reconocidos duplicados. `Límites de la explicación` y `Fuentes` son obligatorios
y se incluyen en los tres niveles.

Ordenar los bloques desde **Descubrir** hasta **Profundizar** sigue siendo una
buena defensa y mejora la lectura humana, pero no sustituye la relectura: el
`bestChunk` de QMD puede proceder de cualquier parte de la tarjeta.

### Evolución posible de la taxonomía

Solo después de comprobar que los bloques editoriales son insuficientes, añadir
un campo opcional, por ejemplo:

```json
"presentation_depth": ["discover", "understand", "deep"]
```

Este campo declararía para qué profundidades está preparada una tarjeta; no
cambiaría su `evidence_level`, `source_type`, `seccion` ni autoridad. La
taxonomía debería subir de versión y el corpus-lint verificar valores permitidos.

`query_groups` puede alimentar los territorios navegables del mapa, pero solo
como agrupación editorial. No debe transformarse en evidencia de causalidad ni
en una arista clínica. Las relaciones visibles deberán indicar su tipo:
“pertenece al mismo panel”, “se interpreta junto con”, “aporta contexto” o
“comparación tradicional”, con procedencia y revisión.

## 10. Contrato de respuesta recomendado

La interfaz no debería depender de que el modelo improvise la forma. El backend
puede devolver, además del texto, una intención de presentación acotada:

```json
{
  "topic_id": "glucosa-en-ayunas",
  "intent": "interpretation",
  "depth": "discover",
  "personal_scope": false,
  "visual": "concept-card",
  "available_actions": [
    "show-personal-value",
    "show-mechanism",
    "show-related-markers",
    "show-sources"
  ]
}
```

Los identificadores, acciones y visuales deben salir de listas cerradas. Los
valores personales continúan llegando desde la memoria estructurada. El LLM
puede redactar una explicación sustentada, pero no decidir números, intervalos,
relaciones clínicas ni permisos.

## 11. Lenguaje visual y animaciones

Las animaciones pueden mejorar mucho la comprensión si muestran un mecanismo y
no sirven de decoración.

Primeras piezas recomendadas:

- **Glucosa en ayunas:** entrada, uso y liberación de glucosa durante comida y
  ayuno, sin simular fisiología individual.
- **LDL y HDL:** partículas transportando lípidos, evitando el falso esquema de
  “colesterol malo contra bueno”.
- **HbA1c:** acumulación gradual como memoria aproximada de exposición, dejando
  visible que no equivale a una fotografía diaria exacta.
- **Ferritina y PCR:** dos señales que aportan contexto diferente y pueden leerse
  juntas sin que una determine automáticamente a la otra.
- **Serie temporal:** aparición pausada de puntos reales, con cortes cuando las
  unidades no son comparables.

Reglas:

- movimiento lento, pausable y compatible con `prefers-reduced-motion`;
- texto alternativo y explicación equivalente sin animación;
- ninguna simulación debe presentarse como modelo predictivo del usuario;
- nada de pulsos rojos, alarmas visuales, confeti o recompensas;
- una animación explica una sola idea y termina dejando una imagen estática útil.

## 12. Seguridad, privacidad y confianza

### Seguridad clínica

- Ante valores críticos, síntomas de alarma o crisis, la claridad directa
  reemplaza metáforas y progresión narrativa.
- El nivel de profundidad no modifica los guardrails.
- Los intervalos se atribuyen al informe o a una fuente identificada.
- Las relaciones del mapa no implican causa, diagnóstico ni recomendación.
- Las perspectivas tradicionales permanecen separadas por procedencia y tipo de
  autoridad, sin equivalencias automáticas con biomedicina.

### Privacidad

- La preferencia de profundidad no necesita revelar estudios, profesión ni
  alfabetización sanitaria.
- Las acciones de exploración y los temas sensibles no deben convertirse en un
  perfil comercial o conductual.
- La telemetría de validación debe minimizarse, agregarse y excluir valores
  clínicos y preguntas textuales siempre que sea posible.
- Subir genoma no puede tratarse como un paso normal de onboarding: requiere un
  consentimiento específico, controles de borrado y una revisión de amenazas
  propia antes de implementarse.

## 13. Plan de acción

### Fase 0 · Acordar el contrato editorial (ahora)

1. Aprobar los nombres y propósito de los tres niveles.
2. Crear una plantilla de tarjeta con metáfora, anclaje literal y límite.
3. Definir un glosario de términos que deben explicarse al aparecer.
4. Elegir cinco temas piloto: glucosa en ayunas, HbA1c, LDL, ferritina/PCR y
   vitamina D.
5. Redactar cada tema en los tres niveles usando las mismas fuentes.
6. Revisar seguridad, comprensión y fidelidad antes de conectarlo al RAG.

**Resultado:** 5 temas × 3 profundidades, evaluables sin cambiar arquitectura.

### Fase 1 · Prototipo de experiencia

1. Añadir a las respuestas los controles **Más sencillo** y **Más detalle**.
2. Incorporar la tarjeta conceptual junto a las visualizaciones personales ya
   existentes.
3. Mantener separadas las acciones “qué es” y “cómo está mi valor”.
4. Conservar tema, intención y profundidad durante los seguimientos.
5. Añadir “Ver fuente” y “Qué no permite concluir” sin ocultarlos en tooltips.
6. Crear pruebas deterministas para que una pregunta general no active datos
   personales y viceversa.

**Resultado:** recorrido completo de LDL y glucosa desde palabra desconocida a
serie personal y fuentes.

### Fase 2 · Primer mapa de exploración

1. Convertir `query_groups` en territorios de navegación, sin aristas clínicas.
2. Mostrar qué territorios contienen datos aportados y cuáles son solo
   explorables.
3. Incorporar relaciones editoriales tipadas y revisadas.
4. Permitir fijar un tema y volver al mismo punto desde el chat.
5. Crear un historial de temas comprendidos o preguntas guardadas, privado y
   borrable.

**Resultado:** mapa que crece en comprensión sin premiar la acumulación de
datos sensibles.

### Fase 3 · Microanimaciones educativas

1. Prototipar una única animación —glucosa o transporte por lipoproteínas—.
2. Validarla con usuarios sin narración previa.
3. Comprobar comprensión con tres preguntas, no con tiempo de permanencia.
4. Añadir versión estática, accesibilidad y movimiento reducido.
5. Crear nuevas animaciones solo cuando la primera demuestre una mejora real.

**Resultado:** un patrón reusable de explicación visual segura.

### Fase 4 · Personalización prudente

1. Permitir preferencia de profundidad por sesión o voluntaria por cuenta.
2. Recomendar una puerta siguiente según el tema activo, no según un perfil
   psicológico inferido.
3. Completar rendiciones alemanas revisadas y demostrar que sencillez, límites
   y tono se conservan; la traducción del LLM queda solo como fallback del chat.
4. Medir si la persona cambia de profundidad y si encuentra las fuentes.

**Resultado:** experiencia adaptable sin clasificar ni manipular al usuario.

### Fase 5 · Nuevos dominios

Incorporar constantes, imágenes, microbioma, genoma o perspectivas tradicionales
solo mediante contratos de datos y seguridad propios. Cada dominio debe definir:

- qué dato representa;
- qué relaciones son defendibles;
- qué visualización ayuda;
- qué no puede concluirse;
- qué consentimiento y borrado requiere;
- qué corpus y evaluación lo sostienen.

Ayurveda conserva su carril autónomo y solo entra en comparación explícita o a
petición de la persona. El genoma exige una revisión de riesgo separada antes de
aceptar archivos reales.

## 14. Pruebas de aceptación

Para cada tema piloto:

- una persona puede explicar con sus palabras qué observa el marcador;
- distingue la metáfora de la explicación literal;
- puede pasar de un nivel a otro sin repetir la pregunta;
- identifica si está viendo educación general o un dato propio;
- encuentra fecha, unidad, intervalo y documento de origen de su valor;
- entiende que una relación visual no implica causalidad;
- puede ver la fuente y los límites;
- el sistema no inventa valores ni completa huecos;
- una consulta general no revela memoria personal;
- el modo de movimiento reducido conserva toda la información.

Preguntas de evaluación sugeridas:

1. “¿Qué crees que mide esto?”
2. “¿Qué parte era una comparación y qué parte era literal?”
3. “¿Qué no puedes concluir todavía?”
4. “¿Dónde mirarías tu valor original?”
5. “¿Qué te gustaría explorar después?”

## 15. Prioridades inmediatas

### Prioridad 1

Definir y probar el patrón de tres niveles con **glucosa en ayunas y LDL**. Son
comprensibles, ya existen en los datos piloto y permiten validar concepto,
visualización, evolución y lectura conjunta.

### Prioridad 2

Añadir el selector de profundidad a la respuesta, sin tocar aún
`corpus-taxonomy.json`. Primero se debe comprobar que la idea funciona con
contenido editorial controlado.

### Prioridad 3

Conectar cada explicación conceptual con tres acciones deterministas: ver mi
valor, ver evolución y ver relaciones. Esto une el aprendizaje con el mapa real.

### Prioridad 4

Prototipar una microanimación accesible. No producir una biblioteca completa
hasta demostrar que mejora la comprensión.

### Prioridad 5

Solo tras la validación, decidir si `presentation_depth` debe convertirse en
metadato de taxonomía y añadir su correspondiente lint y pruebas de recuperación.

## 16. Decisión propuesta

Adoptar los tres niveles como una **capa de presentación transversal**, no como
una nueva clasificación de usuarios ni como tres corpus paralelos.

Empezar por dos temas y un recorrido completo:

> palabra desconocida → imagen memorable → explicación literal → dato personal
> → evolución → relación revisada → fuente → nueva pregunta.

Ese recorrido materializa el propósito profundo de VitaMap: no decirle a la
persona qué debe pensar sobre su cuerpo, sino darle mejores instrumentos para
mirarlo con curiosidad, rigor y autonomía.
