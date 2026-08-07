# Preparacion del corpus

> **Qué se publica y qué no.** El repositorio público comparte el **método**
> —prompts de investigación, skills, scripts, taxonomía y el manual de creación
> de tarjetas— pero no el **contenido**. Las tarjetas del corpus permanecen en
> el disco local, en las rutas que se describen aquí, y git no las sigue (ver
> `.gitignore`). Los scripts y el flujo de trabajo funcionan igual.
>
> Se mantiene versionado el tema `approved-current-structure/vitamina-d/` como
> ejemplo normativo: cubre los cinco tipos de tarjeta (interpretación,
> alimentación, curiosidad, seguimiento temporal y fuente clásica), suficiente
> para reproducir el formato sin publicar el corpus entero.

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

- `PROMPT-INVESTIGACION-RAG.md`: interpretación, estilo de vida, lectura
  conjunta y seguimiento temporal.
- `BRIEF-TARJETA-D-lectura-conjunta.md`: módulo detallado para relaciones entre
  marcadores y lectura de paneles.
- `BRIEF-TARJETA-E-seguimiento-temporal.md`: módulo detallado para
  comparabilidad, variación y cambios entre mediciones.
- `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md`: curiosidad científica y capas
  tradicionales T1, T2 y T3.
- `PROMPT-INVESTIGACION-RAG-ACUPUNTURA.md`: corpus especializado de acupuntura.
- `PROMPT-INVESTIGACION-RAG-ESPECIES-MEDICINALES.md`: identidad, uso
  documentado, evidencia y seguridad de plantas, hongos, algas y
  cianobacterias.

El dossier piloto `approved-current-structure/curcuma/` contiene:

- M1: identidad de *Curcuma longa*, rizoma y formas de producto;
- M3: evidencia moderna para artrosis de rodilla;
- M4: seguridad, formulaciones de absorción aumentada y precauciones.

No incluye M2 por obligación. Una capa de uso tradicional debe añadirse solo
cuando exista una fuente histórica, regulatoria o académica suficientemente
precisa.

La estructura temática completa y la evolución prevista de la recuperación se
documentan en
`docs/es/arquitectura/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md`.

Las tarjetas biomédicas cumplen funciones distintas:

- A explica un marcador individual;
- B reúne factores cotidianos documentados;
- C aporta una idea científica memorable;
- D explica una relación o panel sin diagnosticar un caso;
- E explica cómo pensar cambios temporales sin calcular una tendencia personal.

D y E son opcionales. Solo se preparan cuando una fuente adecuada añade una
intención real y diferente de la tarjeta A.

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
