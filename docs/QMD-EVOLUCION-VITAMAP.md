# Evolución del uso de QMD en VitaMap

Versión 0.4 · 2026-06-12
Estado: documento técnico activo

## 1. Propósito

Este documento define cómo debe evolucionar el uso de
[`@tobilu/qmd`](https://github.com/tobi/qmd) dentro de VitaMap.

No sustituye al roadmap general ni a las decisiones de arquitectura. Su
función es más concreta:

- describir la integración QMD que existe realmente;
- separar lo que está validado de lo que todavía es una hipótesis;
- registrar las lecciones obtenidas durante la primera prueba integral;
- fijar las mejoras necesarias antes de admitir datos reales de terceros;
- establecer criterios para mantener QMD embebido o convertirlo en un
  servicio persistente;
- evitar que una actualización de QMD cambie silenciosamente el contrato
  de recuperación.

Cuando este documento contradiga ejemplos antiguos de `docs/ROADMAP.md`,
prevalece este documento para la operación de QMD.

La organización editorial por tema, las tarjetas A/B/C, T1/T2/T3 y AC1-AC4,
y su evolución hacia recuperación por intención se definen en
`docs/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md`.

## 1.1 Principio rector

> **La memoria es el producto. El RAG es la lente. Las clasificaciones son
> señales de procedencia, no la arquitectura central.**

Esta jerarquía gobierna las decisiones de recuperación:

1. VitaMap existe para que una persona conserve y comprenda la continuidad de
   su propio historial.
2. QMD ayuda a encontrar fragmentos relevantes de esa memoria; no define qué
   significa la experiencia de la persona.
3. La intención de la pregunta decide qué conocimiento ocupa el primer plano.
   Una pregunta clínica prioriza evidencia clínica y educación institucional;
   una pregunta tradicional, histórica o cultural prioriza las fuentes y el
   contexto académico adecuados a esa tradición.
4. Las afirmaciones sobre diagnóstico, eficacia, parámetros clínicos y
   seguridad se someten siempre al estándar clínico correspondiente, aunque
   procedan de una tradición o producto comercial.
5. Una fuente tradicional puede aportar significado textual, histórico,
   cultural o filosófico sin tener que presentarse como evidencia clínica. No
   se convierte en ciencia, pero tampoco necesita ser refutada para poder ser
   comprendida.
6. Cuando ciencia y tradición responden preguntas distintas, el asistente no
   fuerza equivalencia ni enfrentamiento. Cuando hacen la misma afirmación
   clínica, explica la diferencia de evidencia con precisión y sin desprecio.
7. Las clasificaciones ayudan a atribuir una fuente con honestidad, pero no
   convierten relevancia en verdad ni deben dominar la experiencia.

Este principio debe conservarse tanto en el ADR que gobierna el RAG como en el
system prompt del asistente. Una ampliación técnica del corpus no puede cambiar
silenciosamente el centro del producto desde "comprender mi historial" hacia
"administrar una biblioteca universal".

## 1.2 Figura y fondo como principio operativo

VitaMap usa la relación **figura-fondo** para organizar recuperación y respuesta:

- la figura es el conocimiento que responde directamente a la intención actual;
- el fondo aporta contexto, continuidad histórica, lenguaje o una perspectiva
  distinta sin competir por protagonismo;
- figura y fondo pueden intercambiarse según la pregunta;
- la memoria personal permanece en el centro de ambos planos.

La ciencia no es una voz que tenga que corregir retóricamente toda fuente
tradicional. Es el método exigible cuando se formulan afirmaciones clínicas
comprobables. Del mismo modo, una tradición no necesita adoptar vocabulario
biomédico para conservar interés histórico, cultural o reflexivo.

Una consulta sobre un texto ayurvédico puede responderse primero desde el texto,
su comentario y su historia. Una consulta sobre si una preparación reduce la
HbA1c exige estudios clínicos de esa preparación. Una comparación presenta
ambos carriles por separado y explica dónde se encuentran, dónde divergen y qué
preguntas siguen abiertas.

Este principio evita dos errores simétricos:

1. usar una tradición para sustituir evidencia sobre eficacia o seguridad;
2. entrar en todo sistema ancestral con una actitud de laboratorio que aplana
   su lenguaje y convierte la conversación en una refutación permanente.

Los límites de seguridad conocidos nunca se ocultan. La diferencia está en
presentarlos cuando son pertinentes para la intención o el riesgo, no como un
ritual de superioridad de una fuente sobre otra.

## 2. Decisión vigente

QMD continúa siendo el motor RAG de VitaMap.

La decisión no se revierte por los fallos encontrados durante la primera
prueba. Esos fallos estuvieron en la integración, el empaquetado y las
expectativas de rendimiento, no en la idea de usar QMD como índice local
de documentos markdown.

QMD encaja con VitaMap por cinco razones:

1. combina búsqueda BM25 y vectorial sobre markdown;
2. funciona localmente y no requiere enviar datos de salud a un proveedor;
3. usa SQLite, adecuado para el volumen del piloto;
4. permite un índice separado por usuario;
5. mantiene la memoria portable: el markdown sigue siendo legible sin QMD.

QMD no es la fuente de verdad. Es una estructura derivada y reconstruible.

La fuente de verdad es:

```text
/data/users/<user_id>/memory/**/*.md
/data/kb/**/*.md
```

Los índices derivados son:

```text
/data/users/<user_id>/index.sqlite
/data/kb-index.sqlite
```

Si un índice se pierde o queda dañado, debe poder eliminarse y reconstruirse
desde los markdown sin perder información aportada por el usuario.

## 3. Límites de responsabilidad

QMD es responsable de:

- descubrir markdown nuevos, modificados o eliminados;
- construir el índice BM25;
- generar y guardar embeddings;
- recuperar documentos y fragmentos relevantes;
- devolver metadatos de recuperación y puntuaciones.

QMD no es responsable de:

- autenticar usuarios;
- decidir qué usuario puede consultar qué índice;
- cifrar documentos originales;
- aplicar consentimiento;
- extraer texto desde PDF o imágenes;
- interpretar clínicamente una analítica;
- decidir qué sistema de conocimiento tiene autoridad para la persona;
- determinar por sí solo qué fuentes fueron realmente usadas en una respuesta;
- garantizar que una respuesta del LLM sea segura;
- registrar auditoría;
- realizar backups.

Estas fronteras deben mantenerse. En particular, una respuesta encontrada
por QMD no se considera clínicamente correcta solo por tener una puntuación
alta.

## 4. Arquitectura actual

### 4.1 Aislamiento

Cada usuario tiene:

```text
/data/users/<user_id>/
  memory/
  documents/
  inbox/
  index.sqlite
```

La función de sesión valida `user_id` antes de usarlo en una ruta. El índice
personal se abre usando exclusivamente el identificador de la sesión, nunca
un identificador recibido desde el navegador.

El corpus externo compartido vive actualmente en:

```text
/data/kb/
/data/kb-index.sqlite
```

En desarrollo local, los valores relativos de `.env` se resuelven respecto a
la carpeta que contiene ese archivo. Así `DATA_ROOT=./data` apunta siempre al
`data/` de la raíz del proyecto, aunque npm ejecute Next desde `apps/web`.
Los scripts de indexación aplican la misma regla. En Docker no interviene esta
normalización porque `DATA_ROOT`, `KB_INDEX_PATH` y `AUTH_DB_PATH` ya son rutas
absolutas bajo `/data`.

Dentro de ese store, los metadatos distinguen evidencia clínica, educación
institucional y tradición. Para el piloto no se requiere multiplicar índices:
la separación conceptual se aplica mediante clasificación mínima, recuperación
selectiva y atribución visible.

Separar físicamente el corpus clínico y el tradicional puede evaluarse en una
fase posterior si las pruebas demuestran que los filtros, el prompt y las
citas no bastan para evitar mezclas, o si cada carril necesita políticas de
acceso, actualización o rendimiento diferentes. Un índice separado reduce
ciertos errores de recuperación, pero no garantiza por sí solo que el LLM use
correctamente las fuentes.

La separación por bases SQLite distintas es una defensa importante. Reduce
el impacto de un error de filtrado entre usuarios y evita depender de una
condición SQL para separar datos médicos personales. Esta propiedad se refiere
al índice personal de cada usuario frente al corpus externo compartido.

### 4.2 Versión

El lockfile instala actualmente:

```text
@tobilu/qmd 2.5.3
sqlite-vec 0.1.9
```

El manifiesto declara todavía `@tobilu/qmd` con rango `^2.0.1`. El lockfile
protege los builds reproducibles mientras se use `npm ci`, pero el rango debe
reemplazarse por una versión exacta antes del piloto real.

QMD evoluciona rápidamente y su contrato de resultados ha cambiado durante
el desarrollo. Una actualización no debe entrar como efecto colateral de una
instalación.

### 4.3 Modelo de embeddings

VitaMap fija:

```text
QMD_EMBED_MODEL=hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf
```

La elección es adecuada para memoria en español y alemán. Cambiar el modelo
requiere regenerar los vectores porque embeddings de modelos diferentes no
son compatibles.

El modelo se guarda en:

```text
/data/.cache/qmd/models/
```

La caché está en el volumen persistente de VitaMap y se comparte entre la
aplicación web y las tareas administrativas.

### 4.4 Indexación

Después de escribir o eliminar un markdown, VitaMap ejecuta:

```ts
await store.update({ collections: ["memory"] })
await store.embed({ force: false })
```

Esto mantiene sincronizados:

- el inventario de documentos;
- el índice BM25;
- los vectores pendientes;
- las eliminaciones.

Existe además una tarea administrativa que recorre los usuarios y reconstruye
sus índices. Se utilizó con éxito para recuperar el primer documento sintético
después de un fallo de `sqlite-vec`.

### 4.5 Búsqueda actual

En el VPS sin GPU, VitaMap no usa actualmente la tubería completa de QMD.

La consulta se convierte en dos búsquedas estructuradas:

```ts
[
  { type: "lex", query },
  { type: "vec", query },
]
```

Y se ejecuta con:

```ts
rerank: false
candidateLimit: 10
```

Por tanto, la configuración actual conserva:

- BM25 para coincidencias literales;
- búsqueda vectorial para coincidencias semánticas;
- fusión RRF;
- selección del mejor fragmento.

Y desactiva:

- expansión local de la consulta;
- reranking mediante el modelo Qwen3-Reranker.

Esta reducción fue necesaria porque la tubería completa tardaba varios
minutos en CPU. No debe describirse como la configuración de máxima calidad,
sino como el perfil de piloto CPU.

### 4.6 Contrato del resultado

La búsqueda híbrida de QMD 2.5.3 devuelve el fragmento relevante en:

```text
bestChunk
```

No en `snippet`.

VitaMap adapta este resultado mediante una capa propia antes de construir el
prompt. La capa:

- usa `bestChunk`;
- conserva respaldos para versiones anteriores;
- elimina el prefijo virtual `memory/` o `kb/`;
- devuelve rutas relativas que la aplicación puede abrir;
- lee el frontmatter desde el markdown original;
- retira el YAML del fragmento antes de aplicar el límite de contexto, porque
  sus metadatos relevantes ya viajan por separado.

Este adaptador forma parte del contrato de integración y debe tener pruebas.

### 4.7 Estado del corpus compartido

La tubería para consultar evidencia está implementada, pero el repositorio
solo contiene `data/kb/guidelines/example-seed.md`. El propio documento se
declara placeholder, usa `example.org` y no aporta evidencia clínica.

Por tanto:

- el RAG dual existe técnicamente;
- la memoria personal ya puede recuperarse;
- el corpus compartido todavía no puede considerarse operativo;
- una respuesta que solo cite la analítica personal no demuestra consulta de
  evidencia.

Antes del piloto deben incorporarse documentos curados con procedencia,
fecha y URL verificables para las preguntas del piloto que realmente requieran
conocimiento externo. La ausencia de un corpus amplio no invalida la función
principal de VitaMap: consultar y comprender la memoria personal.

## 5. El corpus compartido al servicio de la memoria

### 5.1 Función y límites

El corpus compartido no es una segunda memoria del usuario ni el centro del
producto. Es una biblioteca auxiliar que permite:

- contrastar un dato personal con información externa;
- explicar conceptos que no están contenidos en el historial;
- indicar límites, incertidumbre y cuestiones de seguridad;
- explorar fuentes tradicionales desde su propio lenguaje y contexto académico;
- señalar coincidencias, diferencias y preguntas abiertas entre sistemas;
- presentar una perspectiva tradicional en primer plano cuando la intención de
  la persona lo solicite, sin añadir una refutación clínica automática.

La recuperación debe entenderse como tres carriles distintos:

1. **Memoria personal**: observaciones, analíticas, cuestionarios y documentos
   aprobados por el usuario. Es el carril principal y no recibe una
   clasificación de evidencia.
2. **Evidencia y educación clínica**: guías, revisiones y documentos
   institucionales para interpretación, eficacia, seguridad y otros parámetros
   clínicos comprobables.
3. **Tradiciones y contexto**: textos o síntesis de Ayurveda, medicina
   tradicional china y otros marcos, junto con historia, filología,
   antropología y otras lecturas académicas. Se atribuyen como tales y no se
   presentan como evidencia clínica por el hecho de estar indexados.

La implementación actual consulta el índice personal y el corpus externo en
paralelo para todas las preguntas. Es un compromiso operativo del prototipo,
no el comportamiento conceptual definitivo. La evolución deseable es consultar
cada carril según la intención de la pregunta y conservar suficiente contexto
conversacional para resolver preguntas de seguimiento.

### 5.2 Clasificación mínima para el piloto

El piloto no necesita una taxonomía universal. Necesita metadatos suficientes
para que una persona entienda qué clase de fuente está leyendo y cuáles son
sus límites.

Cada Markdown compartido debe declarar como mínimo:

```yaml
---
title: "Título verificable"
source_url: "https://fuente-oficial.example/documento"
publication_date: "2025-01-15"
source_kind: clinical-evidence
source_type: guideline
review_status: approved
reviewed_at: "2026-06-09T12:00:00Z"
limitations:
  - "No sustituye evaluación clínica individual"
---
```

`source_kind` debe pertenecer inicialmente a una lista corta:

```text
clinical-evidence
institutional-education
tradition-context
```

`tradition-context` describe la función y procedencia del documento, pero no
obliga a asignarle `evidence_level: tradition`. Por ejemplo, una revisión
institucional de NCCIH sobre Ayurveda puede clasificarse como
`source_kind: tradition-context` y `evidence_level: unrated`: trata una
tradición, pero no es por ello una fuente tradicional primaria ni recibe un
grado clínico.

Cuando la propia fuente publique una calificación formal, puede conservarse
literalmente en un campo opcional como `published_grade: "GRADE: moderate
certainty"`. VitaMap no inventa equivalencias entre GRADE, tipo documental y
tradición. El campo actual `evidence_level` puede mantenerse por compatibilidad
durante la transición, pero `guideline`, `tradition` y GRADE no deben seguir
tratándose como valores de una sola escala.

### 5.3 Contrato del asistente y del system prompt

El asistente debe aplicar explícitamente estas reglas:

1. Empezar por la pregunta y la memoria de la persona, no por demostrar la
   amplitud del corpus.
2. Atribuir como memoria personal todo patrón obtenido del historial y
   formularlo como observación, nunca como evidencia clínica general.
3. Para afirmaciones clínicas, usar lenguaje accesible y apoyarse
   prioritariamente en evidencia clínica o educación institucional verificable.
4. Para preguntas tradicionales, históricas o culturales, responder primero
   desde fuentes primarias y estudios académicos adecuados, conservando sus
   términos y contexto.
5. No insertar una evaluación clínica como corrección automática de cada
   explicación tradicional. Incorporarla cuando la persona pregunte por
   eficacia, diagnóstico, mecanismo moderno o seguridad, o cuando exista un
   riesgo relevante que no deba omitirse.
6. En comparaciones, mantener separados los carriles, mostrar coincidencias y
   diferencias y orientar hacia el debate académico sin fabricar consenso.
7. Reconocer que una experiencia o un concepto pueden ser significativos sin
   que ello valide un mecanismo clínico.
8. No mostrar una fuente como respaldo de la respuesta solo porque QMD la
   recuperó. La cita visible debe corresponder a contenido realmente utilizado.
9. Reconocer con claridad cuándo la memoria o el corpus no contienen
   información suficiente.
10. Responder primero a la intención inmediata y ampliar solo cuando la persona
   lo pida, sin convertir cada recuperación en un resumen completo del corpus.
11. No completar fragmentos parciales con conocimiento interno cuando se trate
    de identidad, taxonomía, hábitat, preparación, eficacia o seguridad.

La formulación breve que debe conservar el system prompt es:

> La memoria es el producto. El RAG es la lente. Las clasificaciones son
> señales de procedencia, no la arquitectura central. La intención decide la
> figura; el contexto puede respirar como fondo sin convertirse en rival.

### 5.4 Fase inmediata: administración mínima del corpus

Para el piloto basta con un corpus pequeño, verificable y relacionado con las
preguntas que se van a probar. Cada documento debe:

- proceder de una fuente identificable;
- enlazar al original o incluir una referencia verificable;
- representar fielmente el contenido fuente;
- indicar su clase y sus limitaciones;
- haber sido revisado por una persona antes de entrar en `/data/kb`;
- poder retirarse del índice si queda obsoleto o se detecta un problema.

La implementación inicial está desarrollada y validada localmente en la rama
de trabajo, donde expone `/admin/corpus`. No estará disponible en
`vitamap.marcomano.org` hasta que los cambios se fusionen en `main` y se
reconstruya el despliegue del VPS. No pretende ser un gestor bibliográfico
completo. Su función es hacer explícita y reproducible la selección que antes
realizaba manualmente el administrador.

El acceso se limita en servidor a usuarios autenticados cuyo correo figure en
la variable `ADMIN_EMAILS`. La comprobación se repite en la página y en cada
acción editorial. El acceso por suscripción o el hecho de conocer la URL no
concede permisos editoriales.

El flujo inmediato será:

```text
administrador propone fuente
  -> registra URL, DOI o PMID y metadatos conocidos
  -> incorpora contenido permitido o una síntesis revisable
  -> guarda borrador fuera de /data/kb
  -> revisa procedencia, clase, fecha, licencia y limitaciones
  -> aprueba
  -> publica Markdown en /data/kb
  -> ejecuta update() y embed()
  -> prueba una consulta y su cita
  -> mantiene o retira la fuente
```

La interfaz inicial permite:

- listar borradores y documentos publicados;
- crear una entrada pegando texto o subiendo un Markdown cuyo frontmatter se
  importa como propuesta de metadatos;
- registrar `source_url`, DOI o PMID sin descargar necesariamente su contenido;
- editar título, fecha, `source_kind`, `source_type` y limitaciones;
- registrar el estado de derechos: `unknown`, `metadata-only`, `permitted` o
  `licensed`;
- aprobar y publicar;
- retirar una entrada y actualizar el índice;
- ejecutar una consulta de prueba y abrir la cita resultante;
- registrar en auditoría quién aprobó o retiró la fuente.

Los estados `unknown` y `metadata-only` pueden conservarse como borrador, pero
no permiten publicar texto en el RAG. La publicación exige `permitted` o
`licensed`. Esta restricción evita que registrar una referencia se confunda con
tener derecho a incorporar su contenido.

Los borradores no deben vivir en `/data/kb`, porque QMD indexa todo Markdown de
ese árbol. Pueden almacenarse inicialmente en `/data/kb-inbox/` o en una tabla
administrativa. Solo la acción explícita de aprobar crea o mueve el documento
publicado a `/data/kb`.

Para esta fase no se requiere una taxonomía multidimensional, conectores
automáticos ni un sistema editorial complejo. Sí se requiere que el estado de
la fuente sea visible y que nada llegue al RAG por el simple hecho de haber
introducido una URL.

Antes de invitar a terceros debe comprobarse:

- que la memoria personal se recupera de extremo a extremo;
- que ninguna memoria cruza entre usuarios;
- que las citas visibles corresponden a fuentes realmente usadas;
- que las preguntas sin respaldo reciben una respuesta de insuficiencia;
- que el pequeño corpus externo cubre las consultas de contraste incluidas en
  las pruebas del piloto;
- que una fuente puede retirarse y desaparecer del índice.

### 5.5 Tratamiento de URLs y fuentes externas

`source_url` es procedencia, no contenido. El chat no visita esa URL durante
una conversación. Solo consulta Markdown local previamente revisado y
publicado.

Esto mantiene las respuestas:

- reproducibles aunque una página cambie o desaparezca;
- protegidas frente a contenido remoto malicioso o instrucciones incrustadas;
- independientes de fallos de red;
- limitadas a material cuya incorporación fue aprobada;
- auditables mediante la versión local utilizada.

En la fase inmediata, introducir una URL puede limitarse a guardar el enlace y
los metadatos que el administrador verifique. El contenido se pega o se carga
manualmente. Una descarga desde el servidor solo debe añadirse cuando exista un
conector específico que controle formato, tamaño, redirecciones, SSRF,
licencia y procedencia.

Las fuentes citadas en la visión de producto requieren tratamientos distintos:

- **NICE**: dispone de mecanismos de sindicación, pero su contenido no debe
  incorporarse para uso internacional o con IA sin revisar y obtener la
  licencia o autorización aplicable. Hasta entonces, VitaMap puede conservar
  metadatos y enlace, no una copia sustancial en el RAG.
- **ESC**: sus guías no deben reproducirse ni traducirse sin el permiso
  correspondiente. Sin permiso, se conserva la referencia y el enlace; no se
  indexa el texto de la guía como contenido propio.
- **PubMed**: NCBI E-utilities permite consultar metadatos por PMID y realizar
  búsquedas. Eso no convierte automáticamente el abstract o el artículo en
  contenido reutilizable.
- **PMC Open Access Subset**: puede proporcionar texto completo mediante APIs
  oficiales, pero debe verificarse la licencia concreta de cada artículo y si
  permite el tipo de uso de VitaMap.

Una síntesis generada con ayuda de IA no se convierte por ello en una fuente.
Debe revisarse contra el original, atribuirse como síntesis editorial de
VitaMap y conservar la referencia utilizada.

### 5.6 Evolución posterior

Cuando el flujo manual esté probado, la interfaz puede evolucionar por etapas:

1. **Metadatos asistidos**: resolver DOI o PMID mediante APIs oficiales y
   completar título, autores, fecha, publicación y enlace.
2. **Importadores autorizados**: obtener contenido solo desde APIs o formatos
   permitidos, registrar licencia y generar un borrador fuera del índice.
3. **Versionado**: checksum, relación entre versiones, fecha de revisión y
   retirada trazable.
4. **Seguimiento de fuentes**: comprobar periódicamente cambios, nuevas
   versiones o enlaces rotos y crear una tarea de revisión.
5. **Curación colaborativa**: varios curadores, doble revisión para fuentes de
   alto impacto y permisos administrativos diferenciados.
6. **Gobernanza ampliada**: clasificación multidimensional y panel editorial
   completo cuando el volumen lo justifique.

Los procesos automáticos pueden descubrir cambios y preparar borradores, pero
nunca publican directamente en `/data/kb`. La aprobación humana continúa
siendo la frontera entre Internet y el RAG.

> **Comentario de evolución futura.** Esta evolución no debe convertir ahora
> el proyecto en la administración de un corpus universal. Sus disparadores
> deben ser necesidades observadas de escala, seguridad o trazabilidad, no
> anticipación arquitectónica.

## 6. Lecciones de la primera prueba integral

### 6.1 Dependencias nativas dinámicas

`sqlite-vec` selecciona el paquete nativo según la plataforma. Next.js no
detectó automáticamente el import dinámico y omitió
`sqlite-vec-linux-x64` del bundle standalone.

Consecuencia:

- la extracción terminó;
- el markdown llegó a escribirse;
- la indexación falló al cargar la extensión vectorial.

La imagen Docker ahora copia explícitamente la extensión Linux y comprueba
durante el build que puede resolverse.

Lección: un build de Next exitoso no prueba por sí solo que las extensiones
nativas dinámicas estén en el runtime.

### 6.2 Una escritura y su índice no forman una transacción única

El markdown y el índice QMD viven en sistemas diferentes. Es posible escribir
el documento y fallar después durante la indexación.

La escritura de analíticas ahora elimina el markdown parcial si la indexación
falla, y el inbox se conserva hasta completar todo el proceso.

Lección: toda operación de memoria necesita una estrategia explícita de
reintento, rollback o reconstrucción.

### 6.3 El contrato SDK debe probarse, no suponerse

VitaMap declaró inicialmente una interfaz manual con un campo `snippet`.
TypeScript la aceptó porque el resultado real se convirtió a ese tipo de forma
forzada. QMD encontraba correctamente la analítica, pero el prompt recibía una
fuente vacía.

Lección: no se deben duplicar manualmente los tipos públicos de QMD. Deben
usarse `QMDStore`, `HybridQueryResult` y los demás tipos exportados.

### 6.4 Encontrar una fuente no garantiza que el LLM la use

La interfaz mostró una tarjeta de fuente mientras el modelo afirmaba no tener
los valores. La tarjeta probaba que hubo recuperación, pero no que el fragmento
llegó al prompt.

Lección: la prueba integral debe verificar la cadena completa:

```text
markdown
  -> update
  -> embed
  -> search
  -> bestChunk
  -> prompt
  -> respuesta
  -> cita abrible
```

El guardrail recibe también los fragmentos recuperados para detectar
afirmaciones factuales no respaldadas o contradictorias. Esta comprobación no
sustituye el trabajo pendiente de relacionar cada afirmación y cita con una
fuente realmente utilizada.

### 6.5 Rendimiento del store

QMD crea una instancia local de `LlamaCpp` por store. VitaMap abre actualmente
un store personal y otro de KB para cada pregunta, y los cierra al terminar.
Cerrar el store libera el modelo y la conexión SQLite.

Este patrón es correcto funcionalmente, pero produce arranques fríos repetidos.
La propia documentación de QMD recomienda un proceso persistente cuando se
quiere conservar los modelos cargados entre consultas.

Lección: el ciclo de vida del store es una decisión de rendimiento, no un
detalle de implementación.

## 7. Riesgos actuales

### P0. Prueba integral insuficiente

La prueba existente valida el adaptador con un objeto simulado. Todavía falta
una prueba que:

1. cree un directorio temporal;
2. escriba la analítica sintética como markdown;
3. cree un store QMD real;
4. ejecute `update()` y `embed()`;
5. haga una consulta;
6. compruebe que `bestChunk` contiene los valores esperados;
7. compruebe que la ruta abre el documento correcto;
8. compruebe que otro usuario no puede recuperar ese contenido.

Esta prueba es obligatoria antes de invitar a otros usuarios.

### P0. Escrituras concurrentes

Dos operaciones del mismo usuario pueden intentar ejecutar simultáneamente:

```text
update()
embed()
```

SQLite usa WAL, pero el trabajo de embeddings y la actualización del índice no
deben depender solo del bloqueo de SQLite. Debe existir una cola o mutex por
`dbPath`.

Para el piloto basta una serialización en proceso:

```text
index.sqlite A -> una operación de escritura a la vez
index.sqlite B -> puede trabajar en paralelo con A
kb-index.sqlite -> una operación de mantenimiento a la vez
```

### P0. Umbral de puntuación incorrecto para el perfil sin reranking

Con `rerank: false`, QMD 2.5.3 devuelve una puntuación posicional basada en el
ranking RRF. Aplicar `minScore: 0.3` después de esa transformación deja pasar,
en la práctica, aproximadamente los tres primeros resultados aunque se pida
un límite de cinco.

El perfil CPU debe usar:

- `limit` como control principal;
- un umbral calibrado mediante evaluación, o ningún umbral inicial;
- métricas separadas para personal y evidencia.

No se debe interpretar `0.3` como una probabilidad de relevancia.

### P1. Ciclo de vida efímero

Abrir y cerrar dos stores por pregunta es seguro para la memoria, pero caro.

Antes de cambiarlo se medirá:

- tiempo de creación del store;
- tiempo hasta el primer embedding de consulta;
- memoria RSS antes y después;
- latencia fría y caliente;
- coste de mantener abiertos KB y uno o más stores personales.

No se mantendrán todos los stores de todos los usuarios abiertos sin un límite.

### P1. Estado global de configuración del SDK

QMD 2.5.3 usa una fuente de configuración global en el proceso para operaciones
de colección y contexto. VitaMap crea stores con configuración inline.

Las búsquedas y actualizaciones normales leen las colecciones sincronizadas en
cada SQLite, pero una evolución hacia stores persistentes debe evitar depender
de configuraciones inline globales abiertas simultáneamente.

Patrón previsto:

1. inicializar o migrar cada índice de forma serial con configuración;
2. cerrar el store de inicialización;
3. reabrir el índice en modo DB-only con `createStore({ dbPath })`;
4. no mutar colecciones o contextos desde peticiones web concurrentes.

### P1. Salud no observable

`/api/health` solo comprueba que Next.js responde. No detecta:

- ausencia de `sqlite-vec`;
- embeddings pendientes;
- huellas de embeddings mezcladas;
- índice dañado;
- modelo de embeddings distinto al esperado.

Debe existir un diagnóstico administrativo autenticado o ejecutable desde el
contenedor. No se expondrán rutas de usuarios ni contenido médico en el
healthcheck público.

### P1. Versionado demasiado abierto

`^2.0.1` permite instalar una versión menor nueva cuando cambie el lockfile.
Para una dependencia joven, nativa y crítica, el piloto debe fijar una versión
exacta.

Cada actualización requiere:

- leer changelog;
- revisar cambios del contrato SDK;
- crear backup;
- construir la imagen Linux;
- ejecutar pruebas integrales;
- comprobar `getIndexHealth()`;
- ejecutar `update()`;
- forzar `embed()` si cambia el modelo o su fingerprint;
- probar rollback.

## 8. Evolución por etapas

### Etapa Q0. Prueba sintética inicial

Estado: completada con incidencias.

Alcance:

- un usuario;
- una analítica sintética;
- store personal separado;
- KB compartida;
- embeddings multilingües;
- búsqueda BM25 + vector sin reranking;
- recuperación manual del índice comprobada.

Resultado:

- QMD es viable para VitaMap;
- la integración todavía necesita endurecimiento;
- no se considera validado el piloto con datos reales de terceros.

### Etapa Q1. Endurecimiento previo al piloto real

Debe completarse antes de invitar a los otros dos usuarios.

Trabajo requerido:

1. prueba integral real con QMD y la analítica sintética;
2. prueba negativa de aislamiento entre dos usuarios sintéticos;
3. serialización de `update()` y `embed()` por índice;
4. corrección o eliminación de `minScore` en el perfil CPU;
5. versión exacta de QMD;
6. comando administrativo de salud de índices;
7. `QMD_FORCE_CPU=1` en el VPS para evitar sondeos de GPU innecesarios;
8. registro de latencia de recuperación sin guardar la consulta;
9. procedimiento documentado de reconstrucción y rollback.

Criterio de salida:

- diez consultas sintéticas consecutivas recuperan la fuente esperada;
- ninguna fuente personal cruza entre usuarios;
- una escritura interrumpida puede reintentarse;
- el índice se reconstruye desde markdown;
- no existen errores nativos en logs;
- la mediana de recuperación es conocida y aceptada.

### Etapa Q2. Piloto de tres usuarios

Objetivo: observar comportamiento real con baja concurrencia.

Configuración inicial:

- QMD embebido en `web`;
- un SQLite por usuario;
- KB SQLite compartida;
- perfil CPU sin expansión ni reranking;
- escrituras serializadas;
- stores efímeros mientras se obtienen métricas.

Métricas mínimas:

- latencia fría y caliente;
- tiempo de `update()` y `embed()`;
- memoria máxima del contenedor;
- porcentaje de consultas sin resultados;
- porcentaje de respuestas con fuente personal;
- porcentaje de citas que abren el documento correcto;
- falsos positivos y falsos negativos de recuperación;
- número de reconstrucciones necesarias.

Después de una semana se decide si implementar stores persistentes.

### Etapa Q3. Stores administrados en proceso

Disparador:

- el arranque frío domina la latencia;
- la memoria permite mantener modelos cargados;
- las pruebas de concurrencia son estables.

Diseño previsto:

- singleton para KB;
- caché LRU limitada para stores personales;
- máximo de uno o dos stores personales calientes en el VPS actual;
- cierre por inactividad;
- mutex por `dbPath`;
- inicialización de configuración serial y reapertura DB-only;
- cierre ordenado al terminar el proceso.

No se implementará una caché ilimitada. Cada store tiene recursos SQLite y
una instancia QMD de LlamaCpp.

### Etapa Q4. QMD como servicio persistente

Disparador:

- más de 9 a 12 usuarios activos;
- varios procesos web;
- necesidad de desacoplar recuperación y despliegue;
- memoria duplicada por worker;
- necesidad de observabilidad propia.

Opciones a evaluar:

1. proceso QMD HTTP/MCP por índice o grupo controlado;
2. servicio interno propio que envuelva el SDK;
3. mantener SDK embebido si las métricas siguen siendo mejores.

No se colocarán todos los usuarios en una sola colección compartida solo para
reducir modelos. La separación física de índices es una propiedad de seguridad
que no debe sacrificarse por rendimiento.

### Etapa Q5. GPU y reranking

Disparador:

- VPS con GPU;
- KB suficientemente grande;
- benchmark que demuestre mejora de calidad.

Se reevaluará:

- expansión de consultas;
- Qwen3-Reranker;
- `intent`;
- mayor `candidateLimit`;
- búsqueda completa de QMD.

El reranking no se activará porque esté disponible, sino porque mejore métricas
de recuperación en el corpus de VitaMap.

## 9. Evaluación de calidad

Debe existir un conjunto versionado de preguntas sintéticas, sin datos reales.

Categorías:

### Coincidencia literal

```text
¿Cuál fue mi valor de vitamina D?
```

### Comparación con rango

```text
¿Qué valores aparecen fuera del rango de referencia?
```

### Sinónimo o paráfrasis

```text
¿Había indicios de azúcar en ayunas elevada?
```

### Temporal

```text
¿Qué analítica es la más reciente?
```

### Ausencia de información

```text
¿Cuál es mi grupo sanguíneo?
```

La respuesta correcta debe reconocer que no existe ese dato.

### Aislamiento

Un usuario B pregunta por un marcador que solo existe en la memoria del
usuario A. El resultado personal debe ser vacío.

Métricas:

- recall@5;
- precision@5;
- MRR;
- exactitud de la cita;
- fidelidad factual de la respuesta;
- tasa de "no encontrado" correcta;
- latencia p50 y p95.

QMD incluye herramientas de benchmark, pero VitaMap necesita además una prueba
de extremo a extremo que incluya la construcción del prompt y la cita visible.

## 10. Salud y mantenimiento

### Comprobación periódica

Una tarea administrativa debe informar, sin imprimir contenido:

- identificador técnico del usuario;
- número de documentos;
- documentos pendientes de embedding;
- existencia del índice vectorial;
- colecciones configuradas;
- modelo y fingerprint activos;
- fingerprints mezclados;
- resultado general.

### Reconstrucción

Procedimiento conceptual:

1. confirmar backup;
2. detener escrituras;
3. conservar el índice anterior para rollback;
4. crear un índice nuevo desde markdown;
5. ejecutar `update()`;
6. ejecutar `embed({ force: true })` cuando corresponda;
7. ejecutar el benchmark sintético;
8. sustituir el índice;
9. reanudar escrituras.

En el piloto actual, el script `memory:reindex` puede reparar embeddings
pendientes sin eliminar el índice.

### Backup

Los índices QMD se incluyen en el backup por rapidez de restauración, pero se
consideran reconstruibles.

Los elementos irremplazables son:

- markdown de memoria;
- documentos originales cifrados;
- base de autenticación, consentimiento, billing y auditoría;
- configuración y claves custodiadas por separado.

## 11. Privacidad y seguridad

QMD funciona localmente, pero sus índices contienen representaciones derivadas
de datos médicos.

Por ello:

- `index.sqlite` se trata como dato de salud;
- se incluye en las reglas de acceso y borrado del usuario;
- no se copia a entornos de desarrollo;
- no se adjunta a incidencias;
- no se registra el texto de consultas o fragmentos en logs;
- se cifra mediante la protección del volumen y del backup;
- se elimina junto con el directorio del usuario.

Los modelos GGUF de la caché no contienen datos personales. Los índices, las
cachés de resultados y cualquier fichero temporal sí pueden contenerlos.

## 12. Criterios para sustituir QMD

QMD no debe mantenerse por inercia. Se evaluará otra tecnología si ocurre
alguno de estos casos:

- corrupción repetida de índices pese a uso correcto;
- aislamiento por usuario incompatible con el rendimiento necesario;
- tiempos de indexación inaceptables con el volumen real;
- falta de control sobre filtros necesarios;
- contrato SDK demasiado inestable para mantener pruebas fiables;
- necesidad de consultas estructuradas que markdown y QMD no pueden resolver;
- imposibilidad de operar con varios procesos web sin duplicación excesiva.

La sustitución del índice no debe exigir migrar la fuente de verdad. Markdown
permanece como formato portable.

## 13. Próximo orden de trabajo

Implementado y validado localmente, pendiente de despliegue:

- control de acceso administrativo mediante `ADMIN_EMAILS`;
- borradores en `/data/kb-inbox`, fuera del índice;
- creación, edición, publicación, retirada y auditoría;
- consulta de prueba limitada al corpus compartido.

Orden recomendado para lo pendiente:

1. desplegar y confirmar la corrección de `bestChunk`;
2. crear la prueba integral QMD real;
3. eliminar o recalibrar `minScore`;
4. serializar indexaciones por `dbPath`;
5. añadir diagnóstico administrativo de índices;
6. fijar `@tobilu/qmd` a versión exacta;
7. medir latencia y memoria con stores efímeros;
8. decidir si implementar una caché LRU de stores;
9. comprobar preguntas de seguimiento y definir cómo incorporar contexto
   conversacional a la recuperación;
10. preparar y validar un corpus externo pequeño para las consultas concretas
    del piloto;
11. mostrar en las citas la clase mínima de procedencia y solo las fuentes
    realmente utilizadas;
12. evaluar recuperación selectiva por intención en lugar de consultar siempre
    todos los carriles;
13. repetir la prueba durante varios días con datos sintéticos;
14. solo entonces invitar a los otros dos participantes.

## 14. Referencias

- Repositorio QMD: https://github.com/tobi/qmd
- SDK QMD: https://github.com/tobi/qmd#sdk--library-usage
- Changelog QMD: https://github.com/tobi/qmd/blob/main/CHANGELOG.md
- Reutilización de contenido NICE: https://www.nice.org.uk/re-using-our-content
- Copyright de guías ESC: https://www.escardio.org/guidelines/clinical-practice-guidelines/ESC-Guidelines-Copyright/
- APIs oficiales NCBI: https://www.ncbi.nlm.nih.gov/home/develop/api/
- PMC Open Access Subset: https://pmc.ncbi.nlm.nih.gov/tools/openftlist
- Decisiones VitaMap: `docs/DECISIONS.md`
- Roadmap VitaMap: `docs/ROADMAP.md`
- Guía operativa: `docs/PILOTO-FASE1-GUIA-OPERATIVA.txt`
