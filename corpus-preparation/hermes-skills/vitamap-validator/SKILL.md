---
name: vitamap-validator
description: Valida tarjetas Markdown VitaMap, revisa YAML basico y genera MANIFEST.md.
metadata:
  hermes:
    requires_toolsets: [file]
---

# VitaMap Validator

## Uso

Usa esta skill cuando ya existan tarjetas candidatas en
`/opt/data/outbox/vitamap-ayurveda/<slug>/`.

## Procedimiento

1. Lee todos los `.md` de la carpeta del tema.
2. Revisa cada tarjeta:
   - frontmatter abre y cierra con `---`;
   - `title`, `source_url`, `source_type`, `tarjeta_id`, `tradicion` existen;
   - no hay `doi: null`, `pmid: null`, `muestra: none`;
   - `source_url` no esta en formato Markdown;
   - `traditional-primary-source-summary` solo aparece si hay T1 valida;
   - no hay equivalencias biomedicas indebidas.
3. Corrige errores simples en los archivos.
4. Crea o actualiza:
   `/opt/data/outbox/vitamap-ayurveda/<slug>/MANIFEST.md`

## MANIFEST.md

Debe listar:

- tema;
- fecha de generacion;
- ruta local;
- archivos generados;
- fuentes usadas;
- capas generadas;
- capas bloqueadas;
- advertencias editoriales;
- si requiere revision humana.

## Criterio de Exito

La skill termina bien solo si `MANIFEST.md` existe y lista todos los archivos
del paquete.
