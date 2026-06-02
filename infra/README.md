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

Con el stack en marcha:

```bash
docker compose --env-file .env exec web node -e "require('./apps/web/scripts/seed-kb.js')"
# o, si se prefiere ejecutar el TS directamente:
# docker compose --env-file .env exec web npx tsx apps/web/scripts/seed-kb.ts
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
docker compose --env-file .env exec web npx tsx apps/web/scripts/seed-kb.ts -- --force
```

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

Ver `docs/ROADMAP.md` para detalles de cada fase.
