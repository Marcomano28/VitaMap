# Preparacion del corpus

Esta carpeta contiene material editorial previo a su carga desde `/admin/corpus`.

No forma parte de `data/kb`, por lo que QMD no la indexa. Tampoco esta bajo
`apps/web/public`, de modo que los borradores no quedan publicados como archivos
web.

## Estructura

- `source-material/`: documentos originales, notas de trabajo y conversiones que
  aun requieren revision.
- `approved-current-structure/<tema>/`: dossiers revisados y aprobados con la
  estructura editorial vigente. Esta es la unica carpeta desde la que deben
  salir las nuevas cargas.
- `previously-uploaded/`: copia editorial de documentos preparados y subidos
  antes de adoptar la estructura por dossiers. No deben volver a cargarse de
  forma automatica ni se consideran ejemplos normativos del formato actual.

La separacion es editorial. Mover un archivo aqui no modifica `data/kb`, el
indice QMD ni los documentos que ya estan publicados en el VPS.

El primer dossier aprobado con la estructura vigente es
`approved-current-structure/colesterol-ldl/` y contiene:

- A: interpretacion general de la analitica;
- B: alimentacion y factores relacionados;
- C: curiosidad cientifica sobre LDL y HDL;
- T1: fuente clasica ayurvedica sobre `medas`, sin equipararlo con LDL.
- T2: contexto textual de la `Suśrutasaṃhitā` y sus manuscritos.
- T3: evaluacion cientifica moderna del guggulu frente al colesterol.

Los briefs de trabajo son:

- `PROMPT-INVESTIGACION-RAG.md`: interpretación y estilo de vida.
- `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`: curiosidad científica y capas
  tradicionales T1, T2 y T3.
- `PROMPT-INVESTIGACION-RAG-ACUPUNTURA.md`: corpus especializado de acupuntura.

La estructura temática completa y la evolución prevista de la recuperación se
documentan en
`docs/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md`.

## Flujo recomendado

1. Registrar la fuente primaria y su URL estable.
2. Preparar una sintesis centrada en una sola pregunta o unidad recuperable.
3. Verificar cada afirmacion, fecha, referencia y limitacion contra la fuente.
4. Mantener los resultados no aprobados fuera de
   `approved-current-structure/`.
5. Tras la revision conjunta, guardar la tarjeta en el dossier tematico de
   `approved-current-structure/<tema>/`.
6. Cargar el `.md` desde `/admin/corpus`; el panel importa su frontmatter.
7. Comprobar y corregir los metadatos importados antes de guardar.
8. Guardar primero como borrador.
9. Publicar solo despues de revisar procedencia, derechos y utilidad para RAG.
10. Probar una consulta que deba recuperar el documento y revisar la cita.

Los campos escritos expresamente en el formulario tienen prioridad sobre el
frontmatter. La importacion crea un borrador: nunca publica ni indexa el
documento automaticamente.
