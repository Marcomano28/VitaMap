---
name: ayurveda-t2-builder
description: Construye tarjetas T2 Ayurveda para VitaMap desde fuentes academicas extraidas.
metadata:
  hermes:
    requires_toolsets: [file]
---

# Ayurveda T2 Builder

## Uso

Usa esta skill despues de `ayurveda-search`, especialmente cuando T1 esta
bloqueada o cuando el tema necesita contexto academico.

## Procedimiento

1. Lee `SOURCES.md`.
2. Elige la mejor fuente `T2`; prioriza revisiones en PMC/PubMed con DOI/PMID.
3. Antes de redactar, clasifica la tarjeta candidata como una de estas salidas:
   - `hub`: concepto Ayurveda autonomo.
   - `relacion-interna`: conexion entre conceptos Ayurveda.
   - `puente-editorial`: comparacion limitada con un area de salud o
     biomarcador moderno.
4. Crea al menos una tarjeta T2 si existe una fuente academica suficiente:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/<tarjeta_id>.md`
5. Si hay varias fuentes con funciones distintas, crea tarjetas separadas solo
   cuando aporten capas diferentes.

## Reglas Editoriales

- No presentes conceptos Ayurveda como equivalentes biomedicos.
- No fuerces un puente biomédico. Para conceptos Ayurveda autonomos usa
  `marker: [ayurveda]` y pon el concepto real en `title`, `alias` y cuerpo.
- En tarjetas `hub` y `relacion-interna`, omite siempre `sistema`,
  `area_de_salud`, `categoria` y `muestra`, salvo que hayas reclasificado la
  tarjeta como `puente-editorial`. La traduccion aproximada no basta para
  abrir facets: `rakta` como "sangre" no autoriza `hematologico`, `raktavaha
  srotas` no autoriza `cardiovascular`, y `pitta` no autoriza `hepatobiliar`.
- Si una tarjeta `hub` o `relacion-interna` contiene esos facets, falla la
  validacion y debes reescribirla antes de continuar.
- Usa facets del biomarcador moderno solo en una tarjeta `puente-editorial`,
  cuando la fuente sostenga un punto de contacto tematico honesto.
- Las relaciones entre conceptos Ayurveda no canonicos van en el cuerpo, en
  "Conexiones internas del marco ayurvedico"; no inventes markers como `rakta`,
  `rasa`, `agni`, `ama`, `ojas`, `pitta` o `dhatu`. Escribe cada conexion como
  `concepto-A -> predicado -> concepto-B` con los verbos canonicos de
  `docs/REGISTRO-PREDICADOS.md` (`es_un_tipo_de`, `se_transforma_en`,
  `se_relaciona_con_srotas`, `nutre`, `deriva_de`, `se_expresa_por`), para poder
  convertirlas luego en aristas del grafo. Hoy van solo en el cuerpo.
- No crees tarjetas de indice o enumeracion si no aportan una intencion
  recuperable distinta. Integra listas breves de subtipos o sinonimos en
  `alias` y en el cuerpo del hub.
- Parafrasea; evita citas largas.
- Incluye `limitations`.
- Usa fecha real de publicacion si esta disponible; no uses la fecha de hoy
  como `publication_date`.
- `source_url` debe ser URL cruda, no Markdown.
- No uses `doi: null`, `pmid: null` ni `muestra: none`.

## Frontmatter Minimo

```markdown
---
title: "..."
source_url: "https://..."
doi: "..."
pmid: "..."
publication_date: "AAAA-MM-DD"
source_kind: tradition-context
source_type: traditional-scholarly-context-summary
rights_status: permitted
facets_version: 1
tarjeta_id: ...
dominio: tradiciones-practicas
tipo:
  - concepto_tradicional
marker:
  - ayurveda
seccion: tradicion
tradicion: ayurveda
alias:
  - ...
limitations:
  - "..."
---
```

Omite campos sin valor real.

Para un `puente-editorial`, sustituye `dominio`, `tipo`, `marker`, `categoria`,
`muestra`, `sistema` y `area_de_salud` por los facets canonicos del biomarcador
moderno, conserva `seccion: tradicion` y `tradicion: ayurveda`, y escribe en el
cuerpo que no hay equivalencia directa.

## Criterio de Exito

La skill termina bien solo si crea al menos una tarjeta T2 cuando hay fuente
academica suficiente. Si no puede, crea `T2-BLOCKED.md` con motivo y fuentes
probadas.
