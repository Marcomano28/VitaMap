---
name: curiosities-search
description: Busca, extrae y clasifica fuentes institucionales para tarjetas de curiosidad (Pausa curiosa) de VitaMap a partir de un tema.
metadata:
  hermes:
    requires_toolsets: [web, file]
---

# Curiosities Search

## Uso

Usa esta skill cuando el usuario de un tema o marcador y haya que preparar
fuentes para una tarjeta de curiosidad (Pausa curiosa) de VitaMap.

## Procedimiento

1. Deriva un slug ASCII, kebab-case, desde el tema.
2. Crea la carpeta:
   `/opt/data/outbox/vitamap-curiosidades/<slug>/`
3. Antes de buscar, crea:
   `/opt/data/outbox/vitamap-curiosidades/<slug>/RUNNING.md`
   con tema, fecha y estado `iniciado`.
4. Usa `web_search` y despues `web_extract`. No aceptes resultados sin extraer,
   salvo como pista marcada.
5. Prioriza en este orden: organismos publicos de salud y ciencia; sociedades
   cientificas y consensos; revisiones sistematicas; estudios primarios solo
   cuando la pregunta lo exige.
6. Guarda el resultado en:
   `/opt/data/outbox/vitamap-curiosidades/<slug>/SOURCES.md`

Si no puedes crear `RUNNING.md`, no continues. Responde exactamente:

```markdown
## File tool bloqueado
- Ruta intentada:
- Error:
```

## Fuentes preferidas

- Organismos: `medlineplus.gov`, `nih.gov`, `ods.od.nih.gov`, `niddk.nih.gov`,
  `nhlbi.nih.gov`, `niams.nih.gov`, `cdc.gov`, `who.int`, `efsa.europa.eu`,
  `ema.europa.eu`.
- Evidencia: `pmc.ncbi.nlm.nih.gov`, `pubmed.ncbi.nlm.nih.gov`,
  `ncbi.nlm.nih.gov/books`, sociedades cientificas y consensos.
- Frontera (con fecha de revision): repositorios de organismos publicos de
  ciencia y revistas de acceso con procedencia clara.

Evita blogs, infografias sin procedencia, agregadores, notas de prensa como
unica fuente y cualquier fuente que prohiba derivados o ingestion. Un hecho
popular no es una fuente.

## Consultas base

Adapta al tema:

```text
site:medlineplus.gov <tema>
site:ods.od.nih.gov <tema>
site:pmc.ncbi.nlm.nih.gov <tema> review
site:pubmed.ncbi.nlm.nih.gov <tema>
"<tema>" mechanism review DOI
```

Para estadisticas, exige poblacion, unidad, periodo, metodo y variabilidad.

## SOURCES.md

Debe incluir:

- tema;
- fecha;
- consultas usadas;
- fuentes extraidas con URL, titulo, tipo candidato y notas;
- fuentes rechazadas y motivo;
- limite editorial principal.

Clasifica cada fuente como:

- `institucional`
- `revision-sistematica`
- `estudio-primario`
- `frontera`
- `pista`
- `rechazada`

## Criterio de exito

La skill termina bien si crea `RUNNING.md` y `SOURCES.md` con al menos una
fuente adecuada clasificada, o deja constancia de que no hay fuente suficiente.
