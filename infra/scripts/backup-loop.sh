#!/usr/bin/env bash
# =====================================================================
# Loop de backup diario con restic.
# Snapshot cifrado a Backblaze B2 (u otro backend restic compatible) +
# política de retención. Si una iteración falla, espera 1h y reintenta.
# =====================================================================
set -uo pipefail

: "${RESTIC_REPOSITORY:?missing}"
: "${RESTIC_PASSWORD:?missing}"
BACKUP_TARGET="${BACKUP_TARGET:-/data}"
KEEP_DAILY="${RETENTION_KEEP_DAILY:-7}"
KEEP_WEEKLY="${RETENTION_KEEP_WEEKLY:-4}"
KEEP_MONTHLY="${RETENTION_KEEP_MONTHLY:-6}"

log() { echo "[backup $(date -u +%FT%TZ)] $*"; }

ensure_repo() {
  if ! restic snapshots >/dev/null 2>&1; then
    log "ERROR: no se puede acceder al repositorio restic (¿existe? ¿credenciales correctas?)"
    log "Este script NUNCA crea el repositorio automáticamente. Se inicializa a mano, una sola vez."
    return 1
  fi
}

run_once() {
  if ! ensure_repo; then
    return 1
  fi
  log "snapshot de ${BACKUP_TARGET}"
  if restic backup "${BACKUP_TARGET}" --tag vitamap-auto; then
    log "snapshot OK; aplicando política de retención"
    restic forget \
      --keep-daily "${KEEP_DAILY}" \
      --keep-weekly "${KEEP_WEEKLY}" \
      --keep-monthly "${KEEP_MONTHLY}" \
      --prune || log "forget falló (continuando)"
    log "verificación rápida"
    restic check --read-data-subset=1% || log "check falló (continuando)"
  else
    log "FALLO en backup"
    return 1
  fi
}

# Pequeño jitter inicial para no acumular cargas a la misma hora exacta.
sleep "$((RANDOM % 300))"

while true; do
  if run_once; then
    log "siguiente intento en 24h"
    sleep 86400
  else
    log "reintento en 1h"
    sleep 3600
  fi
done
