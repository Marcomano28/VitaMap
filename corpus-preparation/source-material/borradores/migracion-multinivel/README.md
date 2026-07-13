# Migración piloto de tarjetas A a formato multinivel

Estado: borradores para revisión humana · no publicar automáticamente

## Alcance

Este lote migra dos tarjetas A y una tarjeta D existentes:

- colesterol LDL;
- glucosa en ayunas.
- lectura conjunta de glucosa en ayunas y HbA1c.

No crea nuevas intenciones ni sustituye todavía los documentos de
`approved-current-structure`. Cada borrador conserva el `tarjeta_id` de la
tarjeta publicada para preservar su identidad editorial. El administrador
actual reconoce la rendición española legacy mediante ese identificador y
exige una sustitución explícita; guardar el archivo como borrador no modifica
lo publicado.

Las rendiciones alemanas asociadas viven en
`../migracion-multinivel-de/`. Comparten `canonical_card_id`, tienen un
`tarjeta_id` propio y permanecen como `machine-draft` hasta revisión humana.

## Qué debe revisarse

1. Fidelidad de cada afirmación respecto a las fuentes declaradas.
2. Claridad y utilidad de la metáfora.
3. Que el límite de la metáfora sea comprensible.
4. Que la versión sencilla no suene infantil ni diagnóstica.
5. Que rangos y umbrales estén atribuidos como referencias generales.
6. Que las relaciones expresen lectura conjunta o pertenencia a un panel, no
   causalidad.
7. Que el frontmatter importado por `/admin/corpus` conserve `tarjeta_id`,
   `evidence`, `limitations` y `relacionado_con[].direccion`.

## Procedimiento de sustitución

1. Comparar el borrador con su versión en `approved-current-structure`.
2. Resolver las observaciones editoriales.
3. Confirmar que el VPS contiene la sustitución atómica y el contrato de
   rendiciones antes de publicar.
4. Cargarlo desde `/admin/corpus` y guardarlo primero como borrador.
5. Comprobar los metadatos importados y localizar la ruta publicada anterior.
6. Sustituir la versión anterior de forma controlada y reindexar.
7. Probar, como mínimo:
   - “¿Qué es el LDL?”;
   - “Explícamelo más fácil”;
   - “Quiero profundizar”;
   - “¿Qué es la glucosa en ayunas?”;
   - “¿Cómo se relaciona con HbA1c?”.
8. Confirmar que una pregunta general no muestra valores personales.

## Condición para publicar

El repositorio ya contiene la capa multinivel y la sustitución explícita por
concepto + idioma, pero ambas deben estar desplegadas en el VPS antes de publicar.
Hasta verificar esa versión desplegada, conservar estos archivos como
borradores. Publicarlos con una versión anterior podría crear resultados
duplicados y no garantizaría la composición por profundidad para la que fueron
redactados.

Las versiones alemanas no son publicables en su estado actual aunque el código
esté desplegado: requieren revisión lingüística y el cambio explícito de estado
que realiza el flujo administrativo.
