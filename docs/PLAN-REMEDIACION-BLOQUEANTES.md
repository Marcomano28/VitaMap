# Plan de remediación — bloqueantes pre-datos-reales

Creado 2026-07-02 · deriva de `CHECKLIST-GO-LIVE-PILOTO-REAL.md` (log VPS 07-02).

Orden pensado para ir de lo barato y de bajo riesgo a lo pesado, agrupando
despliegues. Ningún dato de salud real entra hasta cerrar los 🔴 y cruzar la
Puerta 4 (autorización escrita). Los comandos del VPS se ejecutan por SSH; los
de repo, en tu entorno de desarrollo (el VPS compila desde `main`).

Estado de partida (07-02): commit `9914e0d` == `origin/main`, árbol limpio.

---

## Paso 1 · Cerrar flags de módulo 🔴 (5 min, riesgo bajo)

Los módulos amarillos están abiertos. Editar `infra/.env` en el VPS:

```bash
ssh root@<IP del VPS>
cd /opt/vitamap-next/infra
cp .env .env.bak-$(date +%F)          # respaldo antes de tocar
sed -i 's/^ASSESSMENTS_ENABLED=.*/ASSESSMENTS_ENABLED=false/' .env
sed -i 's/^KB_MARKER_SCOPE=.*/KB_MARKER_SCOPE=false/' .env
grep -E '^(ASSESSMENTS_ENABLED|ASSISTANT_EDU_GUIDE|KB_MARKER_SCOPE|RETRIEVAL_DEBUG)=' .env
# Aplicar (recrea el contenedor web con el nuevo entorno):
docker compose --env-file .env up -d web
```

Definición de hecho: los cuatro flags en `false`. Verificar en la UI que
cuestionarios/assessments ya no aparecen.

---

## Paso 2 · Endurecer SSH y añadir swap 🟡 (10 min, riesgo bajo)

```bash
# SSH: solo clave, sin login root por contraseña
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sshd -t && systemctl reload ssh       # -t valida antes de recargar
# ¡No cierres la sesión actual hasta confirmar que puedes entrar por clave en otra!

# Swap de 4 GB (por si se vuelve a LLM local)
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

Definición de hecho: nueva sesión SSH entra solo por clave; `free -h` muestra swap.

---

## Paso 3 · Parchear `next` (bump de lockfile) 🔴 (un despliegue, riesgo bajo)

Solo dependencias. **`web` ya corre como no-root** (el entrypoint del
`Dockerfile.web` baja a usuario `node` uid 1000 vía `setpriv`; el audit #5 fue
falso positivo), así que no hay cambio de Dockerfile. El `package.json` ya
declara `next: ^15.0.0`: basta regenerar el lockfile.

Importancia: es un "high" de npm audit, pero la vulnerabilidad está en `next`
(better-auth/postcss aparecían solo por transitividad). Antes de decidir, leer la
advisory concreta con `npm audit` — muchas advisories de Next aplican solo a
funciones específicas. Riesgo del cambio: **muy bajo** (patch dentro del mismo
minor; `npm audit fix` no hace cambios que rompan salvo `--force`).

**No** incluir el salto de `better-auth` `^1.1.0`→`1.6.23` aquí: son cinco minors
en la librería de auth; hacerlo aparte y solo si se necesita, pasando los tests.

En tu entorno de desarrollo (repo):

```bash
npm audit                                    # leer la advisory concreta primero
npm audit fix
npm ls next -w @vitamap/web                   # confirmar 15.5.20
# si audit fix no lo movió: npm update next -w @vitamap/web  (sigue siendo patch)
npm run typecheck -w @vitamap/web && npm run lint -w @vitamap/web
npm run test:invitations -w @vitamap/web
npm run test:billing -w @vitamap/web
npm run test:auth-email -w @vitamap/web
git add package-lock.json
git commit -m "fix(sec): npm audit fix (next 15.5.20)"
git push origin main
```

Rollback trivial: `git revert` del commit del lockfile + `up -d --build`.

En el VPS:

```bash
cd /opt/vitamap-next && git pull origin main
cd infra && docker compose --env-file .env up -d --build web
curl -fsS https://vitamap.marcomano.org/api/health
docker compose --env-file .env exec web sh -c \
  'node -e "console.log(require(\"next/package.json\").version)"'   # >= 15.5.20
docker compose --env-file .env top web    # confirma UID node del proceso server.js
```

Definición de hecho: versión de `next` ≥ 15.5.20; `npm audit` limpio; health OK;
`docker top` muestra el proceso como `node`.

---

## Paso 4 · Decidir y activar el LLM 🔴 (decisión + trabajo, riesgo medio)

Hoy: `LLM_PROVIDER=external`, `COMPOSE_PROFILES=` (chat envía contenido fuera del
VPS). **Es primero una decisión, no solo un comando:**

- **Opción A — LLM local (modo de cierre del piloto).** Sin transferencia a
  terceros; coherente con "sin APIs externas con datos reales".

  ```bash
  cd /opt/vitamap-next/infra
  bash scripts/download-model.sh          # ~2.5 GB, Qwen3-4B, no interrumpir
  sed -i 's/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=local-llm/' .env
  sed -i 's/^LLM_PROVIDER=.*/LLM_PROVIDER=local/' .env
  # Asegurar LLM_BASE_URL=http://llm:8080/v1 y LLM_MODEL=qwen3-4b-instruct en .env
  docker compose --env-file .env up -d --build
  docker compose --env-file .env ps       # debe aparecer vitamap-llm-1 (healthy)
  docker compose --env-file .env logs llm --tail=20
  ```

  Requiere RAM: el LLM pide ~4 GB; con 7.6 GB y swap (paso 2) entra. Latencia
  esperada 15–25 s/respuesta.

- **Opción B — mantener externo.** Solo si es proveedor UE con opt-out/ZDR,
  revisado en ADR-014 y cubierto por el consentimiento de transferencia. Verificar
  a dónde apunta hoy `LLM_BASE_URL` antes de decidir:
  `grep -E '^LLM_(PROVIDER|BASE_URL|MODEL)=' /opt/vitamap-next/infra/.env`.

Definición de hecho: o `vitamap-llm-1` healthy y una conversación completa con el
PDF sintético, o decisión B documentada en ADR-014 + consentimiento.

---

## Paso 5 · Reconciliar `billing_subscription` 🔴 (cuidado, riesgo medio)

Hay 3 filas para el admin, una con `user_id` vacío y `current_period_end`
obsoleto. Tratar como incidente (guía operativa §F.6): **nunca** marcar `active`
a mano ni borrar a ciegas.

```bash
cd /opt/vitamap-next/infra
# 1) Copia de seguridad de la BD antes de nada
docker compose --env-file .env exec web sh -c \
  "sqlite3 /data/auth.sqlite \".backup /data/auth-pre-fix-$(date +%F).sqlite\""
# 2) Ver todas las filas con detalle
docker compose --env-file .env exec web sh -c \
  "sqlite3 -header -column /data/auth.sqlite \
   'SELECT rowid,user_id,status,stripe_customer_id,stripe_subscription_id,current_period_end,updated_at FROM billing_subscription;'"
```

Con esa salida decidimos juntos: contrastar en Stripe qué `customer`/`subscription`
corresponden al admin real, identificar la fila buena y documentar la reparación.
La fila con `user_id` vacío casi seguro es heredada/TEST; se confirma antes de tocar.

Definición de hecho: una sola fila `active` correcta para el admin, con
`current_period_end` vigente; reparación documentada.

---

## Paso 6 · Cifrado de disco en reposo 🔴 (proyecto aparte, riesgo alto)

El más pesado. Hoy `sda1` es `ext4` plano: sin LUKS. Datos Art. 9 sin cifrado de
disco. **No hay comando corto**; es una decisión de infraestructura:

- **Camino pragmático (recomendado): cifrar solo `/data`.** Ahí vive todo lo
  sensible (originales `age`, markdown derivados, índices QMD, `auth.sqlite`).
  Crear un volumen/contenedor LUKS montado en `/data`, con desbloqueo controlado
  al arranque (passphrase o clave custodia). Menos disruptivo que recifrar la raíz.
- **Camino completo: raíz cifrada (LUKS).** En Hetzner implica reinstalar vía
  rescue con root cifrado + unlock remoto (dropbear/initramfs). Es reprovisionar
  el servidor y migrar datos con backup/restore (los snapshots restic ya existen).

Ambos requieren planificar custodia de claves y prueba de reinicio real. Es el
punto que conviene decidir cuanto antes porque condiciona el calendario.
Recomendación: definir el camino, hacerlo con datos sintéticos, y validarlo con
un reinicio antes de cualquier dato real.

Definición de hecho: `/data` (o la raíz) sobre LUKS, desbloqueo probado en
reinicio, claves en custodia documentada.

---

## Resumen de orden y esfuerzo

| Paso | Bloqueante | Esfuerzo | Riesgo | Tipo |
|---|---|---|---|---|
| 1 | Flags de módulo | 5 min | Bajo | `.env` en VPS |
| 2 | SSH + swap | 10 min | Bajo | Config VPS |
| 3 | `next` + web no-root | 1 despliegue | Bajo-medio | Repo + VPS |
| 4 | LLM local vs externo | Decisión + descarga | Medio | Decisión + VPS |
| 5 | Reconciliar billing | Cuidado | Medio | BD (con backup) |
| 6 | Cifrado de disco | Proyecto | Alto | Infra |

Tras cerrar 1–6 y con el Frente C (legal) resuelto, quedan las pruebas de
extremo a extremo con datos sintéticos (aislamiento, borrado, restauración real
de backup), las 48 h de observación y la autorización escrita → recién entonces
las invitaciones de los voluntarios 2 y 3.

> Nota Dockerfile (paso 3b): el patrón estándar añade, tras copiar el build
> standalone, algo como `RUN addgroup -S nodejs && adduser -S nextjs -G nodejs`,
> `chown -R nextjs:nodejs /app /data` y `USER nextjs` antes del `CMD`. Ajustar a
> la base real de la imagen (alpine/debian). Puedo prepararlo si me lo pides.
