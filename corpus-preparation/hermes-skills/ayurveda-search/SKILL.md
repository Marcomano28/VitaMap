---
name: ayurveda-search
description: Busca, extrae y clasifica fuentes Ayurveda para tarjetas VitaMap a partir de un tema.
metadata:
  hermes:
    requires_toolsets: [web, file]
---

# Ayurveda Search

## Uso

Usa esta skill cuando el usuario de un tema Ayurveda y haya que preparar fuentes
para tarjetas VitaMap.

## Procedimiento

1. Deriva un slug ASCII del tema.
2. Crea la carpeta:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/`
3. Antes de buscar, crea:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/RUNNING.md`
   con tema, fecha y estado `iniciado`.
4. Usa `web_search` y despues `web_extract`. No aceptes resultados sin extraer,
   salvo como pista marcada.
5. Busca primero fuentes primarias o cercanas a primarias; despues fuentes
   academicas; despues seguridad si el tema implica hierbas, preparados o uso
   clinico.
6. Guarda el resultado en:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/SOURCES.md`

Si no puedes crear `RUNNING.md`, no continues. Responde exactamente:

```markdown
## File tool bloqueado
- Ruta intentada:
- Error:
```

## Fuentes Preferidas

T1/pasajes clasicos:

- `carakasamhitaonline.com`
- `sushrutaproject.org`
- `sushrutaproject1.github.io`
- `saktumiva.org`
- `wisdomlib.org`
- `archive.org` solo si hay pagina/capitulo verificable y texto extraible.

T2/T3 contexto y evidencia:

- `pmc.ncbi.nlm.nih.gov`
- `pubmed.ncbi.nlm.nih.gov`
- `ncbi.nlm.nih.gov/books`
- `frontiersin.org`
- `plos.org`
- `nature.com/scientificreports`

Seguridad:

- `nccih.nih.gov`
- `ncbi.nlm.nih.gov/books` / LiverTox
- `mskcc.org`
- `ema.europa.eu`
- `efsa.europa.eu`
- `ods.od.nih.gov`
- `fda.gov`

Identidad botanica:

- `powo.science.kew.org`
- `worldfloraonline.org`
- `gbif.org`

## Clasificacion

En `SOURCES.md`, clasifica cada fuente como:

- `T1-candidate`: pasaje clasico verificable.
- `T1-blocked`: pista clasica sin texto verificable.
- `T2`: contexto academico, historico o conceptual.
- `T3`: evidencia cientifica moderna.
- `M2`: uso medicinal tradicional documentado.
- `M3`: evidencia moderna de producto natural.
- `M4`: seguridad, interacciones, toxicidad o calidad.

## Criterio de Exito

La skill termina bien solo si existe `SOURCES.md` con:

- tema;
- fecha;
- consultas usadas;
- URLs extraidas;
- clasificacion por capa;
- limitaciones.

No termines solo con una lista en chat.
