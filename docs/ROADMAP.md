# VitaMap — Roadmap de piloto de bajo presupuesto (revisión con QMD)

Documento de ruta para iniciar el piloto sin romper la arquitectura objetivo (self-hosted, GDPR, RAG dual personal+científico, guardrails anti-diagnóstico). Esta revisión integra **`tobi/qmd`** como motor RAG central, lo cual elimina Postgres del MVP y simplifica drásticamente el piloto inicial. Cada fase usa el mismo código y el mismo modelo de datos en disco; solo cambian el tamaño del modelo LLM, el hosting y la presencia o no de capas estructuradas adicionales.

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

**Datos**: tu propia memoria + 1-2 personas de confianza con consentimiento explícito por mensaje. Sin DPIA formal todavía porque no es despliegue público.

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

**OCR**: opcional. Si lo activas, Tesseract 5 instalado en el contenedor `web` y llamado bajo demanda como subproceso desde Node cuando el voluntario sube un PDF. Tras OCR, una llamada al LLM extrae JSON estructurado contra un schema Zod, y el resultado se guarda como **markdown con frontmatter** en `users/<id>/memory/labs/`. El PDF original se cifra con age y se guarda en `documents/`. QMD reindexa automáticamente en el próximo `update`.

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
- DPIA escrita (plantilla AEPD si aplica).
- Registro Art. 30.
- Política de privacidad pública en el sitio.
- Consentimiento Art. 9.2.a por escrito (email + checkbox + log en `audit_event`).
- Procedimiento de borrado documentado: `DELETE FROM auth WHERE id = X` + `rm -rf /data/users/<id>/` + entrada en audit log. Probado al menos una vez antes del piloto.
- Política de retención: por defecto datos vivos mientras dure el consentimiento, borrado a petición o tras revocación del consentimiento.

**Cuello de botella esperado**: latencia del LLM principal. 15-25s por consulta. Si los voluntarios reportan que se siente "lento", el siguiente paso es Qwen3-7B en lugar de 4B (aún cabe en 8 GB con Q4) o saltar a Fase 2.

**Coste total mensual estimado**: ~13 € VPS CCX13 + ~1 € backups B2 + ~1 € dominio prorrateado = **~15 €/mes**. Más barato que un Netflix.

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
9. UI mínima: registro/login (BetterAuth), captura de observación libre que genera markdown con frontmatter en `users/<id>/memory/observations/`, formulario PHQ-9 y GAD-7 que genera markdown con scores, vista de respuestas IA con citas y disclaimer fijo en footer.
10. Tras cada escritura de markdown, llamar a `store.update()` para reindexar el corpus del usuario afectado.
11. Probar end-to-end con tus propios datos durante una semana antes de pasar a Fase 1.
12. Decidir si Fase 1 arranca ya o si Fase 0 necesita iterar más (latencia, calidad de respuestas, ergonomía del flujo).

---

## Próximo movimiento sugerido

Conectar la carpeta `/Users/gorcap/myPro/Experimental/VitaMap` como folder accesible para que se pueda escribir directamente el esqueleto del repo (Next.js + `@tobilu/qmd` + BetterAuth + Docker Compose con llama.cpp server + seed KB markdown + helpers de RAG dual y audit log), siguiendo este roadmap como guía operativa.
