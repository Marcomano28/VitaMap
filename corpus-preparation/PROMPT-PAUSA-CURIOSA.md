# Prompt de investigación · Pausa curiosa de VitaMap

Versión 0.2 · 2026-07-13
Estado: brief especializado para preparar tarjetas C candidatas

## 1. Contexto

VitaMap puede mostrar una **Pausa curiosa**: una tarjeta científica breve que
permite cambiar de perspectiva dentro del chat sin interpretar datos personales.

Tu tarea es investigar y redactar una tarjeta C publicable como borrador. Debes
seguir también:

- `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`;
- `PROMPT-INVESTIGACION-RAG.md` para frontmatter, evidencia y derechos;
- `corpus-taxonomy.json` para vocabulario canónico.

Si estos documentos difieren, aplica la regla más restrictiva.

## 2. Objetivo

La tarjeta debe desarrollar **una sola idea memorable** sobre el cuerpo, una
medición o un mecanismo. Debe despertar curiosidad sin diagnosticar, aconsejar,
vender, alarmar ni presentar una cifra llamativa fuera de contexto.

Puede pertenecer a uno de estos alcances editoriales:

```text
marker             relacionada con un marcador concreto
system             relacionada con un sistema fisiológico
body-general       curiosidad general sobre el cuerpo
research-frontier  resultado científico reciente; requiere fecha de revisión
```

Para tarjetas ya cubiertas por la taxonomía canónica, no añadas
`curiosity_scope`. Para la reserva editorial
`source-material/borradores/pausa-curiosa-general`, puede conservarse como
metadato provisional junto a `taxonomy_status: proposed`; el administrador
bloquea la publicación de esos borradores.

## 3. Antes de investigar

1. Revisa si ya existe una tarjeta C equivalente.
2. Comprueba si el tema o marker existe en `corpus-taxonomy.json`.
3. Si no existe, propón primero un `topic`; no lo presentes como `marker`.
4. Define la pregunta exacta que responderá.
5. Explica por qué esta idea merece una pausa y no pertenece a A, B, D o E.

No crees una tarjeta solo para aumentar el catálogo.

## 4. Fuentes

Prioriza:

1. organismos públicos de salud y ciencia;
2. sociedades científicas y consensos;
3. revisiones sistemáticas;
4. estudios primarios solo cuando la pregunta lo exige y se explican sus
   límites.

Para hechos estables, busca una fuente institucional clara. Para estadísticas,
exige población, unidad, periodo, método y variabilidad. No uses blogs,
infografías sin procedencia, agregadores, notas de prensa como única fuente ni
artículos que prohíban derivados o ingestión.

Un hecho popular no es una fuente. Ejemplos como “perdemos X kilogramos de piel
al año” o “todas las células de este órgano viven X días” deben rechazarse si no
existe una referencia adecuada o si resumen poblaciones celulares distintas en
una cifra engañosa.

## 5. Frontera científica

Distingue:

- observación;
- asociación;
- mecanismo;
- efecto clínico;
- aplicación disponible.

No conviertas un mecanismo plausible en beneficio, una asociación en causa ni
un estudio reciente en avance clínico consolidado. Si la certeza no es alta,
declara `motivos_descenso` según el contrato de evidencia.

## 6. Seguridad y tono

- No uses memoria ni valores personales.
- No digas “esto explica tu resultado”.
- No recomiendes pruebas, suplementos, alimentos, tratamientos o dosis.
- No uses “increíble”, “milagroso”, “secreto”, “hack” o titulares de sorpresa.
- No infantilices ni conviertas moléculas en personajes con voluntad.
- Una metáfora debe incluir anclaje literal y límite.
- La curiosidad debe poder leerse en menos de dos minutos.

## 7. Estructura de la tarjeta

```markdown
# [Gancho preciso y no sensacionalista]

## El dato
[Una idea memorable en lenguaje claro.]

## Por qué ocurre
[Explicación accesible y verificable.]

## Qué se sabe y qué no
[Núcleo sólido, límite concreto y pregunta abierta solo si ayuda.]

## Fuente principal
[Cita, fecha editorial visible y URL.]
```

Longitud orientativa: 180–350 palabras.

## 8. Frontmatter mínimo

Usa el contrato completo del brief principal. Para este tipo:

```yaml
canonical_card_id: id-conceptual-compartido
content_locale: es
localization_kind: original
localization_status: draft
editorial_schema_version: 1
source_type: science-curiosity-summary
seccion: curiosidad
evidence:
  certeza: alta
```

Incluye 3–5 `limitations`. `marker`, `categoria`, `sistema`, `area_de_salud`,
`alias` y `relacionado_con` deben usar únicamente valores canónicos. Una
relación se declara solo si la fuente la sostiene y siempre incluye dirección.

La Pausa curiosa es una superficie determinista: el título y el cuerpo deben
estar escritos y revisados en `content_locale`. No traduzcas una curiosidad al
vuelo. Una versión alemana o inglesa usa el mismo `canonical_card_id`, un
`tarjeta_id` propio y `localization_kind: translation`; el flujo añade
`localized_from`, versión y checksum. Comienza como `machine-draft`, pasa a
`draft` tras una segunda revisión editorial explícita y solo la publicación
administrativa la convierte en `reviewed`.

Para una tarjeta de la reserva general cuya taxonomía aún no se ha aprobado,
usa además:

```yaml
taxonomy_status: proposed
topic:
  - id-propuesto-en-PROPUESTA-TAXONOMIA
curiosity_scope: body-general # o research-frontier
review_after: "YYYY-MM-DD"
```

Mientras `taxonomy_status` siga siendo `proposed`, la tarjeta no es publicable.
No añadas el tema propuesto a `marker` para superar artificialmente la
validación.

## 9. Entrega

Entrega primero una auditoría breve:

```text
Pregunta que responde:
Alcance propuesto:
Tarjeta C equivalente existente: sí/no
Fuente principal y derechos:
Idea memorable:
Límite que debe conservarse:
Taxonomía utilizada o cambio propuesto:
Recomendación: preparar / no preparar
```

Después entrega un único bloque Markdown completo marcado como **borrador para
revisión humana**. Las curiosidades generales o de frontera van a
`source-material/borradores/pausa-curiosa-general`; no declares que están
aprobadas ni las coloques en `approved-current-structure`.

## 10. Checklist

- [ ] Es una C real y no duplica A, B, D o E.
- [ ] Solo desarrolla una idea.
- [ ] Fuente, fecha y derechos están verificados.
- [ ] Toda cifra tiene contexto suficiente.
- [ ] La certeza está declarada honestamente.
- [ ] No utiliza ni insinúa datos personales.
- [ ] No contiene recomendaciones.
- [ ] El límite aparece en cuerpo y frontmatter.
- [ ] El vocabulario coincide con la taxonomía.
- [ ] Puede mostrarse directamente sin que el LLM la reescriba.
- [ ] Su `content_locale` coincide con título, cuerpo y limitaciones.
