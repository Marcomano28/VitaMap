# Manual de administración del VPS

Versión 1.0 · 2026-08-02
Estado: documento operativo · **mantener actualizado cuando cambie `infra/`**

> Manual consolidado para quien opera la instancia. Reúne lo que estaba
> disperso entre `infra/README.md`, `PILOTO-FASE1-GUIA-OPERATIVA.txt` y los
> scripts del repositorio. Todos los comandos están verificados contra
> `infra/docker-compose.yml` y `apps/web/package.json`.
>
> Deutsche Fassung: `docs/de/HANDBUCH-VPS.md`.

**Antes de nada:** ningún dato de salud real entra en el sistema sin haber
cerrado los bloqueantes de `CHECKLIST-GO-LIVE-PILOTO-REAL.md` y la
`GUIA-LEGAL-PILOTO-ALEMANIA.md`. Este manual describe *cómo* operar, no
*si está permitido* operar.

---

## 1. Mapa mental de la instalación

Cuatro servicios en Docker Compose, más uno bajo demanda:

| Servicio | Qué hace | Cuándo corre |
|---|---|---|
| `caddy` | Proxy inverso, TLS automático (Let's Encrypt) | Siempre |
| `web` | La aplicación Next.js con QMD embebido | Siempre |
| `backup` | Sidecar restic, snapshot diario cifrado a Backblaze B2 | Siempre |
| `llm` | llama.cpp con Qwen3-4B | Solo con perfil `local-llm` |
| `admin` | Tareas administrativas (invitaciones, KB) | Bajo demanda, perfil `tools` |

Los datos viven en el volumen `vitamap_data`, montado como `/data`:

```
/data
├── users/<userId>/     memoria, documentos cifrados e índice por usuario
├── kb/                 base de conocimiento publicada (tarjetas RAG)
├── kb-inbox/           borradores del corpus, aún no publicados
├── auth.sqlite         cuentas, sesiones, auditoría, invitaciones, billing
└── kb-index.sqlite     índice QMD del corpus
```

Todo lo demás es reconstruible. **Si se pierde `/data`, se pierde todo**: de ahí
que la restauración probada sea un requisito, no una buena práctica.

Ruta de trabajo en el VPS actual: `/opt/vitamap-next`. Los comandos de este
manual asumen que estás en `/opt/vitamap-next/infra` salvo que se indique otra
cosa.

---

## 2. Instalación desde cero

Solo para un VPS nuevo. Si la instancia ya existe, ve a §3.

**2.1 · Preparar el servidor** (Debian 12 / Ubuntu 24.04, LUKS habilitado a
nivel de disco antes de instalar Docker):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
git clone <repo-url> vitamap && cd vitamap
```

**2.2 · Variables de entorno:**

```bash
cp infra/.env.example infra/.env
openssl rand -hex 32   # → MASTER_KEY
openssl rand -hex 32   # → BETTER_AUTH_SECRET
openssl rand -hex 32   # → RESTIC_PASSWORD
```

Editar `infra/.env` con dominio, secretos y credenciales B2. Apuntar los
registros DNS `A` (y `AAAA` si hay IPv6) al VPS.

> `MASTER_KEY` cifra los documentos de los usuarios. **Si se pierde, los
> documentos son irrecuperables** — ni tú ni nadie puede descifrarlos. Guárdala
> fuera del servidor, en un gestor de contraseñas.

**2.3 · Descargar el modelo** (solo en modo local):

```bash
bash infra/scripts/download-model.sh          # Qwen3-4B Q4_K_M, ~2,5 GB
```

Tarda 5–15 minutos. No interrumpir. Para otro modelo:

```bash
MODEL_REPO=Qwen/Qwen3-14B-Instruct-GGUF \
MODEL_FILE=qwen3-14b-instruct-q4_k_m.gguf \
bash infra/scripts/download-model.sh
```

(y actualizar `LLM_MODEL_FILE` en `infra/.env`).

**2.4 · Levantar el stack:**

```bash
cd infra
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
```

Primer arranque: 30–60 s hasta que `web` queda *healthy*. Caddy obtiene el
certificado solo.

**2.5 · Indexar la base de conocimiento:** ver §5. El repositorio solo incluye
un placeholder técnico; **no es una base científica apta para el piloto**.

**2.6 · Comprobar:**

```bash
curl https://<tu-dominio>/api/health
```

---

## 3. Operación diaria

```bash
cd /opt/vitamap-next/infra

# Estado de los servicios
docker compose --env-file .env ps

# Logs en vivo
docker compose --env-file .env logs -f web
docker compose --env-file .env logs -f web llm
docker compose --env-file .env logs web --tail=50

# Reiniciar un servicio
docker compose --env-file .env restart web

# Parar / arrancar todo
docker compose --env-file .env down
docker compose --env-file .env up -d
```

**Desplegar una versión nueva:**

```bash
cd /opt/vitamap-next
git pull
cd infra
docker compose --env-file .env up -d --build
docker compose --env-file .env logs -f web     # vigilar el arranque
```

**Comprobación de salud.** `GET /api/health` devuelve `status`, `service`,
`version`, `phase`, `audit_chain` y `ts`. Si `audit_chain` aparece como `broken`
o `error`, el servicio puede seguir vivo pero **trátalo como alerta**: significa
que la cadena de hash del registro de auditoría no verifica, y eso tiene
implicaciones legales, no solo técnicas.

---

## 4. Modo de inferencia: local o externo

Dos modos, controlados por dos variables en `infra/.env`:

| Modo | Variables | Efecto |
|---|---|---|
| Local (recomendado) | `COMPOSE_PROFILES=local-llm` · `LLM_PROVIDER=local` | Levanta `llm` con llama.cpp; nada sale del VPS |
| Externo | `COMPOSE_PROFILES=` (vacío) · `LLM_PROVIDER=external` | No levanta `llm`; las consultas van al proveedor configurado |

El modo externo (hoy Mistral, ADR-014) solo se contempla con proveedor de la
UE, con el uso para entrenamiento desactivado y con un consentimiento que lo
declare. **Cambiar de modo cambia lo que se ha prometido a los usuarios**: si lo
tocas, revisa `apps/web/lib/consent.ts` y la guía legal antes.

En una VPS CCX13 (2 vCPU EPYC) la latencia local es de 15–25 s por respuesta.

---

## 5. Base de conocimiento (KB)

El contenido se prepara y se sube según `MANUAL-TARJETAS-RAG.md`. Aquí solo los
comandos del servidor.

```bash
# Indexar la KB (primera vez)
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts

# Forzar reindexado completo
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts --force

# Inspeccionar el índice y probar una recuperación real
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "vitamina D valores bajos"
```

El último comando es la forma rápida de responder a "¿por qué el asistente no
encuentra esto?": si `check-kb` no lo devuelve, el problema está en el corpus o
en el índice, no en el modelo.

---

## 6. Invitaciones

El registro está cerrado. Nadie puede crear una cuenta sin un código nominativo,
caducable y de un solo uso — el hook de BetterAuth rechaza cualquier alta sin
código interno, incluso desde línea de comandos.

```bash
# Crear
docker compose --env-file .env --profile tools run --rm admin \
  create persona@example.com --days 7

# Listar
docker compose --env-file .env --profile tools run --rm admin list

# Revocar
docker compose --env-file .env --profile tools run --rm admin \
  revoke <invitation-id>
```

**El código solo se muestra al crearlo.** Se envía por un canal privado y no se
pega en URLs, tickets ni logs. Si se pierde, se revoca y se crea otro.

El administrador también necesita invitación para registrarse: no hay atajo.

---

## 7. Corpus y cuenta administrativa

La cuenta de administración es una cuenta normal de BetterAuth cuyo correo
figura en `ADMIN_EMAILS` dentro de `infra/.env`. No hay segundo registro ni
contraseña aparte. Interfaz:

```
https://<tu-dominio>/admin/corpus
```

Guarda borradores en `/data/kb-inbox`, publica solo lo aprobado en `/data/kb` y
actualiza el índice. Las invitaciones **no** se gestionan desde ahí (§6).

---

## 8. Backups y restauración

Restic cifra `/data` completo y lo envía a Backblaze B2 cada 24 h desde el
arranque del contenedor, con un retraso aleatorio inicial.

Configuración en `infra/.env`:

```
B2_ACCOUNT_ID=<account id>
B2_ACCOUNT_KEY=<application key>
RESTIC_REPOSITORY=b2:vitamap-backup:/restic
RESTIC_PASSWORD=<contraseña larga>
```

```bash
# Ver snapshots
docker compose --env-file .env exec backup restic snapshots

# Verificar integridad del repositorio de backup
docker compose --env-file .env exec backup restic check

# Reiniciar tras cambiar credenciales
docker compose --env-file .env restart backup
```

**Restauración** (con el stack apagado):

```bash
docker compose --env-file .env run --rm backup /usr/local/bin/restore.sh /restore
```

Inspeccionar `/restore` **dentro del contenedor** antes de promocionarlo a
`/data`. Nunca sobrescribir `/data` directamente sin haber mirado qué hay.

> Una restauración que no se ha probado nunca no es un backup: es una
> suposición. Probarla es requisito de go-live, no tarea pendiente.

---

## 9. Comandos de verificación del código

Se ejecutan en `apps/web` (en local o dentro del contenedor administrativo).
Útiles tras cualquier cambio:

```bash
npm run typecheck                 # tsc --noEmit
npm run check:data-access         # invariante del choke point de autorización
npm run test:data-access          # suite de seguridad de acceso a datos
npm run test:memory-path-safety   # anti path traversal
npm run taxonomy:check            # taxonomía de marcadores al día
npm run kb:check                  # estado del corpus
npm run corpus:locale-audit       # auditoría de idiomas del corpus
npm run eval                      # evaluación del asistente (eval/*.yml)
```

Hay una suite por módulo (`npm run test:*` en `package.json`). Antes de un
despliegue con datos reales conviene pasar al menos `typecheck`,
`check:data-access`, `test:data-access` y `test:memory-path-safety`.

---

## 10. Incidencias frecuentes

| Síntoma | Dónde mirar |
|---|---|
| `web` no arranca | `logs web` — casi siempre variable de entorno inválida; `lib/env.ts` valida al arrancar y dice cuál falla |
| Certificado TLS no se emite | DNS mal apuntado o puerto 443 cerrado; `logs caddy` |
| `audit_chain: broken` en `/api/health` | Alerta seria: la cadena de auditoría no verifica. Investigar antes de seguir operando |
| El asistente no encuentra contenido | `check-kb.mts` con la consulta; si no aparece, es corpus o índice |
| Latencia > 30 s | Modelo/hardware: ver tabla de escalado abajo |
| Alta rechazada | Falta invitación válida, es el comportamiento esperado (§6) |
| Backup sin snapshots | Credenciales B2 o `RESTIC_PASSWORD`; `logs backup` |

**Cuándo escalar:**

| Síntoma | Acción |
|---|---|
| Latencia > 30 s reportada por usuarios | Qwen3-7B o pasar a CCX53 (Fase 2) |
| KB > 5.000 chunks y búsquedas lentas | CCX53 con más RAM (Fase 2) |
| > 10 usuarios activos | Fase 2 |
| La latencia es la queja principal | Fase 3 (VPS con GPU) |

Ver `../arquitectura/ROADMAP.md` para el detalle de cada fase.

---

## 11. Seguridad operativa

- **Nunca** copiar `infra/.env` fuera del servidor ni pegarlo en un chat.
- `MASTER_KEY` y `RESTIC_PASSWORD` fuera del VPS, en un gestor de contraseñas.
  Sin ellas no hay recuperación posible.
- Los códigos de invitación no van a logs, URLs ni tickets.
- Ante sospecha de brecha: contener, conservar evidencia y seguir el
  procedimiento de `../legal/GUIA-LEGAL-PILOTO-ALEMANIA.md` §4.4 — hay un plazo
  de **72 horas** para notificar a la autoridad cuando procede.
- La cadena de auditoría es append-only con hash (ADR-007): no editar
  `auth.sqlite` a mano bajo ninguna circunstancia.

---

## 12. Documentos relacionados

| Documento | Para qué |
|---|---|
| `MANUAL-TARJETAS-RAG.md` | Crear y publicar contenido del corpus |
| `CHECKLIST-GO-LIVE-PILOTO-REAL.md` | Qué falta antes de admitir datos reales |
| `PLAN-REMEDIACION-BLOQUEANTES.md` | Orden de resolución de bloqueantes |
| `PILOTO-FASE1-GUIA-OPERATIVA.txt` | Secuencia histórica completa y contexto del piloto |
| `../arquitectura/DECISIONS.md` | Por qué las cosas son como son (ADR) |
| `../legal/GUIA-LEGAL-PILOTO-ALEMANIA.md` | Marco legal, etapas y puertas de entrada |
