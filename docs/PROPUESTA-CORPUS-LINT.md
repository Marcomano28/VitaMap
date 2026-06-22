# Propuesta: `corpus:lint`, un gate de integridad de tarjetas hermano de `taxonomy:check`

Versión 0.1 · 2026-06-23
Estado: propuesta de tooling · documento vivo

## 1. Propósito

`taxonomy:check` garantiza que el **vocabulario generado**
(`apps/web/lib/generated/marker-vocabulary.ts`) está sincronizado con la fuente
de verdad (`corpus-preparation/corpus-taxonomy.json`). Es un gate rápido,
determinista y sin red.

No existe un gate equivalente para las **tarjetas del corpus**
(`corpus-preparation/approved-current-structure/**/*.md`): que cada frontmatter
use facetas válidas y que el bloque `evidence` cumpla la política. Hoy esa
validación existe **a medias y como test**, no como gate de primera clase. Esta
propuesta la promueve a un comando `corpus:lint` y cierra los huecos.

> En una frase: `taxonomy:check` valida la **taxonomía**; `corpus:lint` valida
> que **las tarjetas la respeten**.

## 2. Qué ya existe (no reinventar)

[`apps/web/scripts/test-marker-taxonomy.ts`](../apps/web/scripts/test-marker-taxonomy.ts)
ya recorre las tarjetas de `approved-current-structure/` y valida:

- `marker` usa solo markers canónicos.
- `relacionado_con` apunta solo a markers canónicos.
- La **forma** del bloque `evidence` cuando está presente (`certeza` requerida y
  dentro de `{alta, moderada, baja, muy-baja}`; `direccion` válida) — el
  Contrato mínimo de evidencia v0, cuya definición canónica vive en
  [`corpus-preparation/PROMPT-INVESTIGACION-RAG.md`](../corpus-preparation/PROMPT-INVESTIGACION-RAG.md)
  §3 bis y su tipo en
  [`apps/web/lib/frontmatter.ts`](../apps/web/lib/frontmatter.ts).
- Coherencia de `query_groups` y `health_area_routes` con los markers.

La propuesta **reutiliza** ese núcleo; no lo duplica.

## 3. Los huecos que cierra

Tres cosas que hoy **no** se validan y que ya han causado deriva real (las
primeras tarjetas de cloruro traían `sistema: renal` en vez de `renal-urinario`
y un `area_de_salud: equilibrio-hidroelectrolitico` inexistente; ninguna habría
sido detectada):

1. **Vocabulario cerrado de facetas.** Hoy se validan `marker`, `relacionado_con`
   y `area_de_salud` (vía rutas), pero **no** `sistema`, `categoria`, `muestra`,
   `tipo`, `dominio`, `tradicion`, `seccion`, `source_kind`, `source_type`. Esas
   facetas se escriben a mano y derivan en silencio.

2. **Alcance de `evidence` (política, no solo forma).** Hoy se valida la forma
   *si* el bloque está; no se exige **cuándo** debe estar ni cuándo sobra:
   - **Obligatorio** si la tarjeta afirma eficacia/asociación:
     `source_kind: clinical-evidence`, o `seccion ∈ {evidencia, seguridad}`.
   - **Omitido** en tarjetas descriptivas (`interpretacion`, `alimentacion-factores`,
     `curiosidad`, identidad/tradición): no hay efecto que graduar. Si se quiere
     marcar "consenso institucional" en una A, debe ser **otro campo**
     (p. ej. `consenso: institucional`), no reutilizar `certeza` con otro
     significado — esa ambigüedad es el principal defecto actual.

3. **Gate de primera clase.** Hoy la comprobación corre dentro de
   `test:marker-taxonomy` (un test). Un `corpus:lint` independiente, rápido y con
   código de salida claro encaja en pre-commit/CI igual que `taxonomy:check`, y
   da mensajes accionables por archivo.

## 4. Forma propuesta del comando

Mismo patrón que el generador de vocabulario (un script `tsx`, exit code, modo
`--check`):

```jsonc
// apps/web/package.json  → scripts
"corpus:lint":  "node --import tsx scripts/lint-corpus.ts",
"corpus:lint:fix": "node --import tsx scripts/lint-corpus.ts --fix"  // opcional, fase 2
```

- **Sin flags:** valida todas las tarjetas, imprime un informe por archivo y sale
  `1` si hay errores (gate de CI / pre-commit).
- **`--fix` (opcional, más adelante):** normalizaciones seguras y mecánicas
  (p. ej. `renal` → `renal-urinario` por alias declarado, orden de claves), nunca
  cambios de contenido.

Salida ejemplo:

```
corpus:lint — 301 tarjetas, 2 con problemas

✖ cloruro/cloruro-interpretacion-medlineplus.md
    sistema: 'renal' no es vocabulario válido (¿'renal-urinario'?)
✖ bergamota/bergamota-perfil-lipidico-evidencia-nccih.md
    seccion 'evidencia' requiere bloque 'evidence' (Contrato v0) — ausente

2 errores. Ver docs/PROPUESTA-CORPUS-LINT.md §3.
```

## 5. Checks (v1)

| # | Check | Fuente de verdad |
|---|---|---|
| 1 | `marker` y `relacionado_con` canónicos | `CANONICAL_MARKERS` (ya en test) |
| 2 | `sistema`, `categoria`, `muestra`, `tipo`, `dominio`, `tradicion` ∈ vocabulario cerrado | **nuevo** `facet_vocabularies` en la taxonomía (ver §6) |
| 3 | `seccion` ∈ valores de `sections_by_source_type`; `source_type` ∈ sus claves | `corpus-taxonomy.json` |
| 4 | `source_kind` ∈ `{institutional-education, clinical-evidence, tradition-context}` | `facet_vocabularies` |
| 5 | Forma de `evidence` (Contrato v0) | reutiliza `evidenceProblems()` del test |
| 6 | **Alcance** de `evidence` (obligatorio/omitido por tipo de tarjeta) | **nuevo**, §3.2 |
| 7 | `tarjeta_id` = `<carpeta>-<archivo>` y único | convención ya en uso |
| 8 | Campos requeridos presentes (`title`, `source_url`, `marker`, `seccion`, …) | `EvidenceFrontmatter` |

## 6. Cambio de raíz que lo habilita: vocabulario de facetas explícito

Hoy `sistema`/`categoria`/etc. no tienen una lista cerrada declarada en ningún
sitio: el conjunto válido es, implícitamente, "lo que ya se usó". Por eso la
deriva no se detecta. La propuesta añade un bloque a `corpus-taxonomy.json`:

```jsonc
"facet_vocabularies": {
  "sistema": ["cardiovascular", "renal-urinario", "endocrino-metabolico", "..."],
  "categoria": ["electrolitos", "perfil-lipidico", "..."],
  "muestra": ["suero", "plasma", "sangre-total", "orina", "saliva"],
  "tipo": ["analito", "mineral", "electrolito", "hormona", "panel", "..."],
  "dominio": ["laboratorio", "sustancias-naturales", "tradiciones-practicas", "metodologia-preanalitica"],
  "source_kind": ["institutional-education", "clinical-evidence", "tradition-context"]
}
```

Esto convierte la taxonomía en la única fuente de verdad también para las
facetas, y `corpus:lint` solo la consulta. (Migración: generar la lista inicial a
partir de los valores ya en uso, revisar a mano para fijar canónicos, y a partir
de ahí queda cerrada.)

## 7. Relación con los gates existentes

- **No duplica** `test-marker-taxonomy.ts`: lo ideal es **extraer** el núcleo de
  recorrido + validación de evidencia a un módulo compartido
  (`lib/corpus-validate.ts`) que consuman tanto el test como `corpus:lint`.
- **Encadenado** en `test:marker-taxonomy` y en CI junto a `taxonomy:check`,
  `typecheck` y `lint`.
- Mantiene la filosofía del repo: gates rápidos, deterministas, sin red.

## 8. Despliegue por fases (respetar lo heredado)

271 de 299 tarjetas no tienen `evidence` hoy, y varias facetas legacy podrían
no estar en el vocabulario inicial. Para no romper de golpe:

1. **Fase 0 — modo aviso.** `corpus:lint --warn` no falla; solo lista. Se corre
   el inventario y se fija `facet_vocabularies`.
2. **Fase 1 — enforce facetas.** Checks 1–4, 7, 8 fallan en CI. Las facetas son
   baratas de corregir.
3. **Fase 2 — enforce evidence.** Checks 5–6 fallan **solo para tarjetas nuevas o
   tocadas** (diff contra `main`), evitando un backfill masivo; el legacy se
   migra por lotes.

## 9. Decisiones abiertas

- ¿`certeza` en tarjetas A se elimina o se renombra a `consenso`? (recomendado:
  renombrar; ver §3.2).
- ¿`facet_vocabularies` se mantiene a mano o se deriva semiautomáticamente?
- ¿`--fix` entra en v1 o se pospone?

## 10. Referencias

- Contrato mínimo de evidencia v0: `corpus-preparation/PROMPT-INVESTIGACION-RAG.md` §3 bis.
- Dirección metodológica (Tramo 2): [DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md](DIRECCION-METODOLOGICA-EVIDENCIA-Y-GRAFO.md).
- Tipo de frontmatter: [apps/web/lib/frontmatter.ts](../apps/web/lib/frontmatter.ts).
- Validación existente: [apps/web/scripts/test-marker-taxonomy.ts](../apps/web/scripts/test-marker-taxonomy.ts).
- Cobertura de ángulos (mantenimiento del corpus): [COBERTURA-CORPUS-ANGULOS-DEBILES.md](COBERTURA-CORPUS-ANGULOS-DEBILES.md).
