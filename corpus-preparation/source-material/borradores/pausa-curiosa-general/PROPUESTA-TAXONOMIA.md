# Propuesta de taxonomía · Curiosidades generales y frontera científica

Estado: propuesta para revisión; no modifica todavía `corpus-taxonomy.json`.

La taxonomía actual está organizada principalmente alrededor de analitos. Para
que una curiosidad general pueda relacionarse con un tema sin fingir que es un
marcador de laboratorio, se propone añadir una segunda familia de temas.

| ID propuesto | Alcance | Alias iniciales | Tarjetas de esta reserva |
|---|---|---|---|
| `remodelado-oseo` | Renovación coordinada del tejido óseo | remodelación ósea, hueso vivo | 1 |
| `renovacion-cutanea` | Formación y recambio de la barrera epidérmica | renovación de la piel, queratinocitos | 1 |
| `microbioma-humano` | Comunidades microbianas asociadas al cuerpo | microbiota, bacterias del cuerpo | 1 |
| `edicion-genetica` | Modificación dirigida de ADN con finalidad biomédica | CRISPR, edición de bases | 2 |
| `pangenoma-humano` | Referencia genómica que representa múltiples secuencias | pangenoma, referencia genómica | 1 |
| `senescencia-celular` | Células que dejan de dividirse y cambian su actividad | células senescentes, SenNet | 1 |

## Cableado propuesto

No se recomienda añadir estos valores a `marker_aliases`, porque `marker` ya
significa, de hecho, marcador o entidad biomédica del corpus actual. La base más
sólida sería incorporar un registro hermano:

```json
{
  "topic_aliases": {
    "remodelado-oseo": ["remodelacion osea", "hueso vivo"],
    "renovacion-cutanea": ["renovacion de la piel", "queratinocitos"],
    "microbioma-humano": ["microbioma", "microbiota"],
    "edicion-genetica": ["crispr", "edicion de bases"],
    "pangenoma-humano": ["pangenoma", "referencia genomica"],
    "senescencia-celular": ["celulas senescentes", "sennet"]
  }
}
```

Las futuras tarjetas usarían `topic`, no `marker`. El selector de curiosidades
compararía los temas canónicos de la conversación primero con `marker` y luego
con `topic`. Si no existe coincidencia, seguiría pudiendo elegir una curiosidad
general al azar.

## Decisiones pendientes

- Adoptar `topic` como faceta canónica o reutilizar otra ya existente.
- Añadir `curiosity_scope` con valores `marker`, `system`, `body-general` y
  `research-frontier`.
- Decidir si `research-frontier` se muestra con una etiqueta visible «Ciencia
  reciente» y su fecha.
- Definir una caducidad editorial obligatoria para frontera científica.

Hasta resolver estas decisiones, las tarjetas conservan el tema propuesto solo
como metadato de borrador y permanecen bloqueadas para publicación.
