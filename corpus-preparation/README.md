# Preparacion del corpus

Esta carpeta contiene material editorial previo a su carga desde `/admin/corpus`.

No forma parte de `data/kb`, por lo que QMD no la indexa. Tampoco esta bajo
`apps/web/public`, de modo que los borradores no quedan publicados como archivos
web.

## Estructura

- `source-material/`: documentos originales, notas de trabajo y conversiones que
  aun requieren revision.
- `ready-to-upload/`: documentos breves, trazables y revisados que pueden cargarse
  mediante la interfaz administrativa.

## Flujo recomendado

1. Registrar la fuente primaria y su URL estable.
2. Preparar una sintesis centrada en una sola pregunta o unidad recuperable.
3. Verificar cada afirmacion, fecha, referencia y limitacion contra la fuente.
4. Guardar la version revisada en `ready-to-upload/`.
5. Cargar el `.md` desde `/admin/corpus`; el panel importa su frontmatter.
6. Comprobar y corregir los metadatos importados antes de guardar.
7. Guardar primero como borrador.
8. Publicar solo despues de revisar procedencia, derechos y utilidad para RAG.
9. Probar una consulta que deba recuperar el documento y revisar la cita.

Los campos escritos expresamente en el formulario tienen prioridad sobre el
frontmatter. La importacion crea un borrador: nunca publica ni indexa el
documento automaticamente.
