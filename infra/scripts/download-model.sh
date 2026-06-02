#!/usr/bin/env bash
# =====================================================================
# Descarga el modelo GGUF al volumen llm_models antes del primer
# `docker compose up`. Idempotente: si el fichero ya existe, no descarga.
#
# Variables (con defaults para Qwen3-4B-Instruct Q4_K_M):
#   MODEL_REPO   - HuggingFace repo, p.ej. Qwen/Qwen3-4B-Instruct-GGUF
#   MODEL_FILE   - Nombre del .gguf, p.ej. qwen3-4b-instruct-q4_k_m.gguf
#   VOLUME       - Nombre del volumen Docker (default: vitamap_llm_models)
# =====================================================================
set -euo pipefail

MODEL_REPO="${MODEL_REPO:-Qwen/Qwen3-4B-Instruct-GGUF}"
MODEL_FILE="${MODEL_FILE:-qwen3-4b-instruct-q4_k_m.gguf}"
VOLUME="${VOLUME:-vitamap_llm_models}"

URL="https://huggingface.co/${MODEL_REPO}/resolve/main/${MODEL_FILE}"

echo "[download-model] repo  = ${MODEL_REPO}"
echo "[download-model] file  = ${MODEL_FILE}"
echo "[download-model] volume= ${VOLUME}"

# Crear el volumen si no existe.
docker volume inspect "${VOLUME}" >/dev/null 2>&1 || docker volume create "${VOLUME}"

# Descargar usando un contenedor efímero con curl montando el volumen.
docker run --rm \
  -v "${VOLUME}:/models" \
  -e URL="${URL}" \
  -e MODEL_FILE="${MODEL_FILE}" \
  curlimages/curl:latest \
  sh -c '
    set -e
    if [ -f "/models/${MODEL_FILE}" ]; then
      echo "[download-model] ya existe — sin cambios"
      exit 0
    fi
    echo "[download-model] descargando ${URL} ..."
    curl -fL --progress-bar -o "/models/${MODEL_FILE}.part" "${URL}"
    mv "/models/${MODEL_FILE}.part" "/models/${MODEL_FILE}"
    echo "[download-model] OK"
  '
