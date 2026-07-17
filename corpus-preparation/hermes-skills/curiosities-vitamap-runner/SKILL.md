---
name: curiosities-vitamap-runner
description: Genera un paquete con una tarjeta de curiosidad (Pausa curiosa) VitaMap desde un unico tema, usando web_search, web_extract y escritura de archivos.
metadata:
  hermes:
    requires_toolsets: [web, file]
---

# Curiosities VitaMap Runner

## Contrato

El usuario da solo un tema o un marcador. Ejecuta herramientas y escribe
archivos. No des un plan, no pidas alcance, no termines con fuentes candidatas.

Uso previsto desde Telegram:

```text
/curiosities-vitamap-runner Tema: <tema>
```

Tambien acepta:

```text
/curiosities-vitamap-runner Tema: <tema> Email: <correo>
```

Si no se indica email, usa el destinatario principal configurado en Himalaya si
esta disponible. Si no hay email, entrega los `.md` como documentos descargables
en Telegram.

Salida minima obligatoria en una sola ejecucion:

```text
/opt/data/outbox/vitamap-curiosidades/<slug>/RUNNING.md
/opt/data/outbox/vitamap-curiosidades/<slug>/SOURCES.md
/opt/data/outbox/vitamap-curiosidades/<slug>/<tarjeta>.md o C-BLOCKED.md
/opt/data/outbox/vitamap-curiosidades/<slug>/MANIFEST.md
/opt/data/outbox/vitamap-curiosidades/<slug>/EMAIL.md
```

Si una fase falla, escribe el archivo de bloqueo correspondiente y continua con
las fases posibles. No esperes otra sesion.

## Regla de arranque y presupuesto de herramientas

Las primeras acciones con herramientas deben ser de archivo, no de investigacion:

1. deriva un slug ASCII, kebab-case, desde el tema;
2. crea la carpeta `/opt/data/outbox/vitamap-curiosidades/<slug>/`;
3. escribe `RUNNING.md` con tema, fecha y estado `iniciado`;
4. escribe un `SOURCES.md` inicial con estado `pendiente`;
5. solo despues busca fuentes.

Si no puedes crear `RUNNING.md`, detente y responde exactamente:

```markdown
## File tool bloqueado
- Ruta intentada:
- Error:
```

Presupuesto operativo:

- Usa como maximo 4 busquedas web iniciales.
- Extrae como maximo 4 fuentes antes de decidir la tarjeta.
- Si la investigacion no alcanza, escribe `C-BLOCKED.md` con el motivo.
- Ante cualquier limite de iteraciones, deja el paquete revisable: `RUNNING.md`,
  `SOURCES.md`, bloqueo si aplica y `MANIFEST.md`.
- Nunca termines diciendo solo que "lo siguiente seria generar el paquete".
  Genera siempre los archivos minimos posibles primero.

## Procedimiento rigido

1. Crea carpeta, `RUNNING.md` y `SOURCES.md` inicial (regla de arranque).
2. Busca con `web_search` y extrae con `web_extract`. Prioriza organismos
   publicos de salud y ciencia, luego consensos y revisiones sistematicas, luego
   estudios primarios solo si la pregunta lo exige. Escribe `SOURCES.md`.
3. Elige alcance y registralo en `MANIFEST.md` mas adelante:
   `marker` (existe en taxonomia), `system`, `body-general` o
   `research-frontier`. Si el tema no esta en `corpus-taxonomy.json`, proponlo
   como `topic` con `taxonomy_status: proposed` (no publicable).
4. Comprueba que la idea sea una C real y no pertenezca a A, B, D o E, y que no
   duplique una curiosidad existente. Si pertenece a otra seccion o duplica,
   escribe `C-BLOCKED.md`.
5. Redacta UNA tarjeta con la regla de una sola idea (180-350 palabras) en
   formato v2 (ver "Frontmatter v2" y "Anchors"). Si no hay fuente suficiente,
   escribe `C-BLOCKED.md`.
6. Lee de vuelta la tarjeta y ejecuta la validacion mecanica de esta skill. Si
   falla, reescribela antes de continuar.
7. Escribe `MANIFEST.md` solo despues de que la validacion pase.
8. Entrega el paquete por email si es posible; si no, por documentos Telegram.
9. Responde en chat solo con rutas de archivos creados y estado de entrega.

## Seguridad y tono

- No uses memoria ni valores personales; no digas "esto explica tu resultado".
- No recomiendes pruebas, suplementos, alimentos, tratamientos ni dosis.
- No uses "increible", "milagroso", "secreto", "hack" ni titulares de sorpresa.
- No infantilices ni conviertas moleculas en personajes con voluntad.
- Una metafora incluye anclaje literal y limite.
- Distingue observacion / asociacion / mecanismo / efecto clinico / aplicacion.
  No conviertas un mecanismo en beneficio ni una asociacion en causa.
- Toda cifra necesita poblacion, unidad, periodo, metodo y variabilidad.

Prefiere el patron "tu intuicion sobre esta medicion es incorrecta"; engancha
mas que un dato-curioso suelto.

## Frontmatter v2

`source_url` es URL cruda. `publication_date` es la fecha de la fuente, no la de
hoy. No uses `doi: null` ni `muestra: none`.

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
# Solo reserva general/frontera aun sin taxonomia aprobada:
# taxonomy_status: proposed
# topic:
#   - <id-propuesto>
# curiosity_scope: body-general   # o research-frontier
# review_after: "AAAA-MM-DD"      # obligatorio en research-frontier
---
```

`tarjeta_id` es identico al nombre del archivo sin `.md`, en minusculas y
kebab-case. La primera linea real del archivo debe ser exactamente `---`.

## Anchors del cuerpo

```markdown
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

IDs validos: `fact`, `mechanism`, `limitations`, `sources`. El texto del H2
puede variar por idioma; el selector usa el ID. La Pausa curiosa es una
superficie determinista: no traduzcas al vuelo. Una version alemana/inglesa es
una rendicion aparte con el mismo `canonical_card_id`, su `tarjeta_id--de`/`--en`,
`localization_kind: translation`, `localized_from` + version + checksum; empieza
como `machine-draft`.

## Destino editorial

- Marker o sistema ya en taxonomia: la carpeta de salida del paquete.
- Reserva general o frontera (taxonomia `proposed`): destino editorial
  `source-material/borradores/pausa-curiosa-general/{estables|frontera}/`. Nunca
  `approved-current-structure`; nunca la declares aprobada.

## Validacion mecanica obligatoria

Despues de escribir la tarjeta, lee el archivo. La tarjeta pasa solo si:

- la primera linea es `---` y hay un `---` de cierre del frontmatter;
- `seccion: curiosidad` y `source_type: science-curiosity-summary`;
- estan `content_locale`, `canonical_card_id`, `localization_kind`,
  `localization_status`, `editorial_schema_version: 2`;
- `tarjeta_id` == `<canonical_card_id>--<content_locale>` y == nombre del archivo
  sin `.md`, en minusculas y kebab-case;
- `localization_status` es `draft` o `machine-draft` (nunca `reviewed`);
- el cuerpo usa anchors `<!-- vitamap:block <id> -->` con al menos `fact`,
  `limitations` y `sources`;
- hay 3-5 `limitations` y el limite aparece tambien en el cuerpo;
- `source_url` no es Markdown; no hay `null`, `none`, `doi: null` ni
  `muestra: none`;
- `marker`/`categoria`/`sistema`/`area_de_salud`/`alias`/`relacionado_con` usan
  solo valores canonicos; si el tema es nuevo va en `topic` con
  `taxonomy_status: proposed`, no en `marker`;
- `research-frontier` incluye `review_after`;
- no hay datos personales, recomendaciones ni sensacionalismo;
- toda cifra tiene contexto suficiente;
- `content_locale` coincide con el idioma de titulo, cuerpo y limitaciones.

Si falla cualquier punto, reescribe antes de crear `MANIFEST.md`.

## MANIFEST.md

Debe listar (solo archivos que existen, con nombre exacto):

- tema; fecha; ruta;
- alcance elegido;
- archivos creados;
- tarjetas bloqueadas y motivo;
- fuentes usadas y certeza declarada;
- limite que debe conservarse;
- taxonomia usada o cambio propuesto (`topic` propuesto si aplica);
- revision humana requerida: si.

## Entrega Email / Telegram

Intenta entregar todos los `.md` del paquete. Si `email:himalaya` esta
disponible:

- envia los `.md` como adjuntos;
- asunto: `VitaMap Curiosidades - <tema> - tarjeta candidata`;
- destinatario: el indicado en `Email:` o el principal configurado;
- cuerpo breve: adjuntos, alcance, certeza, ruta local, revision humana;
- no pegues las tarjetas completas en el cuerpo.

Despues escribe `EMAIL.md` con estado (enviado/no-enviado), destinatario,
asunto, adjuntos y error si fallo.

Si el email no esta disponible o falla, no bloquees el paquete. Responde con las
rutas absolutas de los `.md`, cada una en su linea, y termina con:

```text
[[as_document]]
```

## Fallos

Si `web_search` o `web_extract` fallan, escribe `SOURCES.md` explicando el fallo
y continua con `C-BLOCKED.md` y `MANIFEST.md`. Si no puedes escribir archivos,
responde exactamente:

```markdown
## File tool bloqueado
- Ruta intentada:
- Error:
```
