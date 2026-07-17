---
name: curiosities-knowledge-background-research
description: Dado un tema, generar tarjetas de curiosidad (Pausa curiosa) candidatas para VitaMap, guardarlas como .md v2 y enviarlas por email como adjuntos.
metadata:
  hermes:
    requires_toolsets: [web, file]
---

# Skill: tarjetas de curiosidad (Pausa curiosa) para VitaMap

## Contrato

El usuario solo dara un tema o un marcador. Tu trabajo es producir el paquete
completo:

1. Buscar fuentes institucionales con `web_search`.
2. Extraer fuentes candidatas con `web_extract`.
3. Decidir automaticamente el alcance de la tarjeta.
4. Redactar una tarjeta C `.md` candidata en formato VitaMap v2.
5. Guardarla en `/opt/data/outbox/vitamap-curiosidades/<slug-tema>/`.
6. Enviarla por email como adjunto `.md` usando `email:himalaya`.

No preguntes al usuario que alcance quiere salvo que el tema sea realmente
ambiguo entre dos ideas distintas. Decide tu mismo y documenta la decision en
`MANIFEST.md`.

Este skill hereda y **no puede contradecir** `PROMPT-PAUSA-CURIOSA.md`,
`PROMPT-INVESTIGACION-RAG.md` y `corpus-taxonomy.json`. Si difieren, aplica la
regla mas restrictiva.

Si no puedes usar `web_search` y `web_extract`, no redactes tarjetas. Responde:

```markdown
## No listo
- Motivo:
- Herramienta faltante:
- Accion necesaria:
```

## Que es una buena curiosidad

Una tarjeta C desarrolla **una sola idea memorable** sobre el cuerpo, una
medicion o un mecanismo. Despierta curiosidad sin diagnosticar, aconsejar,
vender, alarmar ni soltar una cifra llamativa fuera de contexto. Debe leerse en
menos de dos minutos (180-350 palabras).

El patron que mejor engancha es "**tu intuicion sobre esta medicion es
incorrecta**" (por que la creatinina no mide directamente el riñon; por que el
magnesio en sangre no refleja el total del cuerpo). Prioriza ese tipo de idea
sobre datos-curiosos sueltos.

## Alcance editorial

Elige uno y registralo en `MANIFEST.md`:

```text
marker             relacionada con un marcador concreto ya en la taxonomia
system             relacionada con un sistema fisiologico
body-general       curiosidad general sobre el cuerpo (reserva)
research-frontier  resultado cientifico reciente; exige fecha de revision
```

- Si el tema o marker existe en `corpus-taxonomy.json`, usalo y **no** añadas
  `curiosity_scope`.
- Si no existe, propon un `topic` (no lo declares como `marker`) y marca
  `taxonomy_status: proposed`. Mientras siga `proposed`, la tarjeta NO es
  publicable; guardala en `pausa-curiosa-general`.
- Antes de redactar, comprueba que no exista ya una tarjeta C equivalente y que
  la idea no pertenezca en realidad a A (interpretacion), B (alimentacion),
  D (lectura conjunta) o E (seguimiento).

## Puerta de fuentes

Prioriza en este orden: organismos publicos de salud y ciencia; sociedades
cientificas y consensos; revisiones sistematicas; estudios primarios solo
cuando la pregunta lo exige y explicando sus limites.

Para estadisticas exige poblacion, unidad, periodo, metodo y variabilidad. No
uses blogs, infografias sin procedencia, agregadores, notas de prensa como
unica fuente, ni fuentes que prohiban derivados o ingestion. Un hecho popular
no es una fuente: rechaza cifras tipo "perdemos X de piel al año" si no hay
referencia adecuada.

Distingue observacion / asociacion / mecanismo / efecto clinico / aplicacion
disponible. No conviertas un mecanismo plausible en beneficio, una asociacion
en causa, ni un estudio reciente en avance clinico consolidado. Si la certeza
no es alta, declara `motivos_descenso` segun el contrato de evidencia.

Si no hay fuente suficiente, no redactes. Escribe:

```markdown
## Curiosidad bloqueada
- Tema:
- Motivo:
- Mejor fuente encontrada:
```

## Seguridad y tono

- No uses memoria ni valores personales. No digas "esto explica tu resultado".
- No recomiendes pruebas, suplementos, alimentos, tratamientos ni dosis.
- No uses "increible", "milagroso", "secreto", "hack" ni titulares de sorpresa.
- No infantilices ni conviertas moleculas en personajes con voluntad.
- Una metafora incluye siempre anclaje literal y limite.
- Incluye 3-5 `limitations`; el limite aparece en cuerpo y frontmatter.

## Formato de tarjeta (esquema editorial v2)

Cada tarjeta es un `.md` independiente. `source_url` es URL cruda, no Markdown.
`publication_date` es la fecha de la fuente, no la de hoy. No uses `doi: null`
ni `muestra: none`. `marker`, `categoria`, `sistema`, `area_de_salud`, `alias`
y `relacionado_con` usan solo valores canonicos; una relacion se declara solo
si la fuente la sostiene e incluye direccion.

La Pausa curiosa es una superficie **determinista**: el titulo y el cuerpo se
escriben y revisan en `content_locale`. No se traducen al vuelo. Una version
alemana/inglesa es una rendicion aparte con el mismo `canonical_card_id`, su
propio `tarjeta_id--de`/`--en`, `localization_kind: translation` y
`localized_from` + version + checksum; empieza como `machine-draft`.

Plantilla:

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
dominio: laboratorio            # o el dominio que corresponda
tipo:
  - analito                     # segun taxonomia
marker:
  - <marker-canonico>           # omitir si es body-general/research-frontier
seccion: curiosidad
evidence:
  certeza: alta                 # o declara motivos_descenso
limitations:
  - "..."
  - "..."
  - "..."
# Solo para reserva general aun sin taxonomia aprobada:
# taxonomy_status: proposed
# topic:
#   - <id-propuesto>
# curiosity_scope: body-general   # o research-frontier
# review_after: "AAAA-MM-DD"      # obligatorio en research-frontier
---

<!-- vitamap:block fact -->
## El dato

[Una idea memorable en lenguaje claro.]

<!-- vitamap:block mechanism -->
## Por qué ocurre

[Explicacion accesible y verificable.]

<!-- vitamap:block limitations -->
## Qué se sabe y qué no

[Nucleo solido, limite concreto y, si ayuda, una pregunta abierta.]

<!-- vitamap:block sources -->
## Fuente principal

[Cita, fecha editorial visible y URL.]
```

IDs de bloque validos para curiosidad: `fact`, `mechanism`, `limitations`,
`sources`. El texto del H2 puede variar por idioma; el selector usa el ID.

## Guardado de archivos

- Tarjeta de marker o sistema ya en taxonomia:
  `/opt/data/outbox/vitamap-curiosidades/<slug-tema>/<tarjeta_id>.md`
- Reserva general o frontera (taxonomia propuesta), destino editorial:
  `source-material/borradores/pausa-curiosa-general/{estables|frontera}/`

Nombres ASCII, kebab-case, sin espacios. Nunca coloques un borrador en
`approved-current-structure` ni declares que esta aprobado.

Crea tambien `MANIFEST.md` con: tema; fecha de generacion; alcance elegido;
tarjeta generada o bloqueada; fuentes usadas; certeza declarada; limite que debe
conservarse; taxonomia usada o cambio propuesto; si requiere revision humana.

## Envio por email

Despues de guardar los `.md`, usa `email:himalaya` para enviarlos como adjuntos
(`MEDIA:/opt/data/outbox/.../archivo.md`).

- Destinatario: correo principal de Himalaya o el indicado por el usuario.
- Asunto: `VitaMap Curiosidades - <tema> - tarjeta candidata`
- Cuerpo breve: tarjeta adjunta; alcance; certeza; limite principal; ruta local.
- Adjunta todos los `.md`, incluido `MANIFEST.md`.

Si falla el email, informa:

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
- Alcance:
- Archivo:
- Email enviado a:
- Curiosidad bloqueada: si/no
- Limite que debe conservarse:
```

No incluyas el contenido completo de la tarjeta en el chat si ya la enviaste por
email.

## Checklist final

- [ ] Es una C real y no duplica A, B, D o E.
- [ ] Desarrolla una sola idea.
- [ ] Fuente, fecha y derechos verificados.
- [ ] Toda cifra tiene contexto suficiente.
- [ ] La certeza esta declarada honestamente.
- [ ] No usa ni insinua datos personales; no contiene recomendaciones.
- [ ] El limite aparece en cuerpo y frontmatter.
- [ ] Vocabulario canonico; frontmatter v2 completo.
- [ ] `content_locale` coincide con titulo, cuerpo y limitaciones.
- [ ] Cuerpo con anchors `vitamap:block` (fact, mechanism, limitations, sources).
- [ ] research-frontier lleva `review_after`; taxonomia nueva va como `proposed`.
