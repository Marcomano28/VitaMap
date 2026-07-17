---
name: curiosities-builder
description: Construye una tarjeta de curiosidad (Pausa curiosa) VitaMap en formato v2 desde fuentes institucionales extraidas.
metadata:
  hermes:
    requires_toolsets: [file]
---

# Curiosities Builder

## Uso

Usa esta skill despues de `curiosities-search`, leyendo `SOURCES.md`.

## Alcance editorial

Antes de redactar, elige un alcance y registralo en `MANIFEST.md`:

```text
marker             relacionada con un marcador ya en corpus-taxonomy.json
system             relacionada con un sistema fisiologico
body-general       curiosidad general sobre el cuerpo (reserva)
research-frontier  resultado cientifico reciente; exige review_after
```

- Si el tema o marker existe en `corpus-taxonomy.json`, usalo y NO añadas
  `curiosity_scope`.
- Si no existe, propon un `topic` (no lo declares como `marker`) y marca
  `taxonomy_status: proposed`. Mientras siga `proposed`, la tarjeta NO es
  publicable.
- Comprueba que no exista una tarjeta C equivalente y que la idea no pertenezca
  en realidad a A (interpretacion), B (alimentacion), D (lectura conjunta) o
  E (seguimiento). Si pertenece a otra seccion, bloquea la curiosidad.

## Regla de una sola idea

La tarjeta desarrolla una sola idea memorable (180-350 palabras, lectura < 2
minutos). El patron que mejor engancha es "tu intuicion sobre esta medicion es
incorrecta". Distingue observacion / asociacion / mecanismo / efecto clinico /
aplicacion disponible: no conviertas un mecanismo en beneficio, una asociacion
en causa ni un estudio reciente en avance consolidado.

## Seguridad

- No uses memoria ni valores personales; no digas "esto explica tu resultado".
- No recomiendes pruebas, suplementos, alimentos, tratamientos ni dosis.
- No uses "increible", "milagroso", "secreto", "hack" ni titulares de sorpresa.
- No infantilices ni conviertas moleculas en personajes con voluntad.
- Una metafora incluye anclaje literal y limite.
- Incluye 3-5 `limitations`; el limite aparece en cuerpo y frontmatter.

## Procedimiento

1. Lee `SOURCES.md` y elige la mejor fuente.
2. Redacta una tarjeta:
   `/opt/data/outbox/vitamap-curiosidades/<slug>/<tarjeta_id>.md`
3. Si no hay fuente suficiente o la idea pertenece a otra seccion, crea:
   `/opt/data/outbox/vitamap-curiosidades/<slug>/C-BLOCKED.md`
   con tema, motivo y mejor fuente encontrada.

## Frontmatter v2 (obligatorio)

`source_url` es URL cruda, no Markdown. `publication_date` es la fecha de la
fuente, no la de hoy. No uses `doi: null` ni `muestra: none`. `marker`,
`categoria`, `sistema`, `area_de_salud`, `alias` y `relacionado_con` usan solo
valores canonicos; una relacion se declara solo si la fuente la sostiene e
incluye direccion.

```markdown
---
title: "[Gancho preciso, no sensacionalista]"
source_url: "https://..."
doi: "..."
pmid: "..."
publication_date: "AAAA-MM"
source_kind: institutional-education
source_type: science-curiosity-summary
rights_status: permitted
facets_version: 1
editorial_schema_version: 2
tarjeta_id: <canonical_card_id>--es
canonical_card_id: <marker-o-topic>-curiosidad-<idea>
content_locale: es
localization_kind: original
localization_status: draft
dominio: laboratorio
tipo:
  - analito
marker:
  - <marker-canonico>
seccion: curiosidad
evidence:
  certeza: alta
limitations:
  - "..."
  - "..."
  - "..."
# Solo para reserva general/frontera aun sin taxonomia aprobada:
# taxonomy_status: proposed
# topic:
#   - <id-propuesto>
# curiosity_scope: body-general   # o research-frontier
# review_after: "AAAA-MM-DD"      # obligatorio en research-frontier
---

<!-- vitamap:block fact -->
## El dato

...

<!-- vitamap:block mechanism -->
## Por qué ocurre

...

<!-- vitamap:block limitations -->
## Qué se sabe y qué no

...

<!-- vitamap:block sources -->
## Fuente principal

...
```

IDs de bloque validos: `fact`, `mechanism`, `limitations`, `sources`. El texto
del H2 puede variar por idioma; el selector usa el ID. La Pausa curiosa es una
superficie determinista: no traduzcas al vuelo. Una version alemana/inglesa es
una rendicion aparte con el mismo `canonical_card_id`, su `tarjeta_id--de`/`--en`
y `localization_kind: translation`; empieza como `machine-draft`.

## Destino editorial

- Marker o sistema ya en taxonomia: la carpeta de salida del paquete.
- Reserva general o frontera (taxonomia propuesta): destino final
  `source-material/borradores/pausa-curiosa-general/{estables|frontera}/`. Nunca
  la coloques en `approved-current-structure` ni la declares aprobada.

## Criterio de exito

La skill termina bien si crea una tarjeta C valida en formato v2 o `C-BLOCKED.md`
con motivo y fuentes probadas.
