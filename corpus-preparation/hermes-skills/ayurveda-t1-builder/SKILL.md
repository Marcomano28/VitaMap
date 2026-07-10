---
name: ayurveda-t1-builder
description: Construye solo tarjetas T1 Ayurveda para VitaMap cuando hay pasaje clasico verificable.
metadata:
  hermes:
    requires_toolsets: [file]
---

# Ayurveda T1 Builder

## Uso

Usa esta skill despues de `ayurveda-search`, leyendo `SOURCES.md`.

## Puerta T1

Una T1 solo es valida si hay:

- obra clasica identificada;
- capitulo/seccion y numeracion interna cuando exista;
- URL estable donde verificar el pasaje;
- separacion clara entre texto base, traduccion, comentario y resumen.

No es T1:

- pagina conceptual;
- revision narrativa;
- glosario;
- pagina que solo enumera referencias;
- PDF no extraido.

## Procedimiento

1. Lee `SOURCES.md`.
2. Si hay una fuente `T1-candidate` que pasa la puerta T1, crea una tarjeta:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/<tarjeta_id>.md`
3. Si no hay T1 valida, crea:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/T1-BLOCKED.md`

## T1-BLOCKED.md

Debe contener:

- tema;
- motivo concreto;
- mejor pista encontrada;
- que faltaria para convertirla en T1;
- si puede cubrirse como T2.

## Criterio de Exito

La skill termina bien si crea una tarjeta T1 valida o `T1-BLOCKED.md`.
No preguntes al usuario que variante del concepto quiere si el tema ya es amplio.
