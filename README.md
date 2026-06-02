# VitaMap

Plataforma de inteligencia personal sobre la propia salud. Herramienta
educativa, no dispositivo médico. Self-hosted, GDPR, EU.

Ver `VitaMap-Descripcion.txt` para visión de producto y `docs/ROADMAP.md`
para la ruta de fases.

## Estado actual

Fase 0 — andamio del repo. Próximos pasos: cablear QMD como librería y
preparar `docker-compose` para despliegue en Fase 1.

## Estructura del monorepo

```
.
├── apps/
│   └── web/          Next.js 15 + TypeScript (UI + API)
├── data/             Persistencia local (gitignored excepto seed KB)
│   └── kb/           Base de conocimiento científica (markdown)
├── docs/             Documentación del proyecto (roadmap, decisiones)
├── infra/            Docker Compose, Caddy, scripts de despliegue
└── package.json      Workspace npm raíz
```

## Requisitos locales

- Node.js 22 o superior (`node --version`)
- npm 10+ (incluido con Node 22)
- Una herramienta para servir el LLM con endpoint OpenAI-compatible.
  Recomendado para Fase 0: [Ollama](https://ollama.com) o
  [`llama.cpp` server](https://github.com/ggerganov/llama.cpp).

Opcional para macOS: `brew install sqlite` (QMD usa SQLite con extensiones
nativas y se beneficia del SQLite de Homebrew).

## Arranque rápido (Fase 0)

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env y generar secretos:
#   openssl rand -hex 32  →  MASTER_KEY
#   openssl rand -hex 32  →  BETTER_AUTH_SECRET

# 2. Instalar dependencias del workspace
npm install

# 3. Arrancar el LLM local (en otra terminal)
# Con Ollama:
ollama pull qwen3:4b-instruct
ollama serve
# (expone http://localhost:11434 — ajusta LLM_BASE_URL en .env)

# O con llama.cpp server apuntando a un GGUF Q4_K_M de Qwen3-4B.

# 4. Arrancar la app web
npm run dev
# → http://localhost:3000
```

## Comandos del workspace

```bash
npm run dev          # arranca apps/web en modo desarrollo
npm run build        # build de producción de apps/web
npm run typecheck    # verifica tipos en todos los workspaces
npm run lint         # lint en todos los workspaces
```

## Despliegue Fase 1 (VPS)

El stack de producción para el piloto de 3 usuarios vive en `infra/`:
Docker Compose con Caddy + Next.js + llama.cpp server + restic. Coste
objetivo ~15 €/mes (Hetzner CCX13).

Procedimiento detallado: `infra/README.md`.

Resumen del flujo:

```bash
# en el VPS
git clone <repo> vitamap && cd vitamap
cp infra/.env.example infra/.env  # rellenar secretos y dominio
bash infra/scripts/download-model.sh
cd infra && docker compose --env-file .env up -d --build
```

## Acceso y registro

El piloto es **invite-only**. No se publica el sitio. Tú compartes la URL
con los voluntarios que has invitado, ellos se registran en `/register`
introduciendo email + contraseña y aceptando los dos reconocimientos
obligatorios (carácter educativo + consentimiento Art. 9.2.a RGPD).

Tras el registro el voluntario entra directamente a `/memory`. Cada
acción significativa (login, escritura de memoria, subida de documento,
chat, borrado de cuenta) queda registrada en `audit_event` con hash
chain en `data/auth.sqlite`.

El borrado de cuenta desde `/settings` purga `data/users/<id>/` por
completo (memoria + documentos cifrados + índice QMD) y elimina al
usuario en BetterAuth. Los eventos de audit log asociados al borrado se
conservan con identificador pseudonimizado para acreditar el
cumplimiento del derecho al olvido.

## Próximos hitos

1. **UI del chat** — caja de entrada en `/chat`, renderizado de citas
   con tipo y nivel de evidencia, streaming token-a-token.
2. **Visor de memoria** — línea de tiempo, filtros por categoría,
   visor de imágenes con descifrado en cliente.
3. **MFA TOTP opcional** — plugin BetterAuth, activable desde `/settings`.
4. **Exportación ZIP de la memoria** — `/settings` con botón de
   portabilidad (Art. 20 RGPD).
5. **DPIA formal** — antes de admitir el primer voluntario real, tener
   el documento firmado.

## Licencia y aviso

Esta plataforma es una **herramienta educativa**. No emite diagnósticos
ni recomendaciones de tratamiento. No sustituye consulta con profesional
sanitario cualificado.
