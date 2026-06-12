# Análisis de brechas — cierre de Fase 0

Fecha: 2026-06-12 · Basado en revisión del código en `apps/web`, `infra/` y `docs/ROADMAP.md`.

---

## 1. Estado frente al checklist de Fase 0

| # | Ítem del checklist | Estado |
|---|---|---|
| 1–4 | Monorepo, llama.cpp, QMD, `lib/qmd.ts` dual | ✅ Hecho |
| 5–6 | `/admin/corpus` + indexación solo de aprobados | ✅ Validado local; pendiente despliegue |
| 7 | RAG dual en `/api/chat` con `<source type>` | ✅ Hecho |
| 8 | Guardrail segunda pasada | ✅ Hecho (fail-closed, bien) |
| 9 | `audit_event` con hash chain | ✅ Hecho |
| 10 | UI mínima + feature flags | ✅ Hecho (`ASSESSMENTS_ENABLED`) |
| 11 | Reindexar tras cada escritura | ✅ Hecho |
| 12 | Probar end-to-end una semana con datos propios | 🟡 En curso (80 tarjetas, chat funciona) |
| 13 | Decisión latencia/calidad antes de Fase 1 | 🔴 Bloqueada por los 40 s |

**Brecha de arquitectura no cubierta por el checklist pero sí por el ROADMAP (Fase 0):**

- **Clasificador de crisis ausente.** El ROADMAP exige en Fase 0 "validar que el clasificador de crisis no genera falsos negativos en casos test conocidos". No existe ningún código de detección de crisis (`grep crisis` → 0 resultados). Aunque la UI de extracción conversacional sea de Fase 1, el *diseño y prueba del prompt* es entregable de Fase 0. Es la brecha funcional más importante.
- **Prompt de extracción conversacional**: existe `lib/extraction.ts` para documentos, pero la validación extraíble/no-extraíble sobre conversaciones (entregable Fase 0 según ROADMAP) no tiene casos test.
- **`verifyAuditChain()` existe pero nadie la llama.** Una cadena de hashes que nunca se verifica no detecta manipulación. Cerrar: invocarla en `/api/health` (o un cron) y exponer `audit_chain: ok` en el healthcheck.

## 2. Brechas de seguridad

Orden por prioridad para cerrar Fase 0 / entrar en Fase 1.

### P0 — antes de datos reales de terceros

1. **Sin rate limiting en ningún endpoint.** Ni en login (fuerza bruta de contraseñas), ni en `/api/chat` (un usuario o una cookie robada puede saturar el LLM CPU y denegar servicio a los otros dos usuarios), ni en `/api/upload`. BetterAuth trae `rateLimit` integrado (activable en la config); para `/api/chat` basta un token-bucket en memoria por `userId` (p. ej. 10 consultas/min) — con 3 usuarios no necesitas Redis.
2. **Recuperación de contraseña, verificación de email y MFA pendientes** — ya marcado como "P0 antes de datos reales" en el comentario de `lib/auth.ts`, pero no hay issue/tarea que lo rastree. Sin reset de contraseña, un usuario bloqueado requiere intervención manual en SQLite.
3. **Memoria personal en claro en disco.** Solo los PDFs originales se cifran con age; los `.md` de memoria y los índices SQLite van en claro. La mitigación declarada es LUKS en el VPS — verificar que el script de provisión lo aplica de verdad, porque el compose monta un volumen Docker normal (`/var/lib/docker/volumes/...`). Si el VPS no tiene LUKS, esta mitigación hoy no existe. Alternativa de bajo coste: cifrar el volumen del host o usar un VPS con cifrado de disco verificado.
4. **Rotación de MASTER_KEY no implementable.** Las passphrases age derivan por HMAC de `MASTER_KEY`; rotarla invalida todos los ficheros cifrados. El `.env.example` la declara "rotable" pero no hay herramienta de re-cifrado. Cerrar: script `rotate-master-key` (descifrar con clave vieja → recifrar con nueva), o documentar honestamente que no es rotable todavía.

### P1 — endurecer antes/durante el piloto

5. **Sin CSP.** El Caddyfile lo deja como TODO ("Ajustar CSP cuando se integre auth" — auth ya está integrado). Añadir `Content-Security-Policy` (al menos `default-src 'self'`, ajustando para Next/Stripe) y `X-Frame-Options` ya está. Considerar duplicar cabeceras en `next.config.ts` para que también apliquen en dev.
6. **Contenedor `web` corre como root.** `infra/Dockerfile.web` no tiene `USER`. Añadir usuario sin privilegios (Next standalone lo soporta sin fricción).
7. **Fuga de detalles internos en errores de API.** `/api/chat` devuelve `detail: String(err)` en `invalid_body` y `retrieval_failed` — puede exponer rutas de filesystem o internals de QMD al cliente. Loguear el detalle en servidor y devolver solo el código de error.
8. **Variables Stripe fuera del esquema de `lib/env.ts`.** Se validan lazy en `lib/stripe.ts` → el fallo aparece en mitad de un checkout en vez de en el arranque. Añadirlas al `EnvSchema` (opcionales si `NODE_ENV !== production`).
9. **Auditoría incompleta del ciclo de respuesta.** Las acciones `guardrail.block`/`guardrail.rewrite` están definidas en `lib/audit.ts` pero el route solo registra `chat.query` con el verdict embebido en `payloadSum`. Funciona, pero si el plan es consultar eventos de guardrail, registrarlos como eventos propios.
10. **`llama.cpp` sin autenticación en la red interna.** Aceptable en la red bridge de Compose con 3 servicios; documentarlo como supuesto (cualquier contenedor comprometido habla con el LLM). No urgente.

### Cosas que ya están bien (no tocar)

Invitaciones con hash + cabecera interna firmada (ADR-012), `safeUserId` contra path traversal, validación de `relPath` en memory-reader, guardrail fail-closed, `.env` fuera de git, cookies httpOnly/Secure, allowlist admin, zod en bodies, límite 10 MB en uploads, backup restic cifrado con volumen `:ro`.

## 3. Latencia del chat (~40 s) — diagnóstico y variantes

### Dónde se va el tiempo

El pipeline es **estrictamente secuencial y sin streaming**:

```
retrieval (QMD) → generación (LLM, 180 tok) → guardrail (LLM, 200 tok) → [rewrite (LLM, 512 tok)]
```

Con Qwen3-4B Q4 en CPU, los sospechosos por orden de probabilidad:

1. **Re-evaluación del prompt en cada llamada.** El system prompt socrático tiene ~1.500 tokens; más contexto RAG e historial, cada petición evalúa 2.000–3.500 tokens de prompt *dos veces* (generación + guardrail). En CPU la evaluación de prompt es el coste dominante, no la generación de 180 tokens.
2. **Guardrail = segunda pasada completa** con las fuentes repetidas en el input.
3. **Apertura/cierre de stores QMD por petición** (`createStore` + `close` en cada chat) y embedding de la query con Qwen3-Embedding-0.6B en CPU.
4. Si hay rewrite, tercera pasada (+512 tokens).

**Primer paso: medir, no adivinar.** El route ya loguea `[chat] retrieval/generation/guardrail complete { durationMs }`. Revisar esos logs te dice exactamente el reparto antes de optimizar.

### Variantes para hacerlo fluido (ordenadas por coste/beneficio)

**A. Prompt caching en llama.cpp — gratis, gran impacto.**
Añadir `"cache_prompt": true` al body de `lib/llm.ts` y arrancar el server con `--cache-reuse 256`. El system prompt (constante) se evalúa una vez y se reutiliza; con 2 slots (`--parallel 2`) generación y guardrail pueden mantener cachés separadas. Esto solo puede quitar 10–20 s en CPU.

**B. Streaming con guardrail al final — el mayor salto percibido.**
`chatStream()` ya existe en `lib/llm.ts` y no se usa. Patrón compatible con el guardrail:
   - Se transmite el borrador token a token en la UI marcado visualmente como "verificando…" (atenuado).
   - Al terminar, corre el guardrail: si `safe`, se desbloquea; si `rewrite`/`block`, se reemplaza por el texto final.
   - El usuario ve actividad en ~2-3 s en lugar de pantalla vacía 40 s.
   - Riesgo: el usuario ve un borrador que luego se retira. Para piloto educativo con disclaimer fijo es defendible; documentarlo como decisión (ADR) porque cambia el contrato "nada sin revisar" a "nada *persiste* sin revisar".
   - Si ese riesgo no es aceptable: mantener non-streaming pero mostrar progreso real por fases (recuperando → redactando → verificando) usando SSE; no reduce el tiempo pero elimina la sensación de cuelgue.

**C. Guardrail más barato.**
   - Pre-filtro heurístico: si la respuesta no contiene patrones clínicos (regex sobre verbos diagnósticos/dosis ya tienes patrones similares en `conversation-policy.ts`) y hubo 0 fuentes clínicas, saltar la pasada LLM. Con el perfil de preguntas reales, puede evitar el 30–50 % de segundas pasadas.
   - O segundo servidor llama.cpp con Qwen3-1.7B solo para clasificar: la pasada de guardrail baja de ~10 s a ~2 s. RAM extra ~1,5 GB.

**D. Stores QMD persistentes.** Singleton con cache por usuario (cerrar tras N min de inactividad) en lugar de open/close por petición. Quita 1–3 s y evita re-cargar el modelo de embeddings.

**E. Infra.** En el compose, `LLM_THREADS` por defecto es **2** con 4 vCPU disponibles: subir a 3 (dejando 1 para Next). En local, asegúrate de que llama.cpp usa todos los cores de rendimiento del Mac.

**F. Última opción: inferencia gestionada UE.** Una API tipo Mistral (UE, con DPA) bajaría a 2-3 s por pasada, pero rompe el principio self-hosted del proyecto y exige re-evaluar el encuadre RGPD (los datos de salud saldrían del VPS). Solo si A–E no bastan y antes documentándolo como ADR.

**Combinación recomendada para Fase 0:** A + B + C(pre-filtro) + D. Objetivo realista: 40 s → ~12-15 s reales, ~3 s percibidos con streaming. Con eso el ítem 13 del checklist (decisión de latencia) queda desbloqueado sin cambiar de modelo ni de hosting.

## 4. Orden sugerido de cierre

1. Medir reparto real de latencia con los logs existentes (1 día).
2. `cache_prompt` + threads + stores persistentes (1-2 días).
3. Rate limiting (BetterAuth + token-bucket en chat) (1 día).
4. Streaming con verificación al final + ADR de la decisión (2-3 días).
5. Clasificador de crisis: prompt + casos test conocidos (entregable Fase 0) (2 días).
6. Verificación de cadena de auditoría en `/api/health` (medio día).
7. CSP, usuario no-root en Docker, sanear `detail` de errores, Stripe en `EnvSchema` (1 día).
8. Decidir y documentar: rotación de MASTER_KEY y verificación de LUKS en el procedimiento de provisión del VPS (antes de Fase 1).
