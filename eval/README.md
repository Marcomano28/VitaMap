# Banco de evaluación de recuperación (Tramo 1)

Esta carpeta es la **regla de medir** del RAG: un conjunto de preguntas reales con
la tarjeta que *debería* recuperar cada una. Existe para que ninguna mejora
(acotación por marcador, grafo de relaciones, reranker, cambios de `minScore`) se
active sin datos que demuestren que **mejora y no empeora**. Es el Tramo 1 de
`docs/DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md` ("medir antes de afinar") y la
Etapa E0 de `docs/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md`.

## Qué hay

Un fichero YAML por tema (`perfil-lipidico.yml`, `glucemia.yml`, …). Cada caso:

```yaml
- query: "tengo la ferritina alta y la PCR alta, ¿tengo mucho hierro?"
  locale: es                 # es | de
  expected:                  # basta con que UNA salga en el top-3
    - pcr-ferritina-lectura-conjunta-ods
  must_not_prioritize:       # (opcional) no debe salir por encima de la esperada
    - hierro-interpretacion-medlineplus
  note: la ferritina sube con la inflamación; debe ganar el confounder
```

`expected` y `must_not_prioritize` citan tarjetas por su **nombre de archivo**
(sin `.md`), tal como viven en `corpus-preparation/approved-current-structure/`.

Muchos casos prueban a propósito las **conexiones del mapa** (`relacionado_con`):
preguntas donde leer dos valores juntos debe ganar a interpretar uno solo
(ferritina↔PCR, testosterona↔SHBG, glucosa↔HbA1c…). Así, cuando se encienda el
uso del grafo en recuperación, este banco dirá si de verdad ayuda.

## Cómo se ejecuta

```bash
cd apps/web
npx tsx scripts/run-eval.mts            # mide recall si hay KB; si no, valida
npx tsx scripts/run-eval.mts --validate # solo comprueba que las tarjetas existen
npx tsx scripts/run-eval.mts --k 5      # top-k (por defecto 5)
```

- **`--validate`** no necesita la KB: confirma que cada tarjeta citada existe en el
  corpus. Corre en cualquier entorno (útil en CI para que el banco no se pudra).
- El **modo normal** ejecuta la recuperación real y reporta `recall@1/@3/@5` por
  tema, en español y alemán, más las violaciones de `must_not_prioritize`.
  Necesita la KB poblada (`data/kb`), así que se ejecuta donde vive la KB (el VPS)
  o tras publicar el corpus localmente.

## Cómo se lee el resultado

- **recall@3** = la tarjeta correcta aparece entre las 3 primeras. Es la métrica
  guía (el chat entrega 3 tarjetas al modelo).
- **must-not✗** = veces que una tarjeta prohibida se colocó por encima de la
  esperada (fuga de tema o fuente tradicional ganando a una pregunta clínica).

Regla de oro: **primero se fija una línea base con estos números; después** se
calibra `minScore`, se decide `KB_MARKER_SCOPE` y se enciende el grafo — y cada
cambio se acepta solo si estos números mejoran.

## Cómo crece

Añade casos al fichero del tema (o crea un tema nuevo). Objetivo orientativo:
10–20 preguntas por tema, mezclando interpretación, lectura conjunta, alimentación
y curiosidad, en español y alemán. Cuando una pregunta real falle en producción,
conviértela en un caso aquí.
