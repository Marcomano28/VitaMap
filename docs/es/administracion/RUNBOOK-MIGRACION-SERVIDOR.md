# Runbook · Migración de servidor (CPX32 → CPX22)

Versión 1.0 · 2026-08-02
Estado: procedimiento operativo · **leer entero antes de empezar**

> Migración del VPS a una máquina más pequeña durante la fase de desarrollo con
> inferencia externa (Mistral, ADR-014). No es un "rescale": Hetzner no permite
> reducir disco, así que se construye un servidor nuevo y se restauran los datos
> desde el backup.
>
> **Esto es además la primera prueba real del procedimiento de restauración**,
> que sigue pendiente en el checklist de go-live. Hacerlo ahora, con datos
> sintéticos, es la ocasión más barata.

---

## Antes de empezar: lo que puede salir mal

Tres cosas hunden una migración como esta. Las tres se evitan en la Fase 0.

1. **Perder las claves.** Sin `MASTER_KEY` y `RESTIC_PASSWORD` no hay
   restauración posible. No es "difícil de recuperar": es imposible.
2. **Descubrir que el backup no restaura** cuando ya has borrado el servidor
   viejo. Por eso se prueba **antes**, en la máquina actual.
3. **DNS con TTL alto.** Si el TTL es de 24 h, el cambio de IP tarda un día en
   propagarse y estarás con el servicio caído o partido. Se baja con
   antelación.

**Punto de no retorno:** borrar el servidor antiguo (Fase 8). Hasta ahí, todo
es reversible.

**Tiempo estimado:** Fase 0 el día anterior (30 min). Fases 1–7 en una sesión
de 1,5–2 h.

---

## Fase 0 · Preparación (el día anterior)

### 0.1 · Bajar el TTL del DNS

En tu proveedor DNS, baja el TTL del registro `A` de `vitamap.marcomano.org`
a **300 segundos**. Hazlo al menos tantas horas antes como el TTL antiguo
(si era 86400, hazlo un día antes).

Sin este paso el corte de servicio dura horas en vez de minutos.

### 0.2 · Guardar las claves fuera del servidor

En el servidor actual:

```bash
cd /opt/vitamap-next/infra
cat .env
```

Copia el contenido **completo** a tu gestor de contraseñas. Como mínimo tienen
que estar:

```
MASTER_KEY              ← sin esto los documentos cifrados son basura
BETTER_AUTH_SECRET      ← sin esto se invalidan todas las sesiones
RESTIC_PASSWORD         ← sin esto el backup es irrecuperable
B2_ACCOUNT_ID / B2_ACCOUNT_KEY
RESTIC_REPOSITORY
STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET
BREVO_API_KEY / EMAIL_FROM / EMAIL_REPLY_TO
ADMIN_EMAILS / PUBLIC_DOMAIN / PUBLIC_URL
LLM_BASE_URL / LLM_API_KEY / LLM_MODEL / LLM_PROVIDER
```

> No pegues este contenido en un chat, un ticket ni un documento compartido.

### 0.3 · Forzar un backup fresco y verificarlo

```bash
cd /opt/vitamap-next/infra
docker compose --env-file .env exec backup restic snapshots
```

Mira la fecha del último snapshot. Si tiene más de unas horas, fuerza uno:

```bash
docker compose --env-file .env exec backup restic backup /data --tag pre-migracion
docker compose --env-file .env exec backup restic snapshots
```

Verifica la integridad del repositorio:

```bash
docker compose --env-file .env exec backup restic check
```

Debe terminar sin errores. Si falla, **para aquí** y resuélvelo antes de
seguir.

### 0.4 · Probar la restauración en el servidor actual

Este es el paso que nunca se ha hecho. Restaura a un directorio temporal del
host, sin tocar nada:

```bash
mkdir -p /opt/restore-test
docker compose --env-file .env run --rm \
  -v /opt/restore-test:/restore \
  backup /usr/local/bin/restore.sh /restore
```

Comprueba que está todo:

```bash
ls -la /opt/restore-test/data
ls /opt/restore-test/data/users
ls /opt/restore-test/data/kb | head
ls -la /opt/restore-test/data/auth.sqlite
du -sh /opt/restore-test/data
```

Debes ver `users/`, `kb/`, `auth.sqlite` y `kb-index.sqlite`. Si falta algo,
**el backup no sirve** y no debes migrar hasta arreglarlo.

Anota el tamaño total (`du -sh`): lo necesitarás para confirmar que el disco
de 80 GB sobra.

Limpia:

```bash
rm -rf /opt/restore-test
```

### 0.5 · Anotar el estado actual

```bash
docker compose --env-file .env ps
docker volume ls | grep -i vitamap
curl -s https://vitamap.marcomano.org/api/health
```

Guarda la salida. Al final compararás.

---

## Fase 1 · Crear el servidor nuevo

En la consola de Hetzner:

1. **Add Server**, misma región que el actual (FSN1 / NBG1 / HEL1 — usa la
   misma que ya tienes, por coherencia con lo declarado en la guía legal).
2. Imagen: **Ubuntu 24.04** o **Debian 12** (la misma que usas ahora).
3. Tipo: **CPX22** (2 vCPU, 4 GB, 80 GB).
4. Añade tu clave SSH.
5. **No** actives backups de Hetzner todavía (ya tienes restic; evita duplicar
   coste mientras verificas).
6. Nombre reconocible: `vitamap-cpx22`.

Anota la **IP nueva**. La llamaremos `<IP_NUEVA>`.

> A partir de aquí pagas dos servidores. Es lo esperado y dura pocos días.

---

## Fase 2 · Preparar la base

Conecta al servidor nuevo:

```bash
ssh root@<IP_NUEVA>
```

Instala Docker:

```bash
curl -fsSL https://get.docker.com | sh
docker --version
```

Añade swap (barato y evita sustos en el build de Next.js):

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

Clona el repositorio en la misma ruta que usabas:

```bash
mkdir -p /opt
git clone <url-de-tu-repo> /opt/vitamap-next
cd /opt/vitamap-next
```

---

## Fase 3 · Configurar el entorno

```bash
cd /opt/vitamap-next/infra
cp .env.example .env
nano .env
```

Pega los valores que guardaste en el paso 0.2. **Presta atención a estas tres
líneas**, que deben quedar en modo externo (Mistral):

```
COMPOSE_PROFILES=
LLM_PROVIDER=external
LLM_BASE_URL=https://api.mistral.ai/v1
```

`COMPOSE_PROFILES` vacío significa que **no se levanta el servicio `llm`** y no
hay que descargar ningún modelo de 2,5 GB. Es lo que hace viable la máquina
pequeña.

Verifica que no queda ningún `replace_with_...` sin sustituir:

```bash
grep -n "replace" .env
```

No debe devolver nada.

---

## Fase 4 · Restaurar los datos

**Aquí está el detalle que rompe el procedimiento tal cual está escrito en
`restore.sh`:** el servicio `backup` monta el volumen de datos en **solo
lectura** (`vitamap_data:/data:ro`), así que no puede escribir dentro. Hay que
restaurar con un contenedor temporal que lo monte en lectura y escritura.

Primero construye la imagen de backup y crea el volumen:

```bash
cd /opt/vitamap-next/infra
docker compose --env-file .env build backup
docker compose --env-file .env up -d --no-start
docker volume ls | grep vitamap
```

Anota el nombre exacto del volumen de datos (será algo como
`infra_vitamap_data`). Lo llamaremos `<VOLUMEN>`.

Ahora restaura dentro de él:

```bash
source .env
docker run --rm \
  -e RESTIC_REPOSITORY="$RESTIC_REPOSITORY" \
  -e RESTIC_PASSWORD="$RESTIC_PASSWORD" \
  -e B2_ACCOUNT_ID="$B2_ACCOUNT_ID" \
  -e B2_ACCOUNT_KEY="$B2_ACCOUNT_KEY" \
  -v <VOLUMEN>:/data \
  vitamap/backup:latest \
  restic restore latest --target / --include /data
```

Comprueba que llegó todo:

```bash
docker run --rm -v <VOLUMEN>:/data alpine sh -c \
  "ls -la /data && echo '---' && ls /data/users && echo '---' && du -sh /data"
```

El tamaño debe parecerse al que anotaste en el paso 0.4. Deben estar `users/`,
`kb/`, `auth.sqlite` y `kb-index.sqlite`.

---

## Fase 5 · Arrancar y verificar SIN tocar el DNS

```bash
cd /opt/vitamap-next/infra
docker compose --env-file .env up -d --build
```

El build tarda varios minutos. Vigílalo:

```bash
docker compose --env-file .env logs -f web
```

Cuando termine:

```bash
docker compose --env-file .env ps
```

Deben estar `caddy`, `web` y `backup`. **No** debe aparecer `llm` (correcto:
estás en modo externo).

Ahora prueba la aplicación **sin haber cambiado el DNS**, forzando la
resolución a la IP nueva:

```bash
curl -k --resolve vitamap.marcomano.org:443:<IP_NUEVA> \
  https://vitamap.marcomano.org/api/health
```

> El `-k` es necesario porque Caddy aún no puede emitir el certificado real
> (el DNS todavía apunta al servidor viejo). Sirve un certificado interno; es
> lo esperado en este punto.

Debes ver `status: ok` y, muy importante, **`audit_chain` sin `broken`**. Si la
cadena de auditoría aparece rota, la restauración no fue íntegra: para y
revisa.

Prueba también que el corpus está indexado:

```bash
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "vitamina D valores bajos"
```

Si devuelve resultados, el índice viajó bien y **no necesitas reindexar**.
Si no devuelve nada, reindexa:

```bash
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts --force
```

---

## Fase 6 · Cambiar el DNS

Solo cuando la Fase 5 esté verde.

En tu proveedor DNS, cambia el registro `A` de `vitamap.marcomano.org` a
`<IP_NUEVA>` (y el `AAAA` si usas IPv6).

Espera la propagación (con TTL 300 son unos minutos):

```bash
dig +short vitamap.marcomano.org
```

Cuando devuelva la IP nueva, Caddy emitirá el certificado automáticamente en
unos 30 segundos. Compruébalo:

```bash
curl -s https://vitamap.marcomano.org/api/health
docker compose --env-file .env logs caddy --tail=30
```

Ahora **sin** `-k`: si responde correctamente, el certificado es válido.

---

## Fase 7 · Verificación completa

Entra por navegador a `https://vitamap.marcomano.org` y comprueba:

- [ ] Inicias sesión con tu cuenta de siempre (si falla, revisa
      `BETTER_AUTH_SECRET`)
- [ ] Tu memoria y documentos anteriores están visibles
- [ ] Una conversación completa en el chat, con cita de corpus
- [ ] Un documento antiguo se abre y descifra bien (valida `MASTER_KEY`)
- [ ] `/admin/corpus` carga y lista el corpus publicado
- [ ] Exportar memoria produce un ZIP correcto

Y las comprobaciones automáticas:

```bash
docker compose --env-file .env exec backup restic snapshots
curl -s https://vitamap.marcomano.org/api/health
```

Confirma que el backup del servidor **nuevo** genera su primer snapshot en las
24 h siguientes.

---

## Fase 8 · Retirar el servidor antiguo

**No antes de 3–7 días de funcionamiento correcto del nuevo.**

Primero apágalo, pero no lo borres, y comprueba que nada se rompe:

```bash
# en el servidor ANTIGUO
cd /opt/vitamap-next/infra
docker compose --env-file .env down
```

Espera un par de días. Si todo sigue bien, en la consola de Hetzner:

1. **Borra el servidor antiguo** (no basta con apagarlo: Hetzner factura los
   servidores parados hasta que se eliminan).
2. Revisa y borra **snapshots** huérfanos — se facturan por GB aunque el
   servidor ya no exista.
3. Revisa **volúmenes** y **Floating IPs** sueltos.
4. Comprueba que solo queda una IPv4 primaria facturándose.

Verifica en la factura del mes siguiente que el importe bajó.

---

## Después de migrar

Anota en `../arquitectura/DECISIONS.md` una entrada breve: que se bajó a CPX22
porque el piloto opera con **inferencia externa**, y que **volver a inferencia
local exige subir de nuevo de tipo** (eso sí es un rescale simple; el disco
solo crece). El texto de consentimiento promete el retorno a local al terminar
el piloto, así que esa dependencia debe quedar escrita y no descubrirse dentro
de seis meses.

Marca también en `CHECKLIST-GO-LIVE-PILOTO-REAL.md` la prueba de restauración
como **realizada**, con la fecha: ya no es una suposición.

---

## Si algo va mal

| Síntoma | Qué hacer |
|---|---|
| El build se queda sin memoria | Confirma el swap (`free -h`). Si persiste, construye la imagen en local y súbela a un registry |
| `restic restore` no encuentra el repo | Revisa `RESTIC_REPOSITORY` y las credenciales B2; prueba `restic snapshots` primero |
| `audit_chain: broken` tras restaurar | La restauración no fue íntegra. Repite desde un snapshot anterior. **No sigas** |
| No puedes iniciar sesión | `BETTER_AUTH_SECRET` distinto del original |
| Los documentos no se descifran | `MASTER_KEY` distinta del original. Es el fallo más grave: para y recupera la clave correcta |
| Caddy no emite certificado | El DNS aún no propagó, o el puerto 443 está cerrado. `logs caddy` |
| El asistente no encuentra corpus | Reindexa con `seed-kb.mts --force` |

**Regla general:** mientras no hayas borrado el servidor antiguo, la marcha
atrás es devolver el DNS a la IP vieja y arrancarlo otra vez. Ten esa opción
presente durante toda la operación.
