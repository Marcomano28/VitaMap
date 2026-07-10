---
name: ayurveda-knowledge-background-research
description: Dado un tema, generar tarjetas Markdown candidatas para VitaMap sobre Ayurveda, guardarlas como .md y enviarlas por email como adjuntos.
metadata:
  hermes:
    requires_toolsets: [web, file]
---

# Skill: tarjetas Ayurveda para VitaMap

## Contrato

El usuario solo dara un tema. Tu trabajo es producir el paquete completo:

1. Buscar fuentes con `web_search`.
2. Extraer fuentes candidatas con `web_extract`.
3. Decidir automaticamente que tarjetas hacen falta.
4. Redactar tarjetas `.md` candidatas en formato VitaMap.
5. Guardarlas en `/opt/data/outbox/vitamap-ayurveda/<slug-tema>/`.
6. Enviarlas por email como adjuntos `.md` usando `email:himalaya`.

No preguntes al usuario que capa quiere salvo que el tema sea realmente ambiguo
entre dos conceptos distintos. Si el tema es amplio, cubre el concepto amplio y
trata subtipos como contexto.

Prohibido terminar con una lista de "fuentes candidatas" sin generar archivos
`.md`, salvo que no haya ninguna fuente suficiente o falten herramientas. Si una
T1 no es posible, genera la T2 disponible. No digas "si me confirmas..." ni
pidas elegir entre "Agni general", "Jatharagni" o "ambos" cuando el usuario ya
dio un tema amplio: decide tu mismo y documenta la decision en `MANIFEST.md`.

Si no puedes usar `web_search` y `web_extract`, no redactes tarjetas. Responde:

```markdown
## No listo
- Motivo:
- Herramienta faltante:
- Accion necesaria:
```

## Capas

Genera solo las capas justificadas por fuentes:

| Capa | Uso | `source_type` |
|---|---|---|
| T1 | Pasaje clasico verificable | `traditional-primary-source-summary` |
| T2 | Contexto academico/historico/conceptual | `traditional-scholarly-context-summary` |
| T3 | Evaluacion cientifica moderna | `traditional-evidence-review-summary` |
| M2 | Uso medicinal documentado de especie/preparado | `traditional-medicinal-use-summary` |
| M3 | Evidencia moderna de producto natural | `natural-product-evidence-summary` |
| M4 | Seguridad, interacciones, toxicidad, calidad | `natural-product-safety-summary` |

Regla practica:

- Concepto ayurvedico: intenta T1; si no hay pasaje clasico verificable, bloquea
  T1 y genera T2 si hay fuente academica.
- Especie/preparado: intenta M2, M3 y M4.
- Biomarcador moderno: genera solo fondo tematico, nunca equivalencia.

## Tres salidas editoriales

Cada tarjeta candidata debe tener una funcion clara:

- `hub`: concepto Ayurveda autonomo. Define el concepto, sus variantes y su
  lugar dentro del marco Ayurveda. Debe poder leerse sin depender de una
  analitica moderna.
- `relacion-interna`: conexion entre conceptos Ayurveda, por ejemplo
  Rasa -> Rakta, Agni -> Ama, Dhatu -> Srotas o Pitta -> Rakta. Estas
  conexiones van en el cuerpo, no como markers inventados.
- `puente-editorial`: comparacion limitada con un area de salud o biomarcador
  moderno. Solo se crea si la relacion es honesta; no es una equivalencia.

Registra en `MANIFEST.md` que tarjetas son `hub`, `relacion-interna` y
`puente-editorial`. No obligues a Ayurveda a seguir la estructura de la
analitica. La relacion con la biomedicina debe funcionar como figura-fondo:
a veces hay punto de contacto tematico, a veces la linea debe quedar cortante.

## Regla figura-fondo para facets

Antes de redactar cada tarjeta, decide si su funcion editorial permite facets
biomedicos:

- `hub`: usa solo la red Ayurveda (`dominio: tradiciones-practicas`,
  `tipo: [concepto_tradicional]`, `marker: [ayurveda]`, `seccion: tradicion`,
  `tradicion: ayurveda`, `alias`). No uses `sistema`, `area_de_salud`,
  `categoria` ni `muestra`.
- `relacion-interna`: igual que `hub`; las relaciones Rasa -> Rakta, Rakta ->
  Pitta, Dhatu -> Srotas van en el cuerpo, no en markers ni facets biomedicos.
- `puente-editorial`: solo aqui puedes usar facets del biomarcador moderno. El
  primer parrafo debe separar planos: "Biomedicina mide/describe X; Ayurveda
  organiza el terreno desde Y, sin equivalencia directa".

La traduccion aproximada no basta para abrir facets. Ejemplos:

- `rakta` traducido como "sangre" no autoriza `sistema: [hematologico]`.
- `raktavaha srotas` no autoriza `sistema: [cardiovascular]`.
- `pitta` cerca de bilis/calor no autoriza `hepatobiliar`.

Si una tarjeta `hub` o `relacion-interna` contiene `sistema`, `area_de_salud`,
`categoria` o `muestra`, se considera fallo de validacion y debe reescribirse
antes de crear `MANIFEST.md`.

## Puerta T1

Una T1 solo es valida si tienes todo esto:

- obra clasica identificada;
- capitulo/seccion y numeracion interna cuando exista;
- URL estable donde pueda verificarse el pasaje;
- separacion clara entre texto base, traduccion, comentario y resumen.

No es T1:

- una pagina conceptual tipo `.../index.php/Agni`;
- una revision narrativa;
- un glosario;
- una pagina que solo enumera referencias clasicas;
- un PDF que no pudiste extraer.

Si no hay T1 valida, no la redactes. En el resumen final escribe:

```markdown
## T1 bloqueada
- Tema:
- Motivo:
- Mejor fuente encontrada:
- Puede cubrirse como T2: si/no
```

## Sitios recomendados

Usa primero estos sitios. Evita paginas comerciales, clinicas y escuelas.

### T1: textos clasicos y pasajes

- `carakasamhitaonline.com`: buscar capitulos/pasajes, no solo paginas conceptuales.
  - Prioridad para Caraka.
  - Una pagina conceptual sirve como T2/pista, no T1.
- `sushrutaproject.org`, `sushrutaproject1.github.io`, `saktumiva.org/wiki/wujastyk/susrutasamhita/`:
  - Prioridad para Susruta y ediciones del Susruta Project.
- `wisdomlib.org`:
  - Usar como respaldo si da capitulo/pasaje verificable.
  - Marcar limitacion de traduccion/edicion.
- `archive.org`:
  - Solo si puedes identificar volumen/capitulo/pagina; si no puedes extraer, no usar como T1.

### T2/T3: contexto academico y evidencia

- `pmc.ncbi.nlm.nih.gov`
- `pubmed.ncbi.nlm.nih.gov`
- `ncbi.nlm.nih.gov/books`
- `frontiersin.org`
- `plos.org`
- `nature.com/scientificreports`
- `sciencedirect.com` solo si el resumen accesible basta para evaluar; si no, usar como pista.

### M4: seguridad

- `nccih.nih.gov`
- `ncbi.nlm.nih.gov/books/NBK547852/` y LiverTox en NCBI Bookshelf
- `mskcc.org`
- `ema.europa.eu` / HMPC
- `efsa.europa.eu`
- `ods.od.nih.gov`
- `fda.gov` para alertas/contaminacion/adulteracion si aplica.

### Identidad botanica

- `powo.science.kew.org`
- `worldfloraonline.org`
- `gbif.org`

## Consultas base

Adapta al tema:

```text
"<tema>" Ayurveda site:pmc.ncbi.nlm.nih.gov
"<tema>" Ayurveda site:pubmed.ncbi.nlm.nih.gov
"<tema>" Ayurveda review DOI
"<tema>" Caraka Samhita chapter
"<tema>" Sushruta Samhita chapter
"<termino sanscrito>" "Cha.Sa." Ayurveda
"<termino sanscrito>" "Su.Sa." Ayurveda
"<especie>" Ayurveda traditional use safety
"<especie>" NCCIH safety
```

Para sanscrito busca con y sin diacriticos:

```text
agni / jatharagni / jāṭharāgni
ama / āma
prakriti / prakṛti
dosha / doṣa
srotas / srotamsi
dhatu / dhātu
ojas / ojas
rasayana / rasāyana
```

## Formato de tarjeta

Cada tarjeta debe ser un archivo Markdown independiente con frontmatter.

Reglas:

- `source_url` debe ser URL cruda, no Markdown.
- Omite `doi`, `pmid`, `muestra` si no aplican.
- `publication_date` es fecha de publicacion/edicion de la fuente, no fecha de hoy.
- No uses `doi: null`.
- No uses `muestra: none`.
- Si el marker no existe en taxonomia, usa `marker: [ayurveda]` y pon el concepto en `alias`.
- No inventes markers como `rasa`, `rakta`, `agni`, `ama`, `ojas`, `pitta`,
  `dhatu` o `srotas` si no existen en la taxonomia leida.
- En tarjetas `hub` y `relacion-interna`, omite siempre `sistema`,
  `area_de_salud`, `categoria` y `muestra`; si esos facets son necesarios,
  reclasifica la tarjeta como `puente-editorial`. Para `rakta`, por ejemplo,
  no uses `hematologico` ni `salud-cardiovascular` solo porque una traduccion
  aproximada sea "sangre".
- En una tarjeta `puente-editorial`, usa los facets canonicos del biomarcador
  moderno y conserva `seccion: tradicion` y `tradicion: ayurveda`.
- No crees tarjetas de indice o enumeracion si no aportan una intencion
  recuperable distinta. Los sinonimos, subtipos o listas breves van en `alias`
  o en una seccion del hub.
- No uses `traditional-primary-source-summary` salvo que pase la puerta T1.
- No incluyas citas literales largas; parafrasea.
- Incluye siempre `limitations`.
- No conviertas conceptos ayurvedicos en biomarcadores ni diagnosticos modernos.

Plantilla:

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
# ...
```

## Guardado de archivos

Guarda cada tarjeta en:

```text
/opt/data/outbox/vitamap-ayurveda/<slug-tema>/<tarjeta_id>.md
```

Usa nombres ASCII, kebab-case, sin espacios.

Si generas varias tarjetas, crea tambien:

```text
/opt/data/outbox/vitamap-ayurveda/<slug-tema>/MANIFEST.md
```

El `MANIFEST.md` debe listar:

- tema;
- fecha de generacion;
- tarjetas generadas;
- tarjetas bloqueadas;
- fuentes usadas;
- advertencias editoriales.
- Red Ayurveda autonoma: hubs y relaciones internas cubiertas.
- Puentes editoriales: puentes creados, descartados y motivo.
- Propuesta de ampliacion de taxonomia si un concepto podria merecer marker
  canonico futuro, sin usarlo todavia como marker.

## Envio por email

Despues de guardar los `.md`, usa `email:himalaya` para enviarlos como adjuntos.
Si estas respondiendo a un email mediante el gateway de Hermes, incluye cada
adjunto como `MEDIA:/opt/data/outbox/.../archivo.md`.

Requisitos del email:

- Destinatario: correo principal configurado en Himalaya o la direccion indicada por el usuario.
- Asunto: `VitaMap Ayurveda - <tema> - tarjetas candidatas`
- Cuerpo breve:
  - tarjetas adjuntas;
  - tarjetas bloqueadas;
  - advertencias principales;
  - ruta local en Hermes.
- Adjuntar todos los `.md`, incluido `MANIFEST.md`.

No pegues las tarjetas completas en el cuerpo del email salvo que el envio de
adjuntos falle. Si falla el email, informa:

```markdown
## Email no enviado
- Motivo:
- Archivos generados:
- Ruta:
```

## Salida en chat

Despues de enviar el email, responde solo:

```markdown
## Paquete generado
- Tema:
- Archivos:
- Email enviado a:
- T1 bloqueada: si/no
- Advertencia principal:
```

No incluyas el contenido completo de las tarjetas en el chat si ya las enviaste
por email.
