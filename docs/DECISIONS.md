# Decisiones arquitectónicas (ADR ligero)

Documento vivo de decisiones técnicas con su contexto. Una entrada por
decisión; nunca se borran, solo se marcan como *superseded* si cambian.

---

## ADR-012 · Registro cerrado mediante invitaciones nominativas
**Estado:** aceptada · 2026-06-07

**Contexto.** El piloto se limita inicialmente a tres personas. Ocultar o no
publicar `/register` no impide que alguien use el formulario o llame
directamente al endpoint de alta de BetterAuth.

**Decisión.** Cada alta requiere un código administrativo:

- ligado a un email normalizado;
- generado con 192 bits aleatorios;
- almacenado únicamente como hash SHA-256;
- con caducidad de 1 a 90 días;
- revocable y válido para una sola cuenta;
- reservado durante el registro para impedir consumo concurrente.

La invitación se consume antes de crear la cuenta. Si BetterAuth rechaza el
alta, el mismo proceso puede reabrirla; si el proceso se interrumpe, queda
cerrada antes que permitir una cuenta no autorizada.

El endpoint `/api/auth/sign-up/email` exige además una cabecera interna firmada
con `BETTER_AUTH_SECRET`. Solo la Server Action que validó la invitación añade
esa autorización, por lo que llamar directamente a BetterAuth no evita el
control.

**Operación.** `npm run invite -w @vitamap/web -- create <email>` en local, o
el servicio Docker de perfil `tools` en el VPS. El código se muestra una sola
vez y se comparte por un canal privado, nunca dentro de una URL.

**Consecuencias.**
- La tabla `registration_invitation` comparte `auth.sqlite`.
- Crear una invitación no crea todavía una cuenta ni concede acceso.
- El alta continúa necesitando consentimiento y, después, pago confirmado.
- Las pruebas cubren código incorrecto, email distinto, caducidad, revocación,
  concurrencia, reintento, uso único y bypass directo de BetterAuth.

---

## ADR-011 · Cuota compartida de infraestructura con acceso por suscripción
**Estado:** aceptada · 2026-06-07

**Contexto.** VitaMap necesita un VPS europeo para mantener los datos y el
modelo de IA dentro de la infraestructura controlada. En el piloto inicial,
el VPS de 4 vCPU, 8 GB de RAM y 160 GB de disco cuesta 16,65 €/mes, antes de
comisiones de pago y otros costes operativos menores. El proyecto comienza
con tres usuarios reales y no busca obtener margen vendiendo diagnósticos o
consejo médico.

**Decisión.** El acceso al piloto es por invitación y requiere una
suscripción activa de **6 €/mes por usuario**:

```text
3 usuarios x 6 €/mes = 18 €/mes
```

La cuota financia la infraestructura compartida que hace posible VitaMap.
Stripe procesa la suscripción y transfiere los fondos a la cuenta operativa
del proyecto. VitaMap sigue siendo una herramienta educativa: el pago no
compra un diagnóstico, tratamiento, consulta médica ni una respuesta clínica
determinada.

**Evolución de la cuota.** A medida que aumente el número de usuarios activos
de pago, la cuota podrá reducirse por etapas. El cambio no será automático:
antes se revisarán el coste real del VPS, las comisiones, los backups, el uso
de CPU y RAM y la necesidad de ampliar infraestructura. Cada cambio de precio
se comunicará con antelación y se aplicará de forma transparente.

**Umbral de revisión.** El VPS actual se considera adecuado para un piloto de
hasta aproximadamente 12 usuarios con uso moderado y poca concurrencia. Al
acercarse a ese número se revisarán las métricas reales. Llegar a 12 usuarios
no obliga por sí solo a cambiar de servidor ni garantiza una bajada de cuota:
la decisión depende de capacidad, latencia y coste de la siguiente categoría.

**Consecuencias.**
- Registro permitido solo mediante invitación válida.
- Tras registrarse, el usuario debe completar Checkout y esperar la
  confirmación del webhook de Stripe.
- Sin suscripción activa no se habilitan chat, memoria, subida de documentos
  ni assessments; billing, ajustes, exportación y borrado de cuenta siguen
  disponibles.
- Stripe es la fuente de verdad del estado de pago. La URL de retorno de
  Checkout no activa por sí sola el acceso.
- La página de suscripción debe explicar precio, periodicidad, renovación,
  cancelación y finalidad de la cuota.

---

## ADR-001 · QMD como motor RAG central
**Estado:** aceptada · 2026-06-01

**Contexto.** Necesitamos un motor RAG local con BM25 + vector + reranker
sobre markdown, capaz de aislar memorias por usuario y de actualizarse en
caliente.

**Decisión.** Usar `@tobilu/qmd` como librería embebida en `apps/web`.
Un store por usuario en `data/users/<id>/index.sqlite` + un store
compartido en `data/kb-index.sqlite`.

**Alternativas descartadas.** Postgres + pgvector (más infra para 3
usuarios), Qdrant (otro servicio), MongoDB Atlas (cloud + GDPR), Mongo
Community (sin índice vectorial nativo), LanceDB (sin BM25+rerank
integrado).

**Consecuencias.** Aislamiento GDPR trivial vía filesystem. Schema de
chunks lo decide QMD (900 tokens, 15% overlap). Si más adelante hace
falta análisis estructurado longitudinal, se añadirá Postgres como
capa derivada, manteniendo QMD para RAG.

---

## ADR-002 · Embedding multilingüe Qwen3-Embedding-0.6B desde Fase 0
**Estado:** aceptada · 2026-06-01

**Contexto.** Voluntarios escribirán en español (principal) e inglés.
El default de QMD (embeddinggemma-300M) está optimizado para inglés.

**Decisión.** Fijar `QMD_EMBED_MODEL=hf:Qwen/Qwen3-Embedding-0.6B-GGUF/...`
desde el primer `qmd embed`.

**Consecuencias.** Reindexar tras cambiar de modelo cuesta horas en una
KB grande; fijarlo ahora evita esa migración futura.

---

## ADR-003 · Memoria del usuario como markdown con frontmatter YAML
**Estado:** aceptada · 2026-06-01

**Contexto.** Necesitamos un formato que sea portable, inspeccionable
por el usuario, exportable, GDPR-friendly y eficaz para alimentar al
LLM.

**Decisión.** Cada observación es un `.md` con frontmatter YAML
(`type`, `observed_at`, `tags`, valores numéricos cuando aplique) y
cuerpo libre.

**Consecuencias.** Right-to-erasure = `rm -rf data/users/<id>`.
Export = `zip -r memoria.zip data/users/<id>/memory`.

---

## ADR-004 · LLM principal con protocolo OpenAI-compatible
**Estado:** aceptada · 2026-06-01

**Contexto.** Queremos poder cambiar de modelo y de runtime
(llama.cpp / Ollama / vLLM) sin tocar código de aplicación.

**Decisión.** El cliente en `lib/llm.ts` habla `POST /v1/chat/completions`
contra `LLM_BASE_URL`. Compatible con cualquier servidor que exponga
ese contrato.

**Consecuencias.** Cambiar de Qwen3-4B a Qwen3-14B o a otro modelo es
modificar `.env`.

---

## ADR-005 · Sin Postgres en Fase 0/1
**Estado:** aceptada · 2026-06-01

**Contexto.** Para 3 usuarios sin análisis estructurado complejo,
Postgres añade superficie de operación sin valor proporcional.

**Decisión.** SQLite vía BetterAuth para auth + audit; QMD/SQLite para
RAG. Sin Postgres hasta que aparezca una necesidad concreta de análisis
estructurado longitudinal (Fase 2 opcional, Fase 3 probable).

**Consecuencias.** Backup = un par de ficheros. Migración a Postgres
cuando ocurra implica una capa derivada, no una reescritura.

---

## ADR-006 · Guardrail anti-diagnóstico como segunda pasada del LLM
**Estado:** aceptada · 2026-06-01

**Contexto.** El system prompt socrático puede ser ignorado o
malinterpretado por el modelo. Necesitamos una capa de seguridad
independiente del comportamiento del modelo principal.

**Decisión.** Cada respuesta del modelo pasa por una segunda llamada
(mismo modelo, prompt minimalista) que clasifica si contiene lenguaje
diagnóstico o prescriptivo. Si sí: reescritura socrática o bloqueo.

**Consecuencias.** Doble latencia para respuestas no triviales.
Mitigable con clasificación selectiva (solo cuando aparecen palabras
clave de riesgo).

---

## ADR-010 · Chat sin streaming en Fase 1 por integridad del guardrail
**Estado:** aceptada · 2026-06-01

**Contexto.** El asistente de IA tiene un guardrail (`lib/guardrail.ts`)
que clasifica la respuesta del LLM y la reescribe o bloquea si detecta
lenguaje diagnóstico o prescriptivo. Este guardrail necesita la
respuesta COMPLETA del modelo principal para clasificarla; no puede
funcionar token a token sobre un stream.

**Decisión.** En `/api/chat` no se hace streaming. El cliente espera la
respuesta completa, ya filtrada por el guardrail. Latencia típica
20-50s en CCX13 (15-25s del LLM principal + 3-5s del clasificador +
opcionalmente 15-25s más si hay reescritura). UI muestra estado
"Pensando…" con animación durante la espera.

**Alternativa explorada.** Streaming del draft al cliente para feedback
temprano, y al final una operación de "reemplazo del mensaje" si el
guardrail decide reescribir o bloquear. Rechazada por dos razones:
(1) ya mostrar texto que luego desaparece o cambia es UX-hostil y
debilita la confianza del usuario en la herramienta, (2) si por un fallo
en la lógica de reemplazo el cliente queda con la versión "draft"
visible, hemos roto el contrato del guardrail.

**Disparador para revisar.** Cuando estemos en Fase 3 con GPU y la
latencia base baje a 2-4s, el guardrail puede correr en paralelo con
el reranker y el coste UX de la espera no compensa el riesgo del
streaming. Esa revisión irá con un ADR-XXX nuevo.

**Consecuencias.** UI de chat con animación de "pensando" obligatoria.
Historial de chat NO se persiste en servidor en Fase 1 (vive solo en
React state del cliente, se pierde al refrescar). Persistencia con
cifrado por usuario llega en Fase 2 cuando montemos análisis longitudinal.

---

## ADR-009 · BetterAuth con email + contraseña sobre SQLite; MFA TOTP en Fase 2
**Estado:** aceptada · 2026-06-01

**Contexto.** Login obligatorio por requisito GDPR (aislamiento por
usuario, audit log significativo, trazabilidad del consentimiento Art.
9.2.a). Necesitamos un sistema self-hosted que comparta DB con
`audit_event` para no añadir infra.

**Decisión.** `better-auth` con backend `better-sqlite3` sobre
`data/auth.sqlite` (la misma BD que aloja `audit_event`). Email +
contraseña, sesión por cookie httpOnly de 14 días con refresh
diario, auto-signin tras registro. Mínimo de 10 caracteres en
contraseña. Sin verificación de email para Fase 1 (alta invite-only y
relación de confianza con los voluntarios). MFA TOTP queda como
seguimiento de Fase 2 — BetterAuth lo soporta por plugin pero
añade fricción de onboarding poco justificada para 3 personas en
piloto cerrado.

**Alternativas descartadas.**
- *Lucia Auth*: el mantenedor lo marcó como legacy en 2024 a favor de
  recetas con Oslo. Construir auth a mano sobre Oslo es más código del
  que necesitamos para un piloto.
- *Magic links sin contraseña*: requiere SMTP en el VPS (otro
  contenedor + DKIM/SPF + reputación). Sobredimensionado para 3 usuarios.
- *Passkey / WebAuthn*: máxima seguridad pero curva de aprendizaje
  alta y recuperación traumática si el voluntario pierde el dispositivo.
  Buen candidato para Fase 2 como opción adicional.
- *Servicios gestionados (Clerk, Auth0, Supabase Auth)*: implementación
  más rápida pero envía identidades de pacientes a un tercero, añade
  DPAs y complica el encuadre "nada sale del VPS".

**Flujo de consentimiento.** El registro NO se completa hasta marcar
dos checkboxes obligatorios (reconocimiento educacional + consentimiento
Art. 9.2.a). El audit log captura `auth.register` +
`auth.consent.granted` con la versión del documento (`CONSENT_VERSION`
en `lib/consent.ts`). Cambios al documento incrementan la versión y
fuerzan re-consentimiento.

**Borrado de cuenta.** Type-to-confirm `"BORRAR"` + contraseña. Orden:
audit log (`consent.revoked` + `user.purge:start`) → `rm -rf
data/users/<id>/` → eliminación BetterAuth → `user.purge:complete`.
El audit log sobrevive al borrado con identificador pseudonimizado para
acreditar el cumplimiento del derecho al olvido.

**Consecuencias.** Login obligatorio en `/(app)/*` vía middleware
ligero (chequeo de cookie) + `requireUserId()` en cada server
component/action/route handler. La cookie de sesión es la única forma
de identificar al usuario; no hay query strings `?userId=`.

---

## ADR-008 · OCR con tesseract+poppler en el contenedor `web`; docTR como upgrade Fase 2+
**Estado:** aceptada · 2026-06-01

**Contexto.** Necesitamos OCR sobre PDFs y fotos de analíticas para Fase 1
(3 voluntarios, VPS CCX13 con 8 GB de RAM). El usuario expresó preferencia
por docTR (Python, mejor calidad sobre layouts médicos).

**Decisión.** Para Fase 1 usamos **tesseract 5 + poppler-utils** invocados
por `execFile` desde el contenedor `web`. `lib/ocr.ts` define una
abstracción `ocrPdf` / `ocrImage` con resultado canónico, de modo que
sustituir el backend por un sidecar docTR HTTP en Fase 2+ no toca código
de aplicación: solo se cambia el contenido de `lib/ocr.ts`.

**Razones para no añadir docTR ahora.**
- Un sidecar Python con docTR consume ~1-2 GB de RAM residente y suma
  ~700 MB a la imagen. En CCX13 (8 GB) compromete los márgenes del LLM.
- Añade un quinto contenedor a un stack que mantenemos deliberadamente
  pequeño en Fase 1.
- tesseract 5 con `spa+eng` da resultados aceptables sobre analíticas
  con texto claro, que es el caso predominante.

**Estrategia para PDFs:** intentar primero extracción nativa con
`pdfjs-dist` (instantánea, sin OCR) y solo degradar a OCR si el texto
extraído es insuficiente. Esto cubre la mayoría de analíticas modernas
emitidas digitalmente sin coste de CPU.

**Disparador para migrar a docTR (Fase 2):**
- Volumen de voluntarios >10 con analíticas escaneadas de baja calidad.
- Tasa de error de extracción persistentemente >20% en analíticas reales.
- VPS con suficiente RAM ociosa (CCX53 o superior).

**Consecuencias.** Calidad OCR menor en escaneos pobres. Mitigable con
mayor DPI en `pdftoppm` (ya 300) y con la pasada de extracción del LLM
que tolera ruido. La revisión humana en `/inbox/<id>` es la red de
seguridad final.

---

## ADR-007 · Audit log append-only con hash chain
**Estado:** aceptada · 2026-06-01

**Contexto.** Defensa ante auditorías y reclamaciones GDPR.

**Decisión.** Tabla `audit_event` en `data/auth.sqlite` donde cada
entrada incluye `prev_hash` y `event_hash = sha256(prev || campos)`.
Verificación de la cadena vía cron diario.

**Consecuencias.** Manipulación retroactiva detectable. Coste
despreciable en escritura.
