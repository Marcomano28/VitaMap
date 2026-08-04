# Informe de arquitectura · 2026-08-02

Análisis del repositorio completo: mapa arquitectónico, inconsistencias,
código muerto y duplicación, más el trabajo implementado sobre
`PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-PACIENTES.md` (ver ADR-018).

Método: lectura dirigida del código, `ts-prune` sobre `apps/web` (descartando
los falsos positivos de entry points de Next), greps de referencias cruzadas y
verificación con `tsc --noEmit`, `npm run test:data-access` y
`npm run check:data-access`.

---

## 1. Mapa arquitectónico

El repositorio es un monorepo con un único paquete de aplicación:
`apps/web` (Next.js 15, App Router, runtime Node por las dependencias nativas
better-sqlite3 y @tobilu/qmd). El resto de directorios de primer nivel son
material de soporte: `corpus-preparation/` (2,8 MB de briefs, prompts y bundles
para generar el corpus), `eval/` (suites YAML de evaluación del asistente),
`infra/` (Docker + Caddy), `data/` (KB semilla y datos de usuario en runtime,
ignorados por git), `test-data/`, `textToAudio/` y `docs/` (38 documentos, con
`DECISIONS.md` como registro ADR).

Dentro de `apps/web`, la lógica vive en `lib/` (50 módulos) y la superficie de
entrada son 9 route handlers en `app/api/` más 14 ficheros de server actions.
El flujo de una petición de datos es: sesión BetterAuth (`lib/session.ts`) →
guarda de suscripción (`lib/subscription-access.ts`) → **choke point de
autorización** (`lib/data-access.ts`, nuevo, ADR-018) → direccionamiento de
datos por usuario (`lib/qmd.ts` `userMemoryDir`, `lib/memory*.ts`). La
persistencia se reparte entre el filesystem por usuario
(`data/users/<id>/{memory,documents,inbox,index.sqlite}`, documentos cifrados
con age) y una única `auth.sqlite` que comparten BetterAuth, `audit_event`
(hash chain, ADR-007), invitaciones, billing y ahora
`data_subject`/`data_access_grant`.

La calidad general es notablemente alta para la fase del proyecto: choke
points reales, auditoría con actor/sujeto separados, validación de entorno con
zod, 30+ suites de test por script y documentación de decisiones viva. Los
hallazgos siguientes son proporcionales a eso: pocos y casi todos pequeños.

---

## 2. Inconsistencias localizadas

**2.1 · Colisión de numeración ADR-017 (corregida ya).** La propuesta de
supporters reservaba ADR-017, pero `DECISIONS.md` asignó ese número el
2026-07-01 a "matices de evidencia RAG". La decisión de supporters pasa a ser
**ADR-018**; ambos documentos quedaron corregidos en esta sesión. Relacionado:
el orden de las entradas en `DECISIONS.md` no es monotónico
(017, 016 … 001, 002 … 010, 009, 008, 007), lo que hace fácil repetir número.
Fix propuesto: ordenar de más reciente a más antiguo de una vez, o anotar en la
cabecera "siguiente número libre: 019".

**2.2 · Tres patrones distintos de conexión a la misma `auth.sqlite`.**
`lib/audit.ts` usa singleton de módulo con WAL + `synchronous NORMAL`;
`lib/invitations.ts` abre y cierra conexión por llamada; `lib/billing.ts` abre
por llamada **sin cerrar** en varias rutas y con estilo tipográfico distinto
(comillas simples, sin punto y coma). Funciona porque better-sqlite3 es
robusto, pero es el tipo de divergencia que acaba en fugas de file handles y en
dudas de "cuál es el patrón bueno". Fix propuesto: un `lib/auth-db.ts` con el
singleton por ruta (el patrón que ya usa el nuevo `lib/data-access.ts`) y
migrar los tres módulos.

**2.3 · `lib/billing.ts` lee `process.env` directamente** en vez de
`getEnv()`: `process.env.AUTH_DB_PATH ?? path.join(process.env.DATA_ROOT ?? './data', …)`.
Se salta la validación zod y, más grave, la resolución de rutas relativas
respecto al `.env` que hace `env.ts` (`resolveConfiguredPath`). Con un cwd
distinto, billing podría abrir **otro** fichero sqlite que el resto de la app.
Fix: usar `getEnv().AUTH_DB_PATH` como todos los demás módulos.

**2.4 · `app/api/export/route.ts` construye el layout de datos a mano**
(`path.join(DATA_ROOT, "users", userId)`) en vez de derivar de
`userMemoryDir()`. Si el layout cambia, el export queda silenciosamente
desincronizado. Está ahora vigilado: es la única entrada del allowlist de
`npm run check:data-access` (por decisión deliberada queda fuera del choke
point — el export RGPD es solo de datos propios), pero convendría que tomara
las rutas de `lib/qmd.ts`.

**2.5 · `scripts/test-prakriti.ts` existe pero no está registrado** en
`package.json`, así que nunca corre. Fix: añadir
`"test:prakriti": "node --import tsx scripts/test-prakriti.ts"`.

**2.6 · Tres nombres para la capa de idioma.** `lib/language-contract.ts` es
la fuente, `lib/i18n.ts` la re-exporta casi entera y `lib/locale.ts` añade la
lectura de cookie. No es incorrecto, pero el import varía por fichero según el
gusto del momento. Fix suave: documentar en `i18n.ts` que es la fachada
canónica y que `language-contract` no se importe directo desde `app/`.

**2.7 · Higiene menor de raíz.** `tmp/` no está en `.gitignore` (el resto de
artefactos — `.DS_Store`, `*.m4a`, `videos/` — sí lo están). `infra/Dockerfile.backup`
sugiere por nombre ser una copia obsoleta: confirmar y borrar o renombrar con
propósito.

---

## 3. Código muerto

Exportaciones sin ningún consumidor en `app/`, `lib/`, `components/`,
`scripts/` ni `middleware.ts` (verificado con ts-prune + grep manual de
falsos positivos):

| Símbolo | Ubicación | Nota |
|---|---|---|
| `chatStream` | `lib/llm.ts:184` | Coherente con ADR-010 ("chat sin streaming en Fase 1"). O se borra, o se anota "reservado para Fase 2" |
| `resetRateLimits` | `lib/rate-limit.ts:60` | Parece pensado para tests que nunca lo usaron |
| `CONTENT_LOCALE_DEFINITIONS` | `lib/language-contract.ts:48` | Solo la usa el propio módulo indirectamente |
| `infra/Dockerfile.backup` | `infra/` | Fichero completo, ver §2.7 |

No se borró nada (decisión acordada: solo documentar). Todo lo demás que
ts-prune señalaba eran entry points de Next (pages, route handlers,
`middleware`, `config`) — falsos positivos.

---

## 4. Duplicación

La duplicación real es poca y está concentrada:

**4.1 · Gestión de conexión a `auth.sqlite`** — descrita en §2.2; es a la vez
inconsistencia y duplicación (tres implementaciones de "abrir la BD de auth").

**4.2 · Bloque try/catch de auth idéntico en 4 route handlers**
(`chat`, `curiosity`, `image/[name]`, `upload`): las mismas ~12 líneas mapeando
`UnauthorizedError`→401 y `SubscriptionRequiredError`→402. Fix propuesto: un
helper `withAuthErrors()` en `lib/data-access-guards.ts` que devuelva la
respuesta JSON adecuada; ahora que existe `ForbiddenError` (→403 cuando haya
selector de sujeto), el mapeo centralizado evita que cada ruta lo resuelva
distinto.

**4.3 · Construcción del layout `data/users/<id>`** — export route vs
`userMemoryDir()` (§2.4).

**4.4 · `safeUserId`** estaba definido en `lib/session.ts` y era importado
también por módulos que no tienen nada que ver con la sesión. Resuelto en esta
sesión: vive en `lib/user-id.ts` (módulo sin dependencias) y `session.ts` lo
re-exporta por compatibilidad.

---

## 5. Implementado en esta sesión (ADR-018)

Siguiendo la secuencia §8 de la propuesta, pasos 1–3 (la regla de oro: la
seguridad antes que cualquier UI):

Nuevos: `lib/data-access.ts` (choke point `resolveDataSubject`, tablas
`data_subject`/`data_access_grant`, cubículos y grants), `lib/data-access-guards.ts`
(guardas de ruta), `lib/user-id.ts`, `scripts/test-data-access.ts` (suite de los
7 invariantes de §5.3), `scripts/check-data-access-invariant.ts` (control
automático del invariante 7).

Modificados: `lib/audit.ts` (acciones `data.*`), `lib/flags.ts`
(`SUPPORTER_ACCESS_ENABLED`, apagado por defecto), `lib/session.ts`
(re-export), `package.json` (`test:data-access`, `check:data-access`), las 26
rutas/acciones de datos migradas a `requireDataSubject*(scope)`, y los dos
documentos (`DECISIONS.md` con ADR-018, propuesta actualizada a v0.2).

Verificación: `tsc --noEmit` limpio; `test:data-access` pasa (acceso propio
intacto, fail-closed sin grant, anti-enumeración, jerarquía de scopes,
revocación inmediata, auditoría de todo acceso cruzado, rechazo de ids
inválidos, flag apagado deniega incluso con grant); `check:data-access` en
verde. **Nada cambia para el usuario común**: sin `targetSubjectId` el choke
point devuelve su propio id sin tocar la tabla de grants, y el acceso cruzado
está doblemente cerrado (sin grants en BD y flag apagado).

Recomendación operativa: añadir `check:data-access` y `test:data-access` al
pipeline de CI/pre-deploy junto a las suites existentes.

---

## 6. Recomendación: la solución más viable

**Variante A (cubículos) para el piloto, sobre el choke point genérico ya
implementado, dejando la Variante B como evolución** — es decir, la Variante C
de la propuesta, que era la recomendación preliminar del documento y que este
análisis confirma con dos argumentos de código:

Primero, la Variante A no abre acceso cruzado entre cuentas reales: un
cubículo es una carpeta más cuyo id no posee nadie, así que el invariante del
usuario común queda intacto *por construcción*, no por disciplina. Segundo, la
fontanería existente ya direcciona todo por `userId` explícito con un único
punto de paso, así que el coste real era pequeño (quedó hecho en una sesión) y
el mismo modelo `(actor, sujeto, scope)` cubre la Variante B más adelante solo
añadiendo filas `origin='patient_grant'` — sin volver a tocar las rutas.

Orden de los siguientes pasos (el bloqueante ya no es técnico):

1. **Legal/estatutos (bloqueante, no-código):** estatutos del supporter
   versionados + sección en `GUIA-LEGAL-PILOTO-ALEMANIA.md`. Sin esto el flag
   no debe encenderse con datos reales.
2. **Invitación de supporter:** `invitation_kind` y `sponsor_user_id` en
   `registration_invitation`, `userType` vía `additionalFields` de BetterAuth
   (mismo patrón que `consentVersion`). MFA para supporters (ADR-009).
3. **UI mínima del supporter:** alta de cubículo (ya existe
   `createCubicle()`) y selector de contexto que pase `targetSubjectId` a las
   guardas; mapear `ForbiddenError`→403 en los route handlers.
4. **Piloto cerrado** con supporters semilla aprobados a mano; encender
   `SUPPORTER_ACCESS_ENABLED` solo ahí.
5. **(Evolución) Variante B:** consentimiento y revocación desde la cuenta del
   paciente; el choke point no necesita cambios.
