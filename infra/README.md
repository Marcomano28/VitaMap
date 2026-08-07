# infra/

Artefactos de despliegue para **Fase 1** (piloto de 3 usuarios en un VPS).

## Contenido

```
infra/
├── docker-compose.yml      Cuatro servicios: caddy, web, llm, backup
├── Caddyfile               Reverse proxy + Let's Encrypt automático
├── Dockerfile.web          Multi-stage Next.js standalone
├── Dockerfile.backup       Sidecar restic con loop diario
├── .env.example            Variables que lee docker compose
└── scripts/
    ├── download-model.sh   Descarga el GGUF al volumen llm_models
    ├── backup-loop.sh      Snapshot + retención + check
    └── restore.sh          Restauración desde último snapshot
```

## Procedimiento de despliegue (Fase 1)

Pasos en el VPS limpio (Debian 12 / Ubuntu 24.04). LUKS habilitado a nivel
disco antes de instalar Docker.

### 1. Preparar el VPS

```bash
# Instalar Docker (script oficial)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# Clonar el repo
git clone <repo-url> vitamap
cd vitamap
```

### 2. Configurar variables

```bash
cp infra/.env.example infra/.env
# Generar secretos:
openssl rand -hex 32   # → MASTER_KEY
openssl rand -hex 32   # → BETTER_AUTH_SECRET
openssl rand -hex 32   # → RESTIC_PASSWORD
# Editar infra/.env con dominio, secretos, credenciales B2.
```

Apuntar los registros DNS `A` (y `AAAA` si hay IPv6) del dominio al VPS.

### 3. Descargar el modelo

```bash
# Por defecto descarga Qwen3-4B-Instruct Q4_K_M (~2.5 GB).
bash infra/scripts/download-model.sh
```

Para usar otro modelo:

```bash
MODEL_REPO=Qwen/Qwen3-14B-Instruct-GGUF \
MODEL_FILE=qwen3-14b-instruct-q4_k_m.gguf \
bash infra/scripts/download-model.sh
```

(Recordar actualizar `LLM_MODEL_FILE` en `infra/.env`).

### 4. Levantar el stack

```bash
cd infra
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
docker compose --env-file .env logs -f web
```

Caddy obtiene el certificado TLS automáticamente. Primer arranque: 30-60s
hasta que `web` queda healthy.

### 5. Indexar la KB seed

Los documentos científicos deben existir primero en el volumen persistente
`/data/kb`. El repositorio solo incluye un placeholder técnico y no constituye
una base científica apta para el piloto.

Con el stack en marcha, indexar desde la imagen administrativa:

```bash
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts
```

Comprobar el estado del índice y ejecutar una búsqueda real:

```bash
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "vitamina D valores bajos"
```

### 6. Probar el endpoint de salud

```bash
curl https://vitamap.example.com/api/health
```

## Restauración

Con el stack apagado:

```bash
docker compose --env-file .env run --rm backup /usr/local/bin/restore.sh /restore
# Inspeccionar /restore en el contenedor antes de promocionarlo a /data.
```

## Comandos útiles

```bash
# Logs en vivo
docker compose --env-file .env logs -f web llm

# Ver snapshots de restic
docker compose --env-file .env exec backup restic snapshots

# Verificar integridad del repo de backup
docker compose --env-file .env exec backup restic check

# Forzar reindexado de la KB
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts --force

# Inspeccionar la KB y probar una recuperación
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "vitamina D valores bajos"
```

### Gestionar invitaciones

El registro está cerrado por servidor. Para crear un código nominativo,
caducable y de un solo uso contra la base de producción:

```bash
docker compose --env-file .env --profile tools run --rm admin \
  create persona@example.com --days 7

docker compose --env-file .env --profile tools run --rm admin list

docker compose --env-file .env --profile tools run --rm admin \
  revoke <invitation-id>
```

El código solo aparece al crearlo. Se envía por un canal privado y no se añade
a URLs, tickets ni logs.

### Administrar el corpus

La cuenta administrativa es una cuenta normal de BetterAuth cuyo correo aparece
en `ADMIN_EMAILS` dentro de `infra/.env`. No requiere un segundo registro ni una
contraseña distinta.

Después de desplegar una versión que incluya la interfaz:

```text
https://vitamap.example.com/admin/corpus
```

La interfaz guarda borradores en `/data/kb-inbox`, publica únicamente contenido
aprobado en `/data/kb` y actualiza el índice compartido. Las invitaciones siguen
gestionándose con los comandos anteriores y no desde esta página.

## Notas operativas

El servicio `llm` corre llama.cpp en CPU con Qwen3-4B Q4_K_M. En una VPS
CCX13 (2 vCPU dedicadas EPYC) la latencia es de 15-25s por respuesta.
Cuando la fricción de latencia justifique GPU, sustituir esta imagen por
vLLM con el mismo protocolo OpenAI (Fase 3 del roadmap) — no requiere
cambios en `apps/web`.

El servicio `backup` corre como sidecar con el volumen `vitamap_data`
montado en solo lectura. Si necesitas excluir patrones del backup,
editar `backup-loop.sh` y rebuild.

El servicio `caddy` guarda certificados en su propio volumen
`caddy_data`. Sobrevive a `docker compose down` y al rebuild del stack.

## Cuándo escalar (resumen)

| Síntoma | Acción |
|---|---|
| Latencia >30s reportada por voluntarios | Cambiar a Qwen3-7B o pasar a CCX53 (Fase 2) |
| KB >5.000 chunks y búsquedas lentas | Pasar a CCX53 con más RAM (Fase 2) |
| >10 voluntarios activos | Fase 2 |
| Latencia es la queja principal | Fase 3 (VPS con GPU) |

Ver `docs/es/arquitectura/ROADMAP.md` para detalles de cada fase.
