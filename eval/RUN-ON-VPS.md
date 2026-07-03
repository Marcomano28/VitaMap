# Cómo medir el banco de evaluación en el servidor (VPS)

El banco (`eval/*.yml`) solo puede poner nota donde vive la **base de conocimiento
real**: el volumen `/data/kb` del VPS. El contenedor `web` de producción está
"pelado" (no trae el script); el vehículo correcto es el contenedor **`admin`**
(perfil `tools`), que trae todo el código y monta el mismo `/data` — es el mismo
patrón que la guía operativa usa para `check-kb` (sección G).

Rutas y secuencia según `docs/PILOTO-FASE1-GUIA-OPERATIVA.txt` (F.1). El repo de
producción vive en **`/opt/vitamap-next`**.

> **Requisito previo:** el PR con estos ficheros debe estar **fusionado en `main`**
> para poder traerlos con `git pull`.

## Pasos (por SSH, en el VPS)

```bash
# 1) Entrar al servidor y al repo de produccion
ssh root@<IP-del-VPS>
cd /opt/vitamap-next

# 2) Traer los ficheros nuevos desde main
git fetch origin main
git status --short            # debe estar limpio (infra/.env no se versiona)
git pull origin main

# 3) Construir SOLO la imagen admin (perfil tools) con el banco.
#    Esto NO reconstruye ni reinicia web/caddy/llm: la produccion no se toca.
cd infra
docker compose --env-file .env --profile tools build admin

# 4) Comprobar que el banco esta bien montado (rapido, NO toca la KB)
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/run-eval.mts --validate

# 5) LA NOTA DE PARTIDA: medir contra la KB real (/data/kb)
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/run-eval.mts --run
```

El paso 5 imprime una tabla como esta (números de ejemplo):

```
Resultados de recuperación (top-5, recall por tema):
  tema                         casos  R@1   R@3   R@5   must-not✗
  glucemia                        7   71%   86%  100%   0
  hierro-anemia                   6   67%   83%   83%   1
  ...
  TOTAL                          43   70%   88%   95%   2
```

- **R@3** = % de veces que la tarjeta correcta salió entre las 3 primeras (métrica
  guía; el chat entrega 3 tarjetas al modelo). Cuanto más alto, mejor.
- **must-not✗** = veces que una tarjeta prohibida se coló por encima de la correcta.
  Cuanto más bajo, mejor (idealmente 0).

## Seguridad de esta operación

Los pasos 3-5 usan solo el contenedor `admin`, que es **de un solo uso** y comparte
el volumen `/data`. **No** reconstruyen ni reinician `web`, `caddy` ni `llm`, así que
la producción del piloto sigue intacta mientras se mide. El grafo recién cableado es
**inerte** (todavía no se consume en la recuperación), de modo que tampoco cambia las
respuestas del chat: solo se mide la búsqueda tal como está hoy.

## Qué hacer con el resultado

Copia y **pega la tabla completa** del paso 5 (y los "casos que fallan" si los lista
debajo). Con esa foto de partida se podrá: (1) ver dónde falla hoy la búsqueda;
(2) calibrar `minScore` y decidir `KB_MARKER_SCOPE` con datos; (3) encender el uso
del mapa y volver a medir para confirmar que **sube**. No sale ningún dato personal:
solo preguntas de prueba y nombres de tarjetas.
