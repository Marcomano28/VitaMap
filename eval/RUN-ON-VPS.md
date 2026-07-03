# Cómo medir el banco de evaluación en el servidor (VPS)

El banco (`eval/*.yml`) solo puede poner nota donde vive la **base de conocimiento
real**: el volumen `/data` del VPS. El contenedor `web` de producción está
"pelado" (no trae el script); el vehículo correcto es el contenedor **`admin`**,
que trae todo el código y monta el mismo `/data` — es el mismo patrón que el
README usa para `check-kb`.

> **Requisito previo:** los ficheros del banco (`eval/*.yml`,
> `apps/web/scripts/run-eval.mts`) tienen que estar **subidos a GitHub** para
> poder traerlos al servidor con `git pull`. Si aún no lo están, hazlo primero
> (o pídemelo a mí).

## Pasos (por SSH, en el VPS)

```bash
# 1) Ir al repo y traer los ficheros nuevos
cd ~/vitamap            # o donde clonaste el repo (p. ej. /root/vitamap)
git pull

# 2) Reconstruir la imagen admin para que incluya el banco
cd infra
docker compose --env-file .env --profile tools build admin

# 3) Comprobar que el banco está bien montado (rápido, NO toca la KB)
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/run-eval.mts --validate

# 4) LA NOTA DE PARTIDA: medir de verdad contra la KB real
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/run-eval.mts --run
```

El paso 4 imprime una tabla como esta (los números son inventados de ejemplo):

```
Resultados de recuperación (top-5, recall por tema):
  tema                         casos  R@1   R@3   R@5   must-not✗
  glucemia                        7   71%   86%  100%   0
  hierro-anemia                   6   67%   83%   83%   1
  ...
  TOTAL                          43   70%   88%   95%   2
```

- **R@3** = % de veces que la tarjeta correcta salió entre las 3 primeras. Es la
  métrica guía. Cuanto más alto, mejor.
- **must-not✗** = veces que una tarjeta prohibida se coló por encima de la
  correcta. Cuanto más bajo, mejor (idealmente 0).

## Qué hacer con el resultado

Copia y **pégame la tabla completa** del paso 4 (y los "casos que fallan" si los
lista debajo). Con esa foto de partida podremos:

1. ver dónde falla hoy la búsqueda (antes de tocar nada);
2. calibrar `minScore` y decidir el filtro `KB_MARKER_SCOPE` con datos;
3. encender el uso del mapa (grafo) y volver a medir para confirmar que **sube**.

No sale ningún dato personal en esta tabla: solo preguntas de prueba y nombres de
tarjetas.
