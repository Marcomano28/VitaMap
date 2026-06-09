# VitaMap — Roadmap de piloto de bajo presupuesto (revisión con QMD)

Documento de ruta para iniciar el piloto sin romper la arquitectura objetivo (self-hosted, GDPR, RAG dual personal+científico, guardrails anti-diagnóstico). Esta revisión integra **`tobi/qmd`** como motor RAG central, lo cual elimina Postgres del MVP y simplifica drásticamente el piloto inicial. Cada fase usa el mismo código y el mismo modelo de datos en disco; solo cambian el tamaño del modelo LLM, el hosting y la presencia o no de capas estructuradas adicionales.

> La configuración operativa y la evolución vigente de QMD se definen en
> `docs/QMD-EVOLUCION-VITAMAP.md`. Ese documento prevalece sobre los ejemplos
> históricos de este roadmap cuando exista una diferencia.

---

## Principio rector — qué NO cambia entre fases

Estas piezas se fijan desde la Fase 0 para que escalar sea solo un cambio de infra:

- **Memoria como markdown**: cada observación, lab, assessment o nota del voluntario es un fichero `.md` con frontmatter YAML. Esto es portable, inspeccionable por el propio usuario, exportable como ZIP y trivialmente borrable. Es la unidad atómica de la QMD Memory.
- **Aislamiento por usuario en sistema de ficheros**: `/data/users/<user_id>/memory/` + `/data/users/<user_id>/index.sqlite` (índice QMD propio). Borrar un voluntario es `rm -rf` del directorio. GDPR right-to-erasure resuelto a nivel filesystem.
- **RAG dual con QMD**: dos índices QMD separados, uno por usuario (memoria personal) y uno compartido (`/data/kb/` con índice `/data/kb-index.sqlite` para literatura científica). Las dos queries se lanzan en paralelo desde la API route, los resultados se envuelven con `<source type="personal">` o `<source type="evidence" level="...">` antes de pasarlos al LLM.
- **Interfaz del LLM principal**: protocolo OpenAI-compatible. `llama.cpp server` lo expone; vLLM lo expone. Cambiar de modelo es cambiar `LLM_BASE_URL` y `LLM_MODEL` en `.env`.
- **Modelo de embeddings multilingüe desde el día uno**: `QMD_EMBED_MODEL=hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf`. El default de QMD (embeddinggemma-300M) está optimizado para inglés y degrada en español. Fijar Qwen3-Embedding desde el inicio evita reindexar todo después.
- **Guardrails**: segunda pasada del LLM que clasifica lenguaje diagnóstico. Código idéntico en todas las fases.
- **Audit log con hash chain**: tabla append-only en SQLite (BetterAuth ya monta SQLite). Cada `INSERT/SELECT/DELETE` sobre la memoria deja traza encadenada por hash al evento previo.
- **Cifrado**: pgcrypto NO aplica (no hay Postgres en Fase 0/1). En su lugar: LUKS a nivel disco en el VPS + cifrado age para los PDFs originales antes de escribir + variables sensibles en `.env` con master key rotable.
- **BetterAuth sobre SQLite**: idéntico en todas las fases.
- **Disclaimer educativo**: se inyecta a nivel UI siempre, en cada respuesta. Nunca se confía al LLM.

Lo que SÍ cambia entre fases: tamaño del modelo LLM principal, host (CPU/GPU), volumen de KB, OCR activado o no, y a partir de Fase 2 opcionalmente la reintroducción de Postgres para análisis estructurado longitudinal.

---

## Perspectiva de diseño — Memoria conversacional y consentimiento diferido

### El problema que esta perspectiva resuelve

Los formularios estructurados (PHQ-9, GAD-7, entrada de analíticas) capturan datos cuando el usuario está en modo _declarativo_: sabe qué quiere registrar, lo redacta y lo envía. Pero hay otro modo de acceso a la propia salud que los formularios no alcanzan: el modo _narrativo_, en el que el usuario simplemente habla —sobre cómo se siente, qué le ocurrió, qué le preocupa— sin ninguna intención explícita de crear un registro.

Ese modo narrativo es frecuente y clínicamente valioso. Aparece cuando alguien lleva días con baja energía y todavía no lo ha relacionado con nada concreto, cuando describe el contexto emocional de un síntoma físico, o cuando necesita ser escuchado —o escucharse a sí mismo— antes de poder formular una pregunta. Psicológicamente, el acto de narrar cumple una función reguladora por sí mismo, independientemente de que genere datos. Ignorar esa función, o interrumpirla con formularios, erosionaría la confianza del usuario en la plataforma como espacio seguro.

El reto es doble: respetar la naturaleza fluida de esa conversación mientras se preserva la posibilidad de extraer, con consentimiento explícito y posterior a la conversación, los datos clínicamente relevantes que contenga.

### El flujo de consentimiento diferido

La clave conceptual es separar el momento de la conversación del momento del registro. El usuario habla con libertad; solo cuando la conversación ha terminado —o ha llegado a un punto de cierre natural— el sistema propone, sin automatizar, convertir parte de esa conversación en memoria estructurada.

```
conversación libre (sin formulario, sin estructura impuesta)
        ↓
  el modelo detecta señales de cierre o el usuario las activa
        ↓
  [extracción LLM]  →  borrador .md con frontmatter  (status: draft, no indexado aún)
        ↓
  preguntas complementarias del modelo  →  el usuario las responde o las omite
        ↓
  reporte presentado en pantalla para revisión: el usuario edita, elimina fragmentos, o rechaza
        ↓
  [aprobación explícita del usuario]
        ↓
  audit_event "memory.write"  →  store.update()  →  memory/conversations/<fecha>-session.md
```

Este flujo tiene tres propiedades críticas para el encuadre GDPR y para la confianza del usuario:

1. **Nada se escribe sin aprobación activa.** El borrador existe solo en memoria de sesión hasta que el usuario pulsa aprobar. Si cierra la ventana o rechaza, no queda rastro más allá del audit log de la sesión (que registra que hubo una conversación, no su contenido).
2. **El usuario es el editor final.** El borrador se presenta como un documento editable, no como un informe generado. El modelo propone; el usuario decide qué parte de su narrativa merece vivir como dato.
3. **El consentimiento queda trazado.** El evento `memory.write` en `audit_event` incluye `extraction_source: conversation`, `approved_at`, y `user_edited: boolean` (si el usuario modificó el borrador antes de aprobar). Esto acredita el Art. 9.2.a RGPD para datos de salud generados por conversación.

### Qué extrae el modelo y qué no

El prompt de extracción distingue explícitamente entre dos tipos de contenido:

- **Extraíble**: síntomas con contexto temporal ("llevo tres días con dolor de cabeza vespertino"), estados emocionales con patrón ("cuando trabajo más de diez horas seguidas noto ansiedad"), cambios de hábito percibidos, preguntas que el usuario quiere retener para una consulta futura, correlaciones que el propio usuario menciona.
- **No extraíble**: desahogos sin señal clínica, relatos sobre terceras personas, contenido que el usuario ha marcado explícitamente como privado durante la conversación ("esto no lo quiero guardar"), y cualquier fragmento cuya extracción cosifique la experiencia sin añadir valor clínico.

El borrador incluye solo el primer tipo. La distinción no es delegable al criterio del modelo en producción: está fijada en el prompt de sistema del paso de extracción, que se revisa con cada cambio de modelo LLM.

### El guardrail específico para contenido de crisis

El guardrail diagnóstico genérico que corre en todas las respuestas del chat **no es suficiente aquí**. Una conversación narrativa larga puede contener señales de crisis (ideación suicida, riesgo de daño) expresadas de forma indirecta, sin el vocabulario clínico que detecta el clasificador estándar.

Se añade un segundo clasificador, ejecutado sobre la conversación completa antes de iniciar la extracción, con un prompt específico para detección de crisis según criterios Columbia (C-SSRS simplificado). Si el clasificador devuelve `crisis: true`, el flujo de extracción **no se activa**. En su lugar, la UI muestra un aviso fijo con recursos de ayuda (Teléfono de la Esperanza, línea de crisis local según país del usuario configurado en perfil). El aviso se registra en audit log como `safety.crisis_detected` sin guardar el contenido de la conversación.

Este clasificador corre sobre el mismo LLM local en una llamada adicional. Su prompt es conservador: ante la duda clasifica como crisis. Los falsos positivos (mostrar el aviso de recursos sin que haya crisis real) son aceptables y preferibles al inverso.

### Implementación por fases

**Fase 0** — Diseñar y probar el prompt de extracción con conversaciones propias. Validar que Qwen3-4B distingue correctamente entre contenido extraíble y no extraíble, y que el clasificador de crisis no genera falsos negativos en casos test conocidos. No se implementa UI todavía: el borrador se vuelca a consola o a un fichero temporal para revisión manual.

**Fase 1** — UI mínima del flujo completo: botón "revisar esta conversación" en el chat, visor del borrador editable (campo de texto con el markdown generado), botón aprobar/rechazar, y escritura en `memory/conversations/` con el evento en audit log. El clasificador de crisis activo en todas las sesiones de chat. Las preguntas complementarias del modelo se implementan como un segundo turno del chat antes de generar el borrador.

**Fase 2** — Refinamiento: detección automática de señales de cierre conversacional (en lugar de botón manual), sugerencia proactiva de extracción cuando el modelo detecta densidad clínica alta en la conversación, y primer análisis longitudinal de patrones extraídos por conversación frente a patrones de formularios estructurados (¿coinciden? ¿el modo narrativo captura algo que los formularios pierden?).

### Nota sobre el modelo de datos

El fichero resultante sigue siendo un markdown con frontmatter YAML, coherente con el principio rector de "memoria como markdown". El tipo de entrada es `conversation` (junto a los ya existentes `observation`, `lab`, `assessment`, `note`). El frontmatter incluye los campos añadidos para este flujo:

```yaml
---
type: conversation
date: 2026-06-04
status: approved          # draft → approved (nunca se indexa en status draft)
extraction_source: conversation
session_duration_min: 18  # duración aproximada de la sesión
user_edited: true         # el usuario modificó el borrador antes de aprobar
approved_at: 2026-06-04T19:43:00Z
tags: [energia, sueño, ansiedad]
---
```

El campo `status: draft` actúa como cerrojo: `store.update()` filtra entradas con `status != approved`, así que un borrador nunca llega al índice QMD aunque el fichero exista en disco. Esto elimina la posibilidad de que un borrador no aprobado influya en respuestas futuras del RAG.

---

## Perspectiva de diseño — Guía de orientación para el usuario real

### El problema

VitaMap asume implícitamente un usuario que sabe qué documentos tiene, dónde están, y cómo conseguirlos. En la práctica, la mayoría de personas nunca ha pensado en esos términos. Saben que "van al médico" y que "les hacen analíticas", pero no saben que esos datos existen en formato digital, que tienen derecho a pedirlos, ni qué hacer con ellos una vez los tienen.

Sin una guía clara dentro de la propia app, el voluntario llega a la pantalla de subida de documentos y no sabe qué subir, qué buscar, ni cómo empezar. El resultado es que la plataforma queda vacía de datos reales y el asistente no puede ser útil.

### Qué debe contener esta guía

No es un manual técnico ni un texto legal. Es una respuesta a la pregunta que cualquier usuario nuevo se hace: **¿por dónde empiezo?**

El contenido mínimo, en lenguaje llano:

**Bloque 1 — Qué documentos son útiles**
Una lista concreta y reconocible para cualquier persona:
- Analíticas de sangre u orina (las que te da el laboratorio o el médico)
- Informes de consultas o ingresos hospitalarios
- Historial de medicación actual o pasada
- Resultados de pruebas de imagen (resonancias, ecografías — el informe escrito, no la imagen)
- Vacunas
- Cualquier informe de especialista que tengas en papel o PDF

**Bloque 2 — Cómo conseguir los que no tienes a mano**
- Tu médico de cabecera puede darte un resumen de tu historial si lo pides
- Tu hospital puede enviarte el informe de cualquier ingreso pasado (tienes derecho a pedirlo)
- Si tienes seguro público en Alemania: tu aseguradora tiene una app donde puedes descargar todo tu historial digital en unos pocos pasos — se explica con capturas o un texto paso a paso
- Si tienes seguro privado: contacta directamente con tu aseguradora

**Bloque 3 — Qué hace VitaMap con esos documentos**
Una explicación breve y honesta: el documento se guarda cifrado en tu dispositivo (o en el servidor solo tuyo), nunca sale a ningún servicio externo, y tú puedes borrarlo cuando quieras. El asistente lo lee para responder mejor a tus preguntas, pero no lo comparte ni lo analiza fuera de tu sesión.

**Bloque 4 — Qué no necesitas hacer**
Desmentir malentendidos frecuentes: no hace falta digitalizar todos los documentos de golpe, no hace falta que sean perfectos ni completos, no hace falta entender los valores médicos para subirlos (el asistente los explica), y no hace falta ningún conocimiento técnico.

### Dónde vive en la app

Una ruta dedicada `/guide` o `/empezar`, accesible desde la navegación principal con un nombre simple como "Cómo empezar" o "Primera vez aquí". No es un modal ni un tooltip: es una página completa, tranquila, que el usuario puede leer a su ritmo y releer cuando quiera.

La pantalla de subida de documentos (`/upload`) debería tener un enlace visible a esta guía, especialmente cuando el buzón está vacío.

### Cuándo construirlo

**Antes de admitir el primer voluntario real** (requisito previo a Fase 1, no opcional). Un voluntario que llega sin orientación y no sabe qué hacer en los primeros cinco minutos no vuelve. La guía es tan importante para la retención del piloto como cualquier funcionalidad técnica.

El contenido puede escribirse antes de que la página exista — de hecho conviene redactarlo con los primeros voluntarios candidatos antes de programar nada, para asegurarse de que responde a sus dudas reales y no a las que imaginas que tendrán.

---

## Fase 0 — Desarrollo local · **0 €/mes** · semanas 1-3

Objetivo: arquitectura completa funcionando end-to-end en tu portátil con QMD como pieza central, antes de pagar nada.

**Infra**: Docker Compose o `bun dev` en local. Tres procesos: Next.js, `llama.cpp server` (Qwen3-4B Q4), y QMD embebido como librería dentro de Next.js (no requiere proceso aparte). Si necesitas exposición externa para 1-2 testers de confianza, Cloudflare Tunnel o Tailscale Funnel gratis.

**RAG**: `@tobilu/qmd` instalado vía `npm install @tobilu/qmd`. Dos stores creados por la API route con `createStore({ dbPath: ... })`: uno para el usuario activo (`/data/users/<id>/index.sqlite`) y uno compartido para KB (`/data/kb-index.sqlite`). Las búsquedas usan `store.search({ query, rerank: true })` que ya hace BM25 + vector + reranking internamente.

**LLM principal**: Qwen3-4B-Instruct Q4_K_M en Ollama o llama.cpp server, endpoint OpenAI-compatible en `localhost:8080/v1`.

**Modelos auxiliares de QMD** (se descargan solos en primera ejecución a `~/.cache/qmd/models/`):
- `Qwen3-Embedding-0.6B-Q8_0.gguf` para embeddings (forzado vía `QMD_EMBED_MODEL`, multilingüe).
- `qwen3-reranker-0.6b-q8_0.gguf` para reranking.
- `qmd-query-expansion-1.7B-q4_k_m.gguf` para expansión de query (fine-tuned por tobi).

**Auth + audit**: BetterAuth con adapter `better-sqlite3` apuntando a `./data/auth.sqlite`. Tabla `audit_event` en la misma BD con `prev_hash`, `event_hash`, `actor`, `action`, `subject_id`, `payload_summary`, `ts`.

**KB científica**: arranca con 30-50 documentos markdown curados a mano en `/data/kb/` (guidelines NICE/ESC clave, abstracts PubMed que ya conozcas, ontologías TCM básicas). Cada documento con frontmatter YAML incluyendo `evidence_level` (GRADE A/B/C/D o Cochrane equivalente) y `source_url`. Tras añadir documentos: `qmd embed` para indexar.

**OCR**: **desactivado**. El voluntario introduce valores de analíticas en un formulario que genera markdown estructurado. La fricción manual valida si OCR es realmente necesario antes de invertir en pipeline.

**Datos**: datos sinteticos, documentos ficticios y, de forma estrictamente
privada, tu propia memoria. No se incorporan datos de salud de terceros en esta
fase: que la persona sea de confianza o que el sitio no sea publico no elimina
las obligaciones del piloto real.

**Lo que validas en esta fase**:
- Que el RAG dual de QMD cita correctamente cada fuente con su `evidence_level`.
- Que los guardrails bloquean lenguaje diagnóstico fiable.
- Que el formato Socrático no se siente condescendiente.
- Que Qwen3-4B basta para razonamiento clínico básico o necesitas saltar antes a 14B.
- Que QMD escala bien con tu volumen real de markdown.
- Que el flujo "formulario → markdown → indexación QMD → consulta" tiene latencia aceptable.

---

## Fase 1 — Piloto de 3 usuarios en VPS mínimo · **~12-18 €/mes** · meses 2-4

Objetivo: 3 voluntarios reales con consentimiento informado y DPIA firmada, ejecutándose en producción con la arquitectura definitiva en miniatura.

**Hosting**: Hetzner **CX31** (4 vCPU compartidas, 8 GB RAM, 80 GB NVMe) ~7 €/mes, o **CCX13** (2 vCPU dedicadas AMD EPYC, 8 GB RAM) ~13 €/mes. Recomiendo CCX13: las vCPU dedicadas hacen la inferencia LLM mucho más predecible. Región Falkenstein o Helsinki (EU, GDPR-friendly).

**Backups offsite**: Backblaze B2 bucket en EU, primeros 10 GB gratis. Script `restic` o `rclone` que cifra antes de subir. Snapshot diario de `/data/` (incluye `users/<id>/index.sqlite` de cada usuario, los markdown, los PDFs cifrados y la KB).

**Dominio + DNS**: Cloudflare gratis. Dominio ~10 €/año.

**Estructura en disco del VPS**:

```
/data/
  auth.sqlite                  # BetterAuth + audit_event
  users/
    <user_id_1>/
      memory/
        observations/2026-06-01-symptoms.md
        labs/2026-05-15-bloodwork.md
        assessments/phq9-2026-05-30.md
        notes/tcm-2026-05-12.md
      documents/               # PDFs originales cifrados con age
        2026-05-15-bloodwork.pdf.age
      index.sqlite             # índice QMD propio del usuario
    <user_id_2>/...
    <user_id_3>/...
  kb/
    guidelines/
      nice-cholesterol-2025.md
      esc-cardiology-2025.md
    pubmed/abstracts/...
    tcm/...
    ayurveda/...
  kb-index.sqlite              # índice QMD compartido
```

**Procesos en el VPS** (Docker Compose):
- `caddy` — reverse proxy + Let's Encrypt automático.
- `web` — Next.js 15 con `@tobilu/qmd` como librería embebida. Sirve UI y API.
- `llm` — `llama.cpp server` con Qwen3-4B Q4_K_M, endpoint OpenAI-compatible.
- `backup` — sidecar cron que cifra y sincroniza `/data/` a Backblaze B2 diariamente.

**Sin Postgres. Sin FastAPI. Sin servicio Python.** El stack se reduce a Next.js + QMD (librería) + llama.cpp server + Caddy. Cuatro contenedores.

**Modelo LLM principal**: Qwen3-4B-Instruct Q4_K_M, latencia ~15-25s por respuesta en 2 vCPU dedicadas. Para uso reflexivo (no chat rápido) es aceptable. Con 3 usuarios la concurrencia simultánea es prácticamente cero.

**OCR**: disponible tecnicamente, pero desactivado para datos reales hasta que
la DSFA y la evaluacion MDR aprueben la extraccion automatizada. Cuando se
autorice, Tesseract 5 se llama bajo demanda desde el contenedor `web`; una
llamada al LLM extrae JSON contra un schema Zod y el usuario revisa el resultado
antes de guardarlo como markdown. El PDF original se cifra con age.

**RAG dual con QMD desde Next.js**:

```ts
// apps/web/lib/qmd.ts
import { createStore } from '@tobilu/qmd'

export async function queryMemoryAndKB(userId: string, query: string) {
  const userStore = await createStore({
    dbPath: `/data/users/${userId}/index.sqlite`,
  })
  const kbStore = await createStore({ dbPath: '/data/kb-index.sqlite' })

  const [personal, evidence] = await Promise.all([
    userStore.search({ query, limit: 5, minScore: 0.3 }),
    kbStore.search({ query, limit: 5, minScore: 0.3 }),
  ])

  await Promise.all([userStore.close(), kbStore.close()])
  return { personal, evidence }
}
```

Los resultados se envuelven con `<source>` y se pasan al LLM principal con el system prompt Socrático.

**GDPR — lo que firmas antes de admitir al primer voluntario**:
- DSFA/DPIA escrita conforme al RGPD, la lista de la DSK y la autoridad
  competente del Bundesland alemán.
- Registro Art. 30.
- Política de privacidad pública en el sitio.
- Consentimiento Art. 9.2.a por escrito (email + checkbox + log en `audit_event`).
- Procedimiento de borrado documentado: `DELETE FROM auth WHERE id = X` + `rm -rf /data/users/<id>/` + entrada en audit log. Probado al menos una vez antes del piloto.
- Política de retención: por defecto datos vivos mientras dure el consentimiento, borrado a petición o tras revocación del consentimiento.

La lista completa de puertas legales, asesoría necesaria y controles técnicos
está en `docs/GUIA-LEGAL-PILOTO-ALEMANIA.md`. En particular, PHQ-9, GAD-7,
clasificación de crisis e interpretación personalizada deben permanecer
desactivados hasta cerrar por escrito su evaluación RGPD y MDR.

**Cuello de botella esperado**: latencia del LLM principal. 15-25s por consulta. Si los voluntarios reportan que se siente "lento", el siguiente paso es Qwen3-7B en lugar de 4B (aún cabe en 8 GB con Q4) o saltar a Fase 2.

**Coste total mensual estimado**: ~13 € VPS CCX13 + ~1 € backups B2 + ~1 € dominio prorrateado = **~15 €/mes**. Más barato que un Netflix.

**Filosofía de pago del piloto**: el acceso es por invitación y requiere una
suscripción activa. Los tres primeros usuarios pagan **6 €/mes cada uno**,
aportando 18 €/mes para cubrir un VPS cuyo coste actual es 16,65 €/mes y
absorber comisiones y costes operativos menores. La cuota financia
infraestructura compartida; no compra diagnósticos, tratamientos ni consultas
médicas.

El precio puede bajar por etapas cuando aumente el número de usuarios activos
de pago, pero nunca se recalcula automáticamente. Antes de cada cambio se
revisan costes, comisiones, capacidad y métricas de uso, y se comunica la nueva
cuota con antelación. El VPS actual (4 vCPU, 8 GB RAM, 160 GB de disco) puede
servir aproximadamente hasta 12 usuarios de uso moderado. Al acercarse a ese
umbral se decide con métricas reales si mantenerlo o subir de categoría.

---

## Fase 2 — VPS CPU potente · **~110-130 €/mes** · meses 4-8

Disparador: tienes >10 voluntarios activos, o el modelo Qwen3-4B/7B de Fase 1 se queda corto en razonamiento clínico complejo.

**Hosting**: Hetzner **CCX53** (16 vCPU dedicadas EPYC, 64 GB RAM, 240 GB NVMe), ~110 €/mes. Migración con `restic restore` desde B2 + `docker compose up`. Cero cambios de código.

**Modelo LLM principal**: **Qwen3-14B Q4_K_M** con llama.cpp server. Latencia ~8-15s. Calidad clínica notablemente mejor que 4B.

**QMD**: idéntico, ahora con más RAM disponible para mantener los modelos auxiliares cargados sin contención.

**KB**: amplía a ~5.000 chunks markdown. Activa los conectores de NICE/ESC si están disponibles. Cron mensual de PubMed con queries específicas.

**OCR**: activado por defecto. Pipeline asíncrono con cola simple (`SQLite LISTEN/NOTIFY` no existe, así que cola en tabla SQLite con polling cada 5s, o BullMQ con Redis si quieres ir formal).

**Opcional — primera capa estructurada**: si ya tienes datos longitudinales suficientes para querer correlaciones (HRV vs sueño vs analíticas por trimestre), aquí es donde puedes empezar a introducir una segunda base de datos estructurada. **Recomendación**: empieza con SQLite (`/data/structured.sqlite`) con vistas materializadas extraídas del frontmatter YAML de los markdown. Si las queries se complican, ese es el momento de plantear Postgres en Fase 3.

**Cambios de código necesarios desde Fase 1**: prácticamente ninguno. `.env` (`LLM_MODEL`), `docker-compose.yml` (límites de recursos), y opcionalmente código de extracción estructurada si activas la capa SQL.

---

## Perspectiva de diseño — Acceso al historial médico real (contexto alemán)

### El problema

Hasta ahora VitaMap asume que el usuario introduce sus datos manualmente: escribe observaciones, rellena cuestionarios, sube PDFs de analíticas. Eso funciona para datos nuevos que el usuario genera desde que empieza a usar la plataforma. Pero toda persona tiene un historial médico previo —años de analíticas, diagnósticos, informes hospitalarios— que vive en el sistema sanitario y que sería el contexto más valioso para el asistente.

La pregunta es: ¿cómo llegan esos datos a VitaMap sin requerir que el usuario los teclee uno a uno?

### Qué ofrece el sistema alemán

Desde enero 2025, todos los asegurados de la sanidad pública alemana tienen derecho a una carpeta digital personal con todo su historial médico (llamada ePA). La ley obliga a las aseguradoras a dársela al paciente si la pide, en un formato estructurado que cualquier software puede leer. Es un derecho del paciente, no un servicio de pago ni una opción técnica avanzada: está garantizado por ley (§341 SGB V).

En la práctica, el asegurado puede:
1. Entrar en la app de su aseguradora (AOK, TK, Barmer, DAK, etc.)
2. Solicitar la descarga de su historial completo
3. Recibir un fichero con todos sus datos: analíticas, diagnósticos, medicación, vacunas, informes de alta

El formato de ese fichero es lo que en el mundo médico se llama FHIR — en términos simples, es un JSON muy bien organizado que cualquier sistema informático puede entender directamente, sin necesidad de OCR ni interpretación.

### Por qué esto importa para VitaMap

La diferencia práctica es grande. Con el pipeline actual (subir un PDF → OCR → extracción con LLM) se pierde información, hay errores de lectura, y el proceso es lento. Con un fichero FHIR descargado de la aseguradora, los datos llegan ya estructurados y completos: no hay que "leerlos", solo transformarlos al formato markdown que usa VitaMap.

Además, para un voluntario del piloto que quiera contribuir con su historial real, el flujo sería tan simple como: descarga tu historial de la app de tu aseguradora, súbelo a VitaMap, y el sistema lo ingiere automáticamente.

### Cómo encaja en la arquitectura

El inbox ya tiene tres tipos de entrada (`lab`, `document`, `image`). Se añadiría un cuarto tipo (`fhir`) que reconoce los ficheros descargados de la aseguradora y los convierte directamente a markdown con frontmatter, sin pasar por OCR. El pipeline de revisión y aprobación es idéntico al actual: el usuario revisa lo que se va a guardar antes de confirmar.

```
inbox/
  ├── lab/          ← PDF analítica + OCR (ya funciona)
  ├── document/     ← PDF genérico + OCR (ya funciona)
  ├── image/        ← imagen + OCR (ya funciona)
  └── fhir/         ← historial de la aseguradora, ya estructurado ← Fase 2
```

### Qué hacer antes del piloto

Antes de implementar nada, el paso concreto es experimental: solicita tu propio historial a tu aseguradora alemana, descárgalo, y súbelo al pipeline OCR actual para ver qué pasa. Eso revela dos cosas en la práctica:

1. Qué información contiene realmente ese historial (hay aseguradoras más completas que otras)
2. Qué se pierde al tratarlo como PDF en lugar de como fichero estructurado

Con esa base empírica, la decisión de implementar el importador FHIR en Fase 2 tiene datos reales, no solo teoría.

### Lo que no hay que hacer en Fase 0/1

Existe un camino oficial para que una app se conecte directamente a la ePA del paciente sin que el usuario descargue nada (llamado DiGA). Requiere certificación federal, evidencia clínica, auditorías de seguridad, y cuesta años y decenas de miles de euros. No es el camino para VitaMap en ninguna fase del piloto. El modelo correcto para VitaMap es siempre: el paciente descarga sus propios datos y los sube voluntariamente, sin que la plataforma acceda a ningún sistema externo.

---

## Fase 3 — VPS con GPU dedicada · **~250-350 €/mes** · cuando el piloto demuestre retención

Disparador: 20+ voluntarios activos semanalmente, latencia es la fricción principal reportada, o quieres correr modelos 14B+ a velocidad de chat.

**Hosting**: Hetzner **GEX44** (RTX 4000 Ada, 20 GB VRAM, 64 GB RAM, AMD EPYC), ~280 €/mes. Alternativas: OVH con RTX 4090, Scaleway H100 spot.

**Modelo LLM principal**: **Qwen3-14B-Instruct AWQ-4bit** o **Qwen3-32B AWQ** con **vLLM**. Latencia 2-4s. Soporta 4-8 peticiones concurrentes con batching.

**QMD**: idéntico. Sus modelos auxiliares (embedding 0.6B, reranker 0.6B) pueden correr también en GPU si configuras `node-llama-cpp` con CUDA, dándote indexación y reranking más rápidos para KB grandes.

**Arquitectura opcional split**: separar `llm` + `web` (con QMD) a este VPS GPU, dejar `data` + `backup` en el VPS CCX53 más barato. Conexión por Tailscale o Wireguard privado. Coste combinado ~390 €/mes con mejor aislamiento.

**Postgres opcional para análisis longitudinal estructurado**: si en Fase 2 la capa SQLite estructurada se quedó corta (queries pesadas, joins múltiples, agregaciones por ventanas temporales), aquí es el momento de migrar esa capa a Postgres + pgvector. **QMD sigue siendo el motor RAG**; Postgres entra solo para análisis estructurado, dashboards y vistas longitudinales. Las dos capas conviven: markdown como fuente de verdad, QMD como índice RAG, Postgres como vista estructurada derivada.

**KB**: 50.000+ chunks viables. OCR rápido si lo mueves al contenedor con GPU.

---

## Decisiones de coste por componente — cuándo gastar y cuándo no

| Componente | Fase 0 | Fase 1 | Fase 2 | Fase 3 |
|---|---|---|---|---|
| VPS | 0 € (local) | Hetzner CCX13 ~13 € | Hetzner CCX53 ~110 € | Hetzner GEX44 ~280 € |
| LLM principal | Qwen3-4B local | Qwen3-4B Q4 CPU | Qwen3-14B Q4 CPU | Qwen3-14B AWQ GPU |
| RAG | QMD (librería) | QMD (librería) | QMD (librería) | QMD (librería) |
| Embeddings | Qwen3-Embed 0.6B | Qwen3-Embed 0.6B | Qwen3-Embed 0.6B | Qwen3-Embed 0.6B (GPU) |
| Reranker | qwen3-reranker 0.6B | qwen3-reranker 0.6B | qwen3-reranker 0.6B | qwen3-reranker 0.6B (GPU) |
| Auth | BetterAuth + SQLite | BetterAuth + SQLite | BetterAuth + SQLite | BetterAuth + SQLite o Postgres |
| Datos estructurados | — | — | SQLite opcional | Postgres opcional |
| OCR | desactivado | bajo demanda | activado | activado rápido |
| KB chunks | 30-50 | 200-500 | ~5.000 | 50.000+ |
| Backups | local | B2 ~1 € | B2 ~2 € | B2 ~5 € |
| Email transaccional | mailtrap free | Resend free | Resend 20 €/mes | Resend 20 €/mes |
| Monitorización | logs locales | Uptime Kuma self-hosted | + Grafana self-hosted | + alertas |
| **Total mensual** | **0 €** | **~15 €** | **~135 €** | **~310 €** |

La cuota por usuario no se deriva mecánicamente de esta tabla. Se fija por
etapas para cubrir el coste real de la infraestructura compartida, incluyendo
comisiones y margen operativo prudente, y se revisa al cambiar el número de
usuarios o la categoría del servidor.

---

## Trampas a evitar — errores que cuestan caro después

**No uses el modelo de embeddings por defecto de QMD si tus voluntarios escriben en español o catalán**. embeddinggemma-300M es inglés-óptimo. Fija `QMD_EMBED_MODEL=hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf` desde el primer `qmd embed`. Migrar después implica `qmd embed -f` sobre todas las memorias y la KB entera.

**No uses APIs externas "solo para el piloto"**. Una vez que tus voluntarios ven respuestas de 2s con GPT-5, ya no aceptan los 15-25s de Qwen3-4B local. Y si pruebas con datos reales contra una API externa, tu DPIA y tu encuadre de no-dispositivo-médico se complican mucho.

**Verifica que el VPS tiene toolchain para `node-llama-cpp`**. QMD compila bindings nativos al instalar. En un Hetzner limpio necesitas `apt install build-essential cmake python3` o usar la imagen Docker oficial que ya incluye todo. Si no, la primera instalación falla con errores opacos.

**No saltes la tabla `audit_event` ni el hash chain**. Retroactivarlo es imposible sin perder integridad. Implementa append-only desde el primer commit, incluso si al principio solo registras login/logout y acceso a memoria.

**No confíes el disclaimer al LLM**. El "esto no sustituye consulta médica" se inyecta a nivel UI siempre, en cada respuesta. Si dependes del modelo para incluirlo, algún día se olvidará y queda en el log.

**No metas Kubernetes ni k3s en Fase 1**. Docker Compose es suficiente hasta cientos de usuarios. K8s consume RAM que necesitas para el LLM.

**No conectes wearables ni VCF en el MVP**. Añaden complejidad x10 por valor marginal. Roadmap explícito tras Fase 3.

**No pongas Postgres en Fase 0/1 "por si acaso"**. Es una pieza que mantener, respaldar, parchar. QMD + SQLite hacen el trabajo a esta escala. Reintroduce Postgres solo cuando una query de análisis estructurado lo justifique explícitamente.

**No uses MongoDB Community para RAG**. Su `$vectorSearch` nativo solo existe en Atlas (cloud gestionado, fuera de tu encuadre GDPR self-hosted). Self-hosted hace fuerza bruta sobre arrays de floats. Si necesitas más que SQLite-vec, salta directamente a Qdrant self-hosted.

**No edites los markdown de los usuarios desde el backend sin un commit explícito en audit log**. Cada modificación de la memoria personal debe quedar trazada. Lo más limpio: cada operación de escritura genera un evento `memory.write` con `path`, `hash_before`, `hash_after`, `actor`.

---

## Checklist de Fase 0 — primeras dos semanas

1. Crear el monorepo: `apps/web` (Next.js 15 + TS + Drizzle + BetterAuth + `@tobilu/qmd`), `infra/docker-compose.yml` (Caddy + llama.cpp server), `data/kb/` con 30-50 documentos seed markdown.
2. Levantar `llama.cpp server` con Qwen3-4B-Instruct Q4_K_M. Verificar endpoint `POST /v1/chat/completions` desde curl.
3. Instalar QMD: `npm install @tobilu/qmd`. Exportar `QMD_EMBED_MODEL` a Qwen3-Embedding-0.6B.
4. Implementar `lib/qmd.ts` con `createStore()` por usuario y store compartido de KB. Wrapper `queryMemoryAndKB(userId, query)`.
5. Indexar KB seed: script Node que llama a `store.update()` y `store.embed()` sobre `/data/kb-index.sqlite`.
6. Implementar el RAG dual en `/api/chat`: dos retrievals paralelos, wrapper `<source type>`, system prompt Socrático con obligación de citar `evidence_level`.
7. Implementar el guardrail de segunda pasada (clasificador binario diagnóstico/no diagnóstico) como llamada al mismo LLM con prompt minimalista.
8. Implementar `audit_event` append-only con hash chain en SQLite. Helper `logAuditEvent(actor, action, subjectId, payloadSummary)`.
9. UI mínima: registro/login (BetterAuth), captura de observación libre que
   genera markdown con frontmatter y respuestas IA con citas y disclaimer fijo.
   PHQ-9, GAD-7, crisis e interpretacion personalizada quedan detras de feature
   flags desactivados hasta cerrar su evaluacion RGPD y MDR.
10. Tras cada escritura de markdown, llamar a `store.update()` para reindexar el corpus del usuario afectado.
11. Probar end-to-end con tus propios datos durante una semana antes de pasar a Fase 1.
12. Decidir si Fase 1 arranca ya o si Fase 0 necesita iterar más (latencia, calidad de respuestas, ergonomía del flujo).

---

## Próximo movimiento sugerido

Conectar la carpeta `/Users/gorcap/myPro/Experimental/VitaMap` como folder accesible para que se pueda escribir directamente el esqueleto del repo (Next.js + `@tobilu/qmd` + BetterAuth + Docker Compose con llama.cpp server + seed KB markdown + helpers de RAG dual y audit log), siguiendo este roadmap como guía operativa.
