# Auditoría VitaMap — 2 de julio de 2026

Alcance: estructura del monorepo, `apps/web` (código, API, auth, cifrado), `infra/` (Docker, Caddy), dependencias, tests y documentación. No incluye pentest ni revisión legal.

## Valoración general

El proyecto está en un estado notablemente sólido para su fase (piloto de 3 usuarios). Los puntos fuertes son reales y poco habituales: aislamiento de datos por usuario en filesystem con borrado trivial (RGPD), audit log con hash chain, cifrado age por usuario derivado de MASTER_KEY, control de suscripción aplicado en servidor, clasificador de crisis previo a la generación, guardrail anti-diagnóstico, rate limiting por usuario, CSP y cabeceras de seguridad en Caddy, secretos fuera de git, y documentación de decisiones (ADRs) y roadmap muy por encima de la media. Las propuestas siguientes son mejoras incrementales, no correcciones de rumbo.

## Propuestas de mejora

### Prioridad alta

**1. Vulnerabilidades en dependencias (`npm audit`: 1 alta, 4 moderadas).**
Afectan a `next` (15.5.19, parcheado en 15.5.20+) y por transitividad a `better-auth` y `postcss`. Ejecutar `npm audit fix` y actualizar `next`, `better-auth`, `better-sqlite3` a las versiones "wanted". Riesgo bajo de rotura (mismas majors).

**2. Backup de SQLite en caliente puede producir copias corruptas.**
El servicio `backup` monta `vitamap_data:ro` y restic copia `auth.sqlite` + índices QMD mientras hay WAL activo. Una restauración podría fallar justo cuando más se necesita. Propuesta: en el script de backup, antes del snapshot ejecutar `sqlite3 auth.sqlite ".backup /data/backup-staging/auth.sqlite"` (o `VACUUM INTO`) y respaldar la copia consistente. Añadir una prueba de restauración periódica documentada.

**3. MFA antes de datos reales.**
Ya está en el README como hito pendiente. Con datos de salud Art. 9 RGPD, TOTP o passkey con flujo de recuperación probado debería ser bloqueante para el alta del primer usuario real, no solo un "próximo hito". BetterAuth trae plugin TOTP; el coste es bajo.

**4. Validación de MIME/tipo en el upload, no solo en OCR.**
`/api/upload` acepta cualquier fichero ≤10 MB; el tipo solo se rechaza después, en la fase de OCR. Se cifra y almacena basura arbitraria y el error llega tarde al usuario. Validar en el endpoint contra una allowlist (PDF, PNG, JPEG, WebP) comprobando magic bytes, no solo `file.type` (controlado por el cliente).

### Prioridad media

**5. Contenedor `web` corre como root.**
`Dockerfile.web` no tiene directiva `USER`. Añadir un usuario sin privilegios (patrón estándar `node`/`nextjs` del template de Next standalone) y ajustar permisos de `/data`. Reduce el impacto de cualquier RCE en la app.

**6. Sin CI.**
No hay `.github/workflows`. Existen ~15 scripts de test propios (`test:invitations`, `test:billing`, `test:crisis`…) más `lint`, `typecheck` y `kb:check`, pero nada los ejecuta automáticamente. Un workflow mínimo (install → typecheck → lint → suite de tests deterministas → `npm audit --omit=dev`) en cada push protegería contra regresiones sin coste operativo.

**7. Consolidar tests en un runner estándar.**
Los scripts tsx funcionan, pero sin assertions agregadas, sin informe de fallos unificado y sin cobertura. Migrar progresivamente a `vitest` (o `node:test`) manteniendo los scripts que requieren LLM vivo como suite separada "integración". Facilita el punto 6.

**8. Rotación de MASTER_KEY sin re-cifrado posible.**
La passphrase age se deriva de `MASTER_KEY + userId`; rotar la clave invalida todos los ficheros cifrados. Propuesta: envelope encryption — clave aleatoria por usuario, cifrada con MASTER_KEY y guardada junto a los datos. Rotar pasa a ser re-cifrar N claves pequeñas, no N gigabytes de documentos. Vale la pena hacerlo antes de que haya volumen.

**9. Timeout de chat de 300 s.**
`AbortSignal.timeout(300_000)` por petición con 10 req/min/usuario permite acumular muchas generaciones concurrentes en un CCX13 de 4 vCPU. Considerar un límite de concurrencia global (semáforo simple, 1–2 generaciones simultáneas con cola) además del rate limit por usuario.

**10. Higiene del repositorio.**
Conviven en el repo artefactos que no son código: `textToAudio/` (m4a de 30+ MB sin trackear pero en el árbol), `videos/`, `.agents/`, `skills-lock.json`, `.DS_Store` en varios directorios y ficheros de visión (`VitaWende-*.txt`) mezclados con documentación técnica. Propuesta: mover audio/vídeo/material de estudio fuera del repo (o a un directorio `media/` ignorado), añadir `.DS_Store` ya está en gitignore pero limpiar los existentes, y separar `docs/` en `docs/adr`, `docs/legal`, `docs/vision`.

### Prioridad baja

**11. Middleware: cookie sin verificar como única barrera Edge.**
El diseño (verificación real en `requireUserId()` por ruta) es correcto, pero depende de que ningún endpoint olvide la llamada. Un test que recorra todas las rutas protegidas sin sesión y espere 401/redirect convertiría esa convención en garantía.

**12. Dependencias con major nuevo pendiente de decisión.**
`zod` 4, `pdfjs-dist` 6, `react-markdown` 10, `eslint` 10, `next` 16. No urgente; anotar en DECISIONS.md cuáles se adoptan y cuándo, para que no se acumule salto doble de major.

**13. CSP con `unsafe-inline` en scripts.**
Limitación conocida de Next sin nonces. Cuando se toque Caddy, evaluar el modo nonce de Next 15+ (`experimental.sri` / cabeceras por request) para eliminar `unsafe-inline` de `script-src`.

**14. Falta LICENSE y aviso de salud en un único lugar canónico.**
No hay fichero LICENSE (aunque sea propietario, declararlo). El disclaimer educativo aparece en README, UI y docs; definir la versión canónica y referenciarla desde el resto.

**15. Observabilidad mínima.**
Los logs son `console.*` sueltos. Para el piloto basta, pero un logger estructurado (pino) con requestId por petición haría diagnosticables los incidentes con usuarios reales sin coste apreciable.

## Resumen priorizado

| # | Propuesta | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | Parchear next/better-auth (audit fix) | Bajo | Alto |
| 2 | Backup consistente de SQLite | Bajo | Alto |
| 3 | MFA bloqueante pre-piloto | Medio | Alto |
| 4 | Allowlist MIME + magic bytes en upload | Bajo | Medio |
| 5 | USER no-root en Dockerfile.web | Bajo | Medio |
| 6 | CI mínima (GitHub Actions) | Bajo | Medio |
| 7 | Migrar tests a vitest | Medio | Medio |
| 8 | Envelope encryption para rotación de clave | Medio | Medio |
| 9 | Semáforo global de generaciones LLM | Bajo | Medio |
| 10 | Higiene del repo (media, docs) | Bajo | Bajo |
| 11 | Test de rutas protegidas sin sesión | Bajo | Medio |
| 12–15 | Majors pendientes, CSP nonce, LICENSE, logging | Bajo | Bajo |

---

## Ruta a la fase de 3 usuarios con datos reales (go-live)

Esta auditoría cubre **solo código, infraestructura y dependencias**. El paso a
"3 primeros usuarios con datos reales" no depende únicamente de cerrar los 15
puntos de arriba: es la **Etapa B** de `GUIA-LEGAL-PILOTO-ALEMANIA.md` (§3), la
primera etapa "legalmente real", y no se abre hasta cerrar en paralelo **tres
frentes** y obtener una **autorización por escrito**. Ningún dato de salud real
(Art. 9 RGPD) entra antes de eso; hasta entonces solo se usan perfiles y
documentos sintéticos.

Los tres frentes son:

- **Frente A — Cierre técnico** (este audit + P0 técnicos): código e infra.
- **Frente B — Verificación en el VPS**: confirmar que producción ejecuta lo
  esperado y que backup/restauración, aislamiento y borrado funcionan de verdad.
- **Frente C — Puerta legal y regulatoria**: fuera del alcance de esta auditoría,
  pero **bloqueante**. Requiere revisión profesional (no es asesoría que este
  documento pueda dar).

> **Regla de oro** (guía legal §1): primero definir el límite del producto →
> documentar el tratamiento → implementar y probar las garantías → **solo
> entonces** aceptar el primer dato de salud real.

### Frente A — Cierre técnico (mapa de este audit a las puertas)

Reclasificación de los 15 puntos según su papel en el go-live. "Bloqueante"
significa que debería cerrarse **antes** del primer dato real; "recomendado"
significa antes de los usuarios 2 y 3; "posterior" puede seguir tras abrir.

| # | Propuesta | Rol en go-live | Definición de hecho (evidencia) |
|---|-----------|----------------|----------------------------------|
| 3 | **MFA bloqueante** (TOTP/passkey + recuperación) | 🔴 Bloqueante | Alta, recuperación, dispositivo perdido y revocación probados. Coincide con guía legal §8-P0 y guía operativa §B-2 |
| 4 | **Allowlist MIME + magic bytes en `/api/upload`** | 🔴 Bloqueante | Fichero no permitido se rechaza en el endpoint (no tras OCR); test con PDF/PNG/JPEG/WebP válidos e inválidos |
| 1 | **Parchear `next`/`better-auth` (`npm audit fix`)** | 🔴 Bloqueante | `npm audit --omit=dev` sin altas/moderadas; build de producción verde |
| 2 | **Backup consistente de SQLite** (`.backup`/`VACUUM INTO` antes del snapshot) | 🔴 Bloqueante | Restauración de un snapshot reciente abre sin corrupción; simulacro documentado |
| — | **Verificación de email y recuperación** (Brevo) | 🔴 Bloqueante | Envío real desde producción sin revelar existencia de cuentas (guía legal §8-P0) |
| — | **Módulos amarillos apagados por defecto** | 🔴 Bloqueante | `ASSESSMENTS_ENABLED`, `ASSISTANT_EDU_GUIDE`, `KB_MARKER_SCOPE`, `RETRIEVAL_DEBUG` = `false` en el `.env` del VPS |
| 5 | **`USER` no-root en `Dockerfile.web`** | 🟡 Recomendado | Contenedor `web` corre como usuario sin privilegios; `/data` con permisos ajustados |
| 11 | **Test de rutas protegidas sin sesión** | 🟡 Recomendado | Suite que recorre rutas protegidas y espera 401/redirect |
| 9 | **Semáforo global de generaciones LLM** | 🟡 Recomendado | Límite de concurrencia (1–2) + cola; probado bajo carga en el CCX de 4 vCPU |
| 6 | **CI mínima (GitHub Actions)** | 🟡 Recomendado | Workflow install→typecheck→lint→tests→`npm audit` en cada push |
| 8 | **Envelope encryption** (rotación sin re-cifrar N GB) | 🟢 Posterior (antes de volumen) | Clave por usuario cifrada con MASTER_KEY; rotación probada |
| 7 | **Migrar tests a vitest/`node:test`** | 🟢 Posterior | Runner unificado con assertions y cobertura |
| 10 | **Higiene del repo** (media/docs fuera) | 🟢 Posterior | `textToAudio/`, `videos/`, `.DS_Store` fuera del árbol; `docs/` separado |
| 12–15 | Majors pendientes, CSP nonce, LICENSE, logging estructurado | 🟢 Posterior | Anotados en `DECISIONS.md`; pino con requestId para incidentes con usuarios reales |

Además, dos garantías que la propia arquitectura recomienda reforzar antes de
datos reales (guía legal §8, "Observaciones"): **anclar periódicamente el hash
final de auditoría fuera del VPS** (la cadena detecta cambios pero no es
inviolable si se controla la base) y confirmar que el **borrado de cuenta cubre
originales, derivados, índices, inbox y temporales de OCR**, no solo el
directorio principal.

### Frente B — Verificación en el VPS

La guía operativa §B mantiene un bloque `[VERIFICAR EN VPS]` que sigue abierto.
No basta con que el código esté en `main`: hay que confirmar que producción lo
ejecuta y que las garantías funcionan de extremo a extremo. Puntos a cerrar,
cada uno con su evidencia:

1. `/opt/vitamap-next` en el commit esperado de `main`, árbol limpio.
2. `infra/.env` contiene las variables nuevas (`ADMIN_EMAILS`, `BREVO_*`,
   `EMAIL_*`, los cuatro flags de módulo, `COMPOSE_PROFILES`, `LLM_PROVIDER`).
3. `/admin/corpus` abre para el administrador y da 404 a una cuenta normal.
4. Verificación de email y recuperación funcionan con Brevo desde producción.
5. Firewall, SSH restringido y política de actualización del SO.
6. Cifrado de disco (LUKS) y custodia de claves verificados con un reinicio real.
7. Backups cifrados en región UE **y restauración real comprobada** (liga con
   audit #2).
8. Aislamiento entre usuarios, logs de auditoría y borrado de cuenta probados de
   extremo a extremo, **solo con datos sintéticos**.
9. Sustituir credenciales personales de GitHub CLI en `root` por un mecanismo de
   despliegue de solo lectura.
10. Confirmar en Stripe la fecha e importe neto del primer payout al IBAN.
11. Completar el reintento del PDF sintético tras desplegar la corrección del
    worker de `pdfjs-dist`.

Los comandos para levantar el estado actual y cerrar estos puntos están en la
sección **"Comandos de verificación del VPS"** más abajo.

### Frente C — Puerta legal y regulatoria (bloqueante, fuera de código)

Resumen de `GUIA-LEGAL-PILOTO-ALEMANIA.md` §8-P0 y §9. Estos puntos **no son
código** y son los que realmente autorizan la Etapa B. No avanzar sin las
revisiones profesionales de la guía §7:

- Identidad empresarial/fiscal resuelta antes del primer cobro real
  (`Gewerbeamt`/`Finanzamt`, regla §19 UStG, facturación).
- **Finalidad prevista** firmada módulo a módulo e **informe de clasificación
  MDR** por un especialista (escalas PHQ/GAD, clasificador de crisis,
  interpretación de analíticas y correlaciones son los puntos calientes).
- **DSFA/DPIA** terminada y versionada; **Registro Art. 30**; decisión escrita
  sobre necesidad de **DPO** (§38 BDSG).
- **Privacidad, Impressum, condiciones y desistimiento** publicados y revisados.
- **Consentimiento** con responsable y proveedores reales (Hetzner, Backblaze,
  Stripe, Revolut, DNS/correo) — no puede decir "destinatarios: ninguno" — con
  mecanismo de reconsentimiento.
- **Botón de cancelación §312k BGB** separado del borrado de datos, con
  confirmación en soporte duradero.
- **Contratos de encargo Art. 28** con los proveedores que correspondan.
- **Procedimiento de brechas de 72 h** con simulacro de mesa y contactos.
- Nota de **alfabetización en IA** (Art. 4 del Reglamento de IA).

### Secuencia de puertas (qué habilita qué)

```text
Puerta 0  [AHORA]      Solo datos sintéticos. Admin en solitario.
    │  cierra Frente A bloqueante (#1,#2,#3,#4, email, flags) en main + tests verdes
    ▼
Puerta 1  Técnica       Código P0 fusionado y probado localmente.
    │  despliegue al VPS + bloque Frente B verificado (commit, .env, /admin/corpus)
    ▼
Puerta 2  Producción    Backup/restauración, aislamiento, borrado, MFA y email
    │                    probados de extremo a extremo EN EL VPS (sintéticos).
    │  paquete legal completo + firmas profesionales (Frente C)
    ▼
Puerta 3  Legal          DSFA, MDR, privacidad/consentimiento, §312k resueltos.
    │  48 h de observación técnica sin errores (guía operativa §B-7)
    ▼
Puerta 4  Autorización   Autorización por escrito del piloto de 3 personas.
    │
    ▼
Puerta 5  Invitaciones   Generar invitaciones nominativas de voluntarios 2 y 3
                         (guía operativa §C.7). Sesión informativa + consentimiento
                         versionado por persona. Recién aquí entran datos reales.
```

El administrador (voluntario 1 / la semilla) ya tiene cuenta y pago LIVE, pero
sigue en Puerta 0: hasta cruzar la 4 opera **solo con material sintético**.

### Comandos de verificación del VPS

Para poder afinar esta ruta con el estado real de la App, ejecutar en el VPS y
guardar las salidas. Ninguno modifica datos; son de solo lectura. Todos, salvo
los de sistema, se lanzan desde `/opt/vitamap-next/infra`.

```bash
ssh root@<IP del VPS>

# --- 1. Despliegue y salud ---
cd /opt/vitamap-next
git rev-parse --short HEAD          # commit desplegado
git status --short                  # debe estar limpio (salvo infra/.env)
cd infra
docker compose --env-file .env ps   # estado y health de caddy/web/backup/llm
curl -fsS https://vitamap.marcomano.org/api/health   # status, version, phase, audit_chain

# --- 2. Flags de módulos y variables clave (nombres/valores no secretos) ---
grep -E '^(ASSESSMENTS_ENABLED|ASSISTANT_EDU_GUIDE|KB_MARKER_SCOPE|RETRIEVAL_DEBUG|COMPOSE_PROFILES|LLM_PROVIDER|NODE_ENV)=' \
  /opt/vitamap-next/infra/.env
# Solo nombres de claves presentes (sin exponer secretos):
grep -E '^[A-Z0-9_]+=' /opt/vitamap-next/infra/.env | cut -d= -f1 | sort

# --- 3. Versiones y seguridad (audit #1 y #5) ---
docker compose --env-file .env exec web sh -c \
  'node -e "console.log(require(\"next/package.json\").version)"' 2>/dev/null || \
  grep '"next"' /opt/vitamap-next/apps/web/package.json
grep -i '^USER' /opt/vitamap-next/infra/Dockerfile.web || echo "Dockerfile.web SIN USER (corre como root)"

# --- 4. Backups: existen, íntegros y restaurables (audit #2) ---
docker compose --env-file .env exec backup restic snapshots
docker compose --env-file .env exec backup restic check

# --- 5. Datos, aislamiento y auditoría (deben ser solo sintéticos aún) ---
docker compose --env-file .env exec web sh -c \
  "sqlite3 /data/auth.sqlite 'SELECT id,email,createdAt FROM user;'"
docker compose --env-file .env exec web sh -c \
  "sqlite3 /data/auth.sqlite 'SELECT actor,action,subject_id,ts FROM audit_event ORDER BY ts DESC LIMIT 20;'"
docker compose --env-file .env exec web sh -c \
  "sqlite3 /data/auth.sqlite 'SELECT user_id,status,current_period_end,updated_at FROM billing_subscription;'"

# --- 6. Sistema, red y cifrado (Frente B: 5, 6) ---
df -h / ; free -h ; uptime
lsblk -o NAME,FSTYPE,MOUNTPOINT      # buscar tipo 'crypt' = LUKS activo
ufw status verbose 2>/dev/null || iptables -L -n | head
grep -E '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config
```

Con esas salidas puedo decir con precisión qué queda de la Puerta 1 y 2, si los
flags están cerrados, si `next` está en la versión parcheada, si el contenedor
`web` corre como root y si backup/restauración están realmente operativos.

> Alcance: este anexo ordena y prioriza tareas técnicas y señala las puertas
> legales; **no constituye asesoría jurídica ni autoriza el piloto**. La
> apertura de la Etapa B exige las revisiones profesionales de
> `GUIA-LEGAL-PILOTO-ALEMANIA.md` §7.
