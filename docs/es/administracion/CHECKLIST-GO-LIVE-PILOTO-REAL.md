# Checklist de autorización — piloto de 3 usuarios con datos reales

> ## ⏸ PILOTO EN PAUSA desde 2026-08-13
>
> **Por qué.** El piloto con datos reales exige, además del cierre técnico, un
> paquete legal completo (frente C: catorce casillas, firmas profesionales,
> DSFA, análisis MDR) que una sola persona no puede cerrar con seriedad. Se
> pausa hasta contar con colaboradores que ayuden a completar el corpus y a
> cerrar ese frente.
>
> **Qué NO significa.** Ninguna casilla se rebaja ni se da por buena. Las seis
> puertas siguen exactamente igual de cerradas, y ningún dato de salud real
> entra hasta cruzarlas. Pausar no es relajar.
>
> **Qué se hace mientras tanto.** La instancia se despliega en modo
> demostración (`DEMO_MODE=true`, ver `lib/flags.ts` y ADR-020): datos
> sintéticos de solo lectura, sin subida, sin registro y sin cobro. Ese modo no
> toca ninguna de estas casillas porque no procesa datos de salud reales de
> nadie; su cometido es enseñar la arquitectura, no prestar un servicio.
>
> **Cómo se reanuda.** Se apaga `DEMO_MODE`, se retoma este checklist por donde
> está y se continúa con la Puerta 0. No hace falta deshacer nada: el modo
> demostración es configuración, no una variante del código.

Estado: documento vivo de seguimiento · creado 2026-07-02 · **pausado 2026-08-13**
Deriva de: `AUDITORIA-2026-07-02.md` (anexo go-live), `GUIA-LEGAL-PILOTO-ALEMANIA.md`
(§8-P0, §9) y `PILOTO-FASE1-GUIA-OPERATIVA.txt` (§B).

> **Regla:** ninguna casilla se marca por intención. Cada una enlaza a una
> **evidencia** concreta (test verde, captura, comando con su salida, documento
> firmado). Ningún dato de salud real **de terceros** entra hasta cerrar
> A + B + C y cruzar la Puerta 4 (autorización escrita).

### Excepción registrada: datos del propio operador · 2026-08-13

El operador (administrador y, por ahora, única cuenta) **sí sube analíticas
propias reales**, asumiendo el riesgo de forma consciente. Queda anotado aquí
para que este documento no diga una cosa mientras la instancia contiene otra.

**Por qué se admite.** Sujeto de los datos, responsable del tratamiento y
persona que asume el riesgo son la misma. Las obligaciones que bloquean el
piloto —DSFA, registro Art. 30, contratos Art. 28, informe MDR, consentimiento
versionado— existen para proteger a terceros; con datos propios no hay tercero
a quien proteger. La regla de arriba se lee, por tanto, referida a **datos de
terceros**.

**Para qué.** Afinar la recuperación contra un caso realista: comprobar que el
asistente encuentra la tarjeta adecuada ante un valor real, que la serie
temporal se construye bien con laboratorios y unidades auténticos, y que el
guardrail se comporta ante una pregunta personal de verdad. **No amplía el
corpus compartido**: la memoria personal (`data/users/<id>/memory`) y la
biblioteca del RAG (`data/kb`) son almacenes distintos.

**Riesgos aceptados, en concreto.**

| Riesgo | Estado | Referencia |
|---|---|---|
| **Sin MFA.** Una contraseña filtrada da acceso completo a los datos de salud del operador | 🔴 abierto | ADR-009, Frente A #3 |
| **Sin cifrado en reposo.** La memoria queda en markdown en claro y los índices en SQLite sin cifrar; un snapshot del proveedor los expondría. Los PDF originales sí van cifrados con age | Diferido a Fase 2 | ADR-015 |
| **Borrado con residuos sin verificar.** No hay simulacro que confirme que no quedan restos en índices, inbox y temporales de OCR | 🔴 abierto | Frente A |

Los backups **no** están entre los riesgos: restic cifra en cliente antes de
subir a la Storage Box.

**Qué NO habilita esta excepción.** No abre la puerta a datos de ninguna otra
persona, ni adelanta ninguna casilla, ni cambia el estado de las puertas. Al
reanudar el piloto, la primera pregunta es si estos datos se conservan o se
purgan antes de admitir a nadie más.

**Revisión.** Al cerrar MFA (Frente A #3), releer esta excepción: parte de su
motivo desaparece.

Leyenda de estado: `[ ]` pendiente · `[~]` en curso · `[x]` cerrado con evidencia.
Prioridad: 🔴 bloqueante pre-dato-real · 🟡 antes de voluntarios 2/3 · 🟢 posterior.

---

## Frente A — Cierre técnico (código e infra)

| ✔ | Pri | # | Tarea | Definición de hecho / evidencia | Estado |
|:--:|:--:|:--:|---|---|---|
| [ ] | 🔴 | 3 | MFA (TOTP/passkey) + recuperación | Alta, recuperación, dispositivo perdido y revocación probados | |
| [ ] | 🔴 | 4 | Allowlist MIME + magic bytes en `/api/upload` | Fichero no permitido rechazado en el endpoint; test PDF/PNG/JPEG/WebP válidos e inválidos | |
| [x] | 🔴 | 1 | Parchear `next`/`better-auth`/`better-sqlite3` | `npm audit --omit=dev` sin altas/moderadas; build de producción verde | ✅ 07-02: high (next) resuelto → 15.5.20 desplegado; 3 transitivas (postcss/js-yaml/hono) aceptadas como no-explotables |
| [ ] | 🔴 | 2 | Backup consistente de SQLite (`.backup`/`VACUUM INTO`) | Restauración de snapshot reciente abre sin corrupción; simulacro documentado | |
| [ ] | 🔴 | — | Verificación de email + recuperación (Brevo) | Envío real desde producción sin revelar existencia de cuentas | |
| [x] | 🔴 | — | Módulos amarillos apagados por defecto | `ASSESSMENTS_ENABLED`/`ASSISTANT_EDU_GUIDE`/`KB_MARKER_SCOPE`/`RETRIEVAL_DEBUG`=`false` | ✅ 07-02: los 4 en `false` en el VPS |
| [ ] | 🔴 | — | Anclaje externo del hash de auditoría | Hash final anclado periódicamente fuera del VPS | |
| [ ] | 🔴 | — | Borrado cubre originales+derivados+índices+inbox+temporales OCR | Simulacro de borrado sin residuos verificado | |
| [x] | 🟡 | 5 | `USER` no-root en `Dockerfile.web` | Contenedor `web` como usuario sin privilegios; `/data` con permisos ajustados | ✅ Ya resuelto vía `setpriv`→`node` en el entrypoint (falso positivo del audit) |
| [ ] | 🟡 | 11 | Test de rutas protegidas sin sesión | Suite recorre rutas protegidas y espera 401/redirect | |
| [ ] | 🟡 | 9 | Semáforo global de generaciones LLM | Límite de concurrencia (1–2) + cola; probado bajo carga | |
| [ ] | 🟡 | 6 | CI mínima (GitHub Actions) | Workflow install→typecheck→lint→tests→`npm audit` en cada push | |
| [ ] | 🟢 | 8 | Envelope encryption (rotación de clave) | Clave por usuario cifrada con MASTER_KEY; rotación probada | |
| [ ] | 🟢 | 7 | Migrar tests a vitest/`node:test` | Runner unificado con assertions y cobertura | |
| [x] | 🟢 | 10 | Higiene del repo (media/docs fuera) | `textToAudio/`, `videos/`, `.DS_Store` fuera del árbol; `docs/` separado | ✅ 08-13: `textToAudio/` sin versionar; corpus de tarjetas y tooling editorial externo fuera del repo público, con el historial reescrito (`git filter-repo`) |
| [ ] | 🟢 | 12–15 | Majors, CSP nonce, LICENSE, logging pino | Anotados en `DECISIONS.md`; logger estructurado con requestId | |

---

## Frente B — Verificación en el VPS

Cada punto se cierra con la salida del comando correspondiente (ver
`AUDITORIA-2026-07-02.md` → "Comandos de verificación del VPS").

| ✔ | Tarea | Evidencia (comando/salida) | Estado |
|:--:|---|---|---|
| [x] | `/opt/vitamap-next` en el commit esperado de `main`, árbol limpio | `git rev-parse --short HEAD` + `git status --short` | ✅ 07-02: 9914e0d == origin/main, 0/0, limpio |
| [ ] | `infra/.env` con todas las variables nuevas | `grep '^[A-Z0-9_]\+=' infra/.env \| cut -d= -f1` | |
| [x] | Flags de módulo cerrados en producción | `grep -E '^(ASSESSMENTS_ENABLED\|ASSISTANT_EDU_GUIDE\|KB_MARKER_SCOPE\|RETRIEVAL_DEBUG)=' infra/.env` | ✅ 07-02: los 4 en `false` (backup .env.bak); web reiniciado. Verificar en UI que no salen assessments |
| [~] | `/admin/corpus` abre para admin y da 404 a cuenta normal | Prueba manual con dos cuentas | 07-02: sin sesión → 307 (OK); ADMIN_EMAILS=2 correos; falta test cuenta no-admin |
| [x] | Email de verificación y recuperación funcionan desde producción | Prueba con usuario de test | ✅ 07-02: no-enumeración OK; Brevo Enviado→Entregado→Abierto 13:31. Nota P1: log ERROR registra el email consultado |
| [x] | Autenticar dominio de correo en Brevo (SPF/DKIM/DMARC) | Dominio "Authenticated" en Brevo + registros en Cloudflare | ✅ 07-02: DKIM 1/2 y DMARC (p=none) publicados y verificados con `dig`. Pendiente opcional: SPF explícito + subir DMARC a quarantine |
| [~] | Entrega a bandeja de entrada (no spam) | Reputación de remitente / warm-up | 07-02: primer correo cayó en spam (Yahoo, dominio nuevo). Marcar "no spam" + calentamiento; desactivar tracking de apertura (RGPD) |
| [~] | Firewall, SSH restringido y política de actualización del SO | `ufw status` + `sshd_config` (PermitRootLogin/PasswordAuthentication) | 07-02: UFW OK (22/80/443); SSH sin endurecer (defaults) |
| ❌ | Cifrado de disco (LUKS) verificado con reinicio real | `lsblk -o NAME,FSTYPE,MOUNTPOINT` (tipo `crypt`) + acta de reinicio | 🔴 07-02: sin capa crypt, sda1 ext4 plano |
| [~] | Backups cifrados UE **y restauración real comprobada** | `restic snapshots` + `restic check` + simulacro de restore | 07-02: 58 snapshots, check OK; falta restore real + audit #2 |
| [ ] | Aislamiento, logs de auditoría y borrado probados extremo a extremo (sintéticos) | Tests de acceso cruzado + `audit_event` + simulacro de borrado | 07-02: audit_event coherente; falta test aislamiento y borrado |
| [ ] | Credenciales GitHub CLI en `root` sustituidas por despliegue de solo lectura | Sesión cerrada / deploy key de solo lectura | |
| [ ] | Primer payout Stripe → IBAN confirmado (fecha e importe neto) | Captura del dashboard de Stripe | |
| [ ] | Reintento del PDF sintético tras corrección del worker `pdfjs-dist` | 11 marcadores extraídos correctamente | |
| [x] | `next` en versión parcheada en el contenedor desplegado | salida de versión de `next` en `web` | ✅ 07-02: desplegado 15.5.20 (docker top: next-server v15.5.20, UID 1000), healthy, sin errores better-auth. Tests invitations/billing/auth-email verdes |
| [x] | Contenedor `web` NO corre como root | `docker compose top web` | ✅ 07-02: Dockerfile baja a usuario `node` (uid 1000) vía `setpriv` en el entrypoint (no usa directiva USER). El audit #5 fue falso positivo. Confirmar con `docker top` |
| [x] | Solo cuentas sintéticas en la BD antes de la Puerta 4 | `SELECT id,email FROM user;` | ✅ 07-02: solo admin (igorcapote@yahoo.com) |

---

## Frente C — Puerta legal y regulatoria (bloqueante, fuera de código)

Requiere las revisiones profesionales de `GUIA-LEGAL-PILOTO-ALEMANIA.md` §7.
Este documento no es asesoría jurídica.

### Legal y organización

- [ ] Operador, dirección, contacto y forma jurídica definidos
- [ ] Alta comercial/fiscal resuelta antes del primer cobro (`Gewerbeamt`/`Finanzamt`, §19 UStG)
- [ ] Seguro de responsabilidad/ciber evaluado
- [ ] Finalidad prevista de VitaMap firmada (módulo a módulo)
- [ ] Informe MDR revisado por especialista (escalas, crisis, interpretación de analíticas)
- [ ] DSFA/DPIA terminada y riesgo residual aceptado
- [ ] Necesidad de DPO resuelta por escrito (§38 BDSG)
- [ ] Registro Art. 30 terminado
- [ ] Contratos de encargo Art. 28 y proveedores revisados (Hetzner, Backblaze, Stripe, Revolut, DNS/correo)
- [ ] Privacidad, consentimiento, Impressum y condiciones publicados
- [ ] Consentimiento con responsable y proveedores reales + mecanismo de reconsentimiento
- [ ] Botón de cancelación §312k BGB separado del borrado, con confirmación en soporte duradero
- [ ] Derecho de desistimiento (§355 BGB) probado
- [ ] Procedimiento de brechas de 72 h con simulacro y contactos
- [ ] Nota de alfabetización en IA (Art. 4 Reglamento de IA)

---

## Frente D — Con los tres participantes (Puerta 5)

- [ ] Invitación individual nominativa y sesión informativa
- [ ] Explicación de límites y posibles errores de IA
- [ ] Consentimiento libre, explícito y versionado por persona
- [ ] Canal humano para dudas, retirada e incidentes
- [ ] Confirmación contractual y recibo
- [ ] Recordatorio de no usar VitaMap para urgencias
- [ ] Fecha de inicio y fin del piloto acordadas
- [ ] Entrevista final y borrado/exportación elegidos por cada persona

---

## Puertas (resumen de avance)

- [ ] **Puerta 0** — Solo datos sintéticos; Frente A bloqueante en `main` + tests verdes
- [ ] **Puerta 1** — Despliegue al VPS + bloque Frente B verificado
- [ ] **Puerta 2** — Backup/restauración, aislamiento, borrado, MFA y email probados en VPS
- [ ] **Puerta 3** — Paquete legal completo con firmas profesionales (Frente C)
- [ ] **Puerta 4** — 48 h de observación sin errores + **autorización por escrito**
- [ ] **Puerta 5** — Invitaciones de voluntarios 2 y 3 → entran datos reales

> Progreso técnico rápido: A-bloqueantes ▢▢▢▢▢▢▢▢ · B ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢ · C ▢▢…
> (actualizar los recuadros al cerrar cada fila).

---

## Log de verificación del VPS

### 2026-07-02 — bloque 1 (despliegue y salud)

Confirmado:
- Contenedores `caddy` (Up 12 d), `web` (Up 19 h, **healthy**) y `backup`
  (Up 19 h) en marcha.
- `/api/health` → `status:ok`, `version:0.1.0`, `phase:0`, **`audit_chain:ok`**,
  ts actual. La cadena de auditoría está íntegra.

⚠️ Hallazgos abiertos:
- **Falta el contenedor `llm`** (`vitamap-llm-1`). Con `COMPOSE_PROFILES=local-llm`
  debería estar arriba. Verificar bloque 2: si `LLM_PROVIDER=external`, el chat
  usa un proveedor fuera del VPS → bandera regulatoria (ADR-014/consentimiento).
  Si es `local`, el servicio no arrancó y el chat no tiene motor.
- **`phase:0`** en el health: confirmar que es el valor esperado para el piloto.

Pendiente de recibir: bloques 2 (flags/env), 3 (versiones/USER), 4 (backups),
5 (datos/aislamiento), 6 (sistema/red/cifrado).

### 2026-07-02 — bloques 2–6 (verificación completa)

**🔴 Bloqueantes detectados (impiden datos reales):**

1. ~~**Módulos amarillos ABIERTOS.**~~ **✅ RESUELTO 07-02.** `ASSESSMENTS_ENABLED`
   y `KB_MARKER_SCOPE` pasados a `false` (los 4 flags cerrados, backup `.env.bak`,
   web reiniciado). Escalas PHQ/GAD desactivadas.
2. **LLM externo.** `LLM_PROVIDER=external`, `COMPOSE_PROFILES=` (vacío) → el chat
   envía prompt + contexto RAG (potencialmente Art. 9) a un tercero.
   **DECISIÓN 07-02: se mantiene external** (no local) — ya cubierto por **ADR-014**.
   Proveedor verificado: **Mistral AI (FR/UE), `mistral-small-latest`**. El chat
   envía memoria personal Art. 9 en hasta 5 pasadas/turno (ver auditoría del
   código). Válido para fase sintética. Para datos reales, condiciones (→ Frente C,
   borradores listos en `BORRADOR-TRANSFERENCIA-LLM-MISTRAL.md`): (a) DPA Art. 28
   con Mistral; (b) ZDR/opt-out por escrito; (c) addendum a ADR-014; (d) cláusula
   de consentimiento; (e) párrafo de privacidad; (f) línea Registro Art. 30 + DSFA.
3. **`next` sin parchear:** versión desplegada **15.5.19** (audit #1; parcheado
   en 15.5.20+). Vulnerabilidad alta aún presente en producción.
4. **Disco SIN cifrar** — pero es **decisión documentada, no olvido: ADR-015**
   difiere LUKS a Fase 2 como riesgo aceptado (mitigado con age, SSH por clave,
   backups cifrados, aislamiento; el consentimiento NO promete cifrado at-rest).
   `sda1` ext4 plano confirmado. Acción pendiente: que la **DSFA acepte
   explícitamente ese riesgo residual** para datos reales (no es tarea técnica
   nueva, es validación legal del ADR-015). Reevaluar en paso a GPU / >10 usuarios.
5. ~~**`billing_subscription` con filas heredadas.**~~ **✅ RESUELTO 07-02.**
   Diagnóstico: 3 filas = 1 LIVE (rowid 3, `livemode=1`, con eventos reales) + 2
   TEST (`livemode=0`, sin eventos, una con `user_id` vacío). **No había cobro
   múltiple.** Backup `auth-pre-billing-fix-2026-07-02.sqlite` + `DELETE WHERE
   livemode=0` → queda solo la fila LIVE del admin. Vigilancia P1: `period_end`
   2026-06-08 obsoleto, confirmar en próxima renovación / Stripe LIVE.

**🟡 Recomendados antes de abrir:**

6. **`web` corre como root** (`Dockerfile.web SIN USER`) — audit #5, confirmado.
7. **SSH sin endurecer:** `PermitRootLogin`/`PasswordAuthentication` sin línea
   explícita en `sshd_config` (aplican defaults). Fijar `PermitRootLogin
   prohibit-password` y `PasswordAuthentication no`. UFW sí está activo y correcto.
8. **Sin swap** (`Swap: 0B`): si se vuelve a LLM local (~4 GB), añadir swap de
   seguridad. RAM libre hoy 5.6 GB con LLM externo.

**✅ Confirmado en orden:**

- **Backups sólidos:** 58 snapshots + `restic check` → *no errors were found*.
  Repositorio íntegro. (Falta aún: **prueba de restauración real** y el backup
  consistente de SQLite en caliente del audit #2.)
- **Firewall UFW activo:** default deny incoming; solo 22/80/443 abiertos.
- **Solo cuenta admin en la BD** (`igorcapote@yahoo.com`, creada 2026-06-07). No
  hay datos de terceros todavía. `audit_chain: ok` y cadena de auditoría con
  eventos coherentes (kb.publish, chat.query, auth.logout).
- **Holgura de recursos:** disco 23% (33/150 GB), RAM 5.6 GB libre, uptime 23 d,
  carga 0.00.
- **Secretos presentes en `.env`:** ADMIN_EMAILS, BREVO_API_KEY, EMAIL_FROM,
  STRIPE_*, B2_*, RESTIC_*, MASTER_KEY, BETTER_AUTH_SECRET, QMD_EMBED_MODEL.
  (No aparece `EMAIL_REPLY_TO`, opcional; confirmar `BETTER_AUTH_URL`/
  `NEXT_PUBLIC_APP_URL`/`NODE_ENV` si no estaban en el grep.)

**Aún sin verificar:** commit desplegado y árbol limpio (bloque 1 git),
`/admin/corpus` 404 para cuenta normal, envío real de email Brevo desde
producción, payout de Stripe al IBAN, reintento del PDF sintético.
