# VitaMap

*[English version](README.en.md) — visión general del proyecto, arquitectura y
detalle del modelo de seguridad de datos.*

Plataforma de inteligencia personal sobre la propia salud. Herramienta
educativa, no dispositivo médico. Self-hosted, GDPR, EU.

Ver `docs/vision/VitaMap-Descripcion.txt` para visión de producto y `docs/es/arquitectura/ROADMAP.md`
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
├── docs/             Documentación — empezar por docs/README.md
│   ├── es/           Activa en español (administración, arquitectura, legal)
│   ├── de/           Handbücher und Rechtsdokumente (deutsch)
│   ├── vision/       Producto, marca y material editorial
│   └── recycle/      Histórico del proceso — puede sacarse del proyecto
├── infra/            Docker Compose, Caddy, scripts de despliegue
└── package.json      Workspace npm raíz
```

Para operar la instancia: `docs/es/administracion/MANUAL-VPS.md`
(deutsch: `docs/de/HANDBUCH-VPS.md`).

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

El piloto es **invite-only** y requiere una suscripción activa. Los tres
primeros usuarios aportan **6 €/mes cada uno** para cubrir el VPS compartido
de 16,65 €/mes, las comisiones y costes operativos menores. La cuota podrá
reducirse por etapas al crecer el grupo, después de revisar el uso y el coste
real de infraestructura.

El usuario invitado se registra en `/register` con email + contraseña y acepta
los dos reconocimientos obligatorios (carácter educativo + consentimiento Art.
9.2.a RGPD). Después completa Checkout en Stripe. El acceso funcional se
activa únicamente cuando el webhook confirma una suscripción activa; volver
desde Checkout no basta para conceder acceso.

Las invitaciones se generan desde un entorno administrativo con acceso a la
misma `AUTH_DB_PATH` que la aplicación:

```bash
npm run invite -w @vitamap/web -- create persona@example.com --days 7
npm run invite -w @vitamap/web -- list
npm run invite -w @vitamap/web -- revoke <invitation-id>
```

Cada código está ligado a un email, caduca y solo permite una cuenta. VitaMap
guarda su hash, no el código en claro. El código debe enviarse por un canal
privado y no incluirse en URLs. El endpoint directo de alta de BetterAuth
también está bloqueado: solo la acción interna que validó la invitación puede
crear el usuario.

En el VPS, el comando accede al volumen de producción mediante el servicio
administrativo de uso puntual:

```bash
cd infra
docker compose --env-file .env --profile tools run --rm admin \
  create persona@example.com --days 7
```

El control de suscripción se aplica en servidor: sin pago confirmado permanecen
accesibles billing, ajustes, exportación y borrado de cuenta, mientras chat,
memoria, documentos y assessments quedan bloqueados. El registro aterriza en
billing y el Customer Portal de Stripe permite gestionar el método de pago o
cancelar la suscripción. Cada acción significativa queda registrada en
`audit_event` con hash chain en `data/auth.sqlite`.

Los estados TEST y LIVE quedan separados en la base local. Al pasar a claves
LIVE, una suscripción activa creada durante las pruebas no concede acceso. El
borrado de cuenta cancela primero cualquier suscripción vigente para evitar
cobros posteriores sin servicio.

La apertura a datos de salud reales está condicionada por la
[guía legal y técnica del piloto en Alemania](docs/es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md).
La guía separa las funciones educativas de las que requieren revisión de
protección de datos o de producto sanitario y define las evidencias necesarias
antes del primer usuario real.

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
3. **MFA antes del piloto real** — TOTP o passkey con recuperación probada,
   obligatorio antes de custodiar datos de salud de terceros.
4. **Exportación ZIP de la memoria** — `/settings` con botón de
   portabilidad (Art. 20 RGPD).
5. **Expediente legal del piloto** — DSFA/DPIA, registro Art. 30, análisis
   MDR, contratos de proveedores y documentación de consumidores, según la
   guía alemana.

## Licencia y aviso

Esta plataforma es una **herramienta educativa**. No emite diagnósticos
ni recomendaciones de tratamiento. No sustituye consulta con profesional
sanitario cualificado.
