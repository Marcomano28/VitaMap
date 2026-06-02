#!/usr/bin/env bash
# =====================================================================
# Restaura el último snapshot restic a un directorio destino.
# Uso (desde el host, no dentro del contenedor):
#   docker compose run --rm backup /usr/local/bin/restore.sh /restore
# =====================================================================
set -euo pipefail

: "${RESTIC_REPOSITORY:?missing}"
: "${RESTIC_PASSWORD:?missing}"
TARGET="${1:-/restore}"

mkdir -p "${TARGET}"

echo "[restore] últimos snapshots:"
restic snapshots --compact

echo "[restore] restaurando 'latest' a ${TARGET}"
restic restore latest --target "${TARGET}"
echo "[restore] hecho. Verifica el contenido antes de promocionarlo a /data."
