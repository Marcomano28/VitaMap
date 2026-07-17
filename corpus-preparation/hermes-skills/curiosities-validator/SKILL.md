---
name: curiosities-validator
description: Valida tarjetas de curiosidad VitaMap (frontmatter v2, seguridad y anchors) y genera MANIFEST.md.
metadata:
  hermes:
    requires_toolsets: [file]
---

# Curiosities Validator

## Uso

Usa esta skill cuando ya existan tarjetas candidatas en
`/opt/data/outbox/vitamap-curiosidades/<slug>/`.

No instales dependencias ni uses `pip`, `npm`, `python` ni validadores YAML
externos. La validacion es una lectura textual del archivo escrito.

## Procedimiento

1. Lee todos los `.md` de la carpeta del tema (al menos las primeras 45 lineas
   de cada tarjeta).
2. Revisa cada tarjeta.
3. Corrige errores simples en los archivos.
4. Crea o actualiza `MANIFEST.md`.

## La tarjeta pasa solo si

- la primera linea del archivo es exactamente `---` y hay un `---` de cierre;
- `seccion: curiosidad` y `source_type: science-curiosity-summary`;
- contrato v2 presente: `content_locale`, `canonical_card_id`,
  `localization_kind`, `localization_status`, `editorial_schema_version: 2`;
- `tarjeta_id` == `<canonical_card_id>--<content_locale>`, en minusculas y
  kebab-case, e identico al nombre del archivo sin `.md`;
- `localization_status` es `draft` o `machine-draft` (nunca `reviewed`; eso lo
  fija la publicacion administrativa humana);
- el cuerpo usa anchors `<!-- vitamap:block <id> -->` con IDs validos
  (`fact`, `mechanism`, `limitations`, `sources`); estan al menos `fact`,
  `limitations` y `sources`;
- hay 3-5 `limitations` y el limite tambien aparece en el cuerpo;
- `source_url` es URL cruda, no Markdown; no hay `doi: null`, `pmid: null` ni
  `muestra: none`;
- `marker`, `categoria`, `sistema`, `area_de_salud`, `alias` y
  `relacionado_con` usan solo valores canonicos; toda relacion incluye direccion;
- si `taxonomy_status: proposed`, la tarjeta NO se marca publicable y el tema va
  en `topic`, no en `marker`;
- si `curiosity_scope: research-frontier`, existe `review_after`;
- no hay datos personales ni frases del tipo "esto explica tu resultado";
- no hay recomendaciones (pruebas, suplementos, alimentos, tratamientos, dosis);
- no hay lenguaje sensacionalista ("increible", "milagroso", "secreto", "hack");
- toda cifra tiene contexto (poblacion, unidad, periodo, metodo, variabilidad);
- `content_locale` coincide con el idioma de titulo, cuerpo y limitaciones.

Si falla cualquier punto, reescribe la tarjeta antes de crear `MANIFEST.md`.

## MANIFEST.md

Debe listar:

- tema;
- fecha de generacion;
- ruta local;
- alcance elegido (`marker` / `system` / `body-general` / `research-frontier`);
- archivos generados (solo los que existen, con nombre exacto);
- tarjetas bloqueadas y motivo;
- fuentes usadas y certeza declarada;
- limite que debe conservarse;
- taxonomia usada o cambio propuesto (`topic` propuesto si aplica);
- revision humana requerida: si.

## Criterio de exito

La skill termina bien solo si `MANIFEST.md` existe y lista todos los archivos del
paquete, y ninguna tarjeta listada como valida incumple las reglas anteriores.
