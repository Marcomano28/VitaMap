# Informe · Guía educativa del asistente y acotación del retrieval

Versión 1.1 · 2026-06-16
Estado: cambios aplicados en repo/corpus local + plan de validación VPS

Resume dos hilos de trabajo conectados: hacer que el asistente **guíe a
entender** la analítica sin dejar de respetar sus límites, y corregir que el
**retrieval cuele documentos de otro marcador**. Complementa, no sustituye, a
ADR-016 y a QMD-EVOLUCION §7.

---

## 1. El problema

### 1.1 Asistente evasivo
Ante *"¿qué me recomiendas?"* el asistente desviaba a una pregunta abierta sin
ayudar a entender el valor ni preparar la consulta con un profesional. Era
seguro (no diagnostica) pero **inútil**: el usuario se quedaba igual.

Restricción del producto (ADR-006/013): **no diagnostica, no prescribe, no fija
objetivos individuales**. Y las funciones interpretativas deben poder
desactivarse antes del piloto real (GUIA-OPERATIVA B-1). El consentimiento
posiciona VitaMap como herramienta **educativa**.

### 1.2 Retrieval que cuela documentos irrelevantes
En una pregunta sobre glucosa/LDL, el chat citó un documento de **pruebas
hepáticas**. Diagnóstico (confirmado en código y en los scores reales):

- Sin reranking, el `score` de QMD es **posicional** (1/posición), no de
  relevancia. El `minScore` actúa como recorte de ranking, **no como puerta de
  relevancia** → cualquier documento que quede en el top entra. (QMD-EVOLUCION
  §7, P0.)
- QMD 2.5.3 **no permite filtrar `search` por frontmatter**, solo por colección.
- El KB se consulta **entero** en cada pregunta: nada lo limita al marcador de
  la conversación.
- La cita no la "elige" el modelo: en `route.ts` las citas son **todos** los
  chunks recuperados. Por eso el documento irrelevante aparece como cita solo
  por haberse recuperado.

### 1.3 Lección de despliegue (corpus)
El corpus vivo está en el **volumen Docker** (`vitamap_data:/data/kb`),
construido vía `/admin/corpus`, y **no se versiona en git**. Publicar markdown
en `data/kb/` del repo + `git pull` NO actualiza el volumen y duplica lo que ya
existe. (Ver QMD-EVOLUCION §4.7.)

---

## 2. Cambios aplicados

Todo desactivable por configuración; nada cambia en producción hasta activarlo.

| Cambio | Dónde | Estado |
|---|---|---|
| **Regla 13** (guía educativa) tras flag `ASSISTANT_EDU_GUIDE` | `lib/llm.ts`, `app/api/chat/route.ts` | ✅ en `main` |
| Explica el marcador **en general** con fuentes citadas, sin interpretar el resultado personal; deriva al profesional | (prompt) | ✅ |
| **Suite de regresión** del chat (2 casos) | `test-data/chat-regression-cases.json` | ✅ en `main` |
| **ADR-016** + nota operativa B-1 | `docs/DECISIONS.md`, `GUIA-OPERATIVA` | ✅ en `main` |
| **Revert** del corpus duplicado en `data/kb/markers/` | (repo) | ✅ en `main` |
| **Acotación por marcador** (núcleo puro) tras flag `KB_MARKER_SCOPE` | `lib/marker-scope.ts` + test | ✅ en `main` |
| Cableado del filtro en `queryMemoryAndKB` (default off) | `lib/qmd.ts` | ✅ en `main` |
| **Taxonomía facetada del corpus** | `corpus-preparation/corpus-taxonomy.json` | ✅ local, sin commitear |
| **Backfill facetado** (`marker`, `seccion`, `area_de_salud`, etc.) | `corpus-preparation/scripts/backfill-facets.mjs` | ✅ local, sin commitear |
| Corpus local facetado | `corpus-preparation/approved-current-structure/` | ✅ 171 tarjetas, sin commitear |
| Import/admin preservan facets | `lib/corpus-admin.ts`, `lib/corpus-import.ts`, `lib/frontmatter.ts` | ✅ local, sin commitear |
| QMD expone facets al prompt | `lib/qmd.ts`, `lib/qmd-prompt.ts` | ✅ local, sin commitear |
| `marker-scope` prefiere `marker` explícito del frontmatter | `lib/marker-scope.ts` | ✅ local, sin commitear |
| Prompts de investigación alineados con facets | `PROMPT-INVESTIGACION-RAG*.md`, `BRIEF-TARJETA-D/E` | ✅ local, sin commitear |
| Preferencia de fuente para público alemán | `lib/source-locale.ts`, `lib/qmd.ts`, citas y prompts | ✅ local, sin commitear |

**Cómo funciona la acotación por marcador.** Con `KB_MARKER_SCOPE=true`,
`queryMemoryAndKB` pide más candidatos de KB, deriva los marcadores en juego de
la **memoria del usuario** (su analítica) + la pregunta, y filtra los
documentos al marcador correspondiente. Conservador: documentos transversales
(ayuno, interferencias) se conservan; si no se detecta marcador, no filtra. En
la analítica sintética, un documento hepático queda fuera de una conversación
de glucosa/LDL. Probado en `npm run test:marker-scope`.

Pruebas ejecutadas tras el facetado:

- `npm run test:marker-scope --workspace apps/web`
- `npm run test:marker-taxonomy --workspace apps/web`
- `npm run test:qmd-prompt --workspace apps/web`
- `npm run test:corpus-admin --workspace apps/web`
- `npm run typecheck --workspace apps/web`

---

## 3. Del campo `marker` a facets

`marker` sigue siendo la pieza que permite acotar el retrieval, pero ya no debe
vivir solo. La estructura "golden" pasa a ser un frontmatter facetado: cada
tarjeta declara qué es, de qué marcador trata, qué intención responde y en qué
áreas de salud debe aparecer.

Campos nuevos/normalizados:

- `facets_version`
- `tarjeta_id`
- `dominio`
- `tipo`
- `marker`
- `categoria`
- `muestra`
- `sistema`
- `area_de_salud`
- `seccion`
- `tradicion`
- `alias`
- `relacionado_con`

La taxonomía vive en `corpus-preparation/corpus-taxonomy.json`. Es el
vocabulario canónico que deben compartir las carpetas, el frontmatter, el
filtro por marcador y los prompts de generación.

### 3.1 Cómo se decide el facetado

1. **Documentos nuevos** → el **tema** que se le pide al prompt
   (`PROMPT-INVESTIGACION-RAG.md` trabaja "por tema"). El prompt debe escribir
   al menos `marker`, `source_type` y, cuando sea posible, los facets.
2. **Documentos existentes** → la **carpeta** en
   `approved-current-structure/` (ya están archivados por marcador:
   `colesterol-ldl/`, `glucosa-en-ayunas/`…). El nombre de la carpeta decide
   el tema base.
3. **Casos con decisión humana**:
   - **Multi-marcador** (`lectura-conjunta`, `panel`, `seguimiento`): cubren
     varios → `marker` es una **lista**, p. ej. `marker: [vitamina-d, calcio, fosfato, pth]`.
   - **Transversales** (`ayuno`, `interferencias-analiticas`, `micronutrientes`):
     no son de un marcador → `marker: general` (siempre relevante; el filtro los conserva).

### 3.2 Herramientas preparadas

- **Taxonomía** (`corpus-preparation/corpus-taxonomy.json`): define topics,
  aliases, grupos de consulta, secciones por `source_type`, relaciones y
  overrides por documento.
- **Vocabulario runtime generado**
  (`apps/web/lib/generated/marker-vocabulary.ts`): se deriva de la taxonomía
  con `npm run taxonomy:generate --workspace apps/web`. No se edita a mano.
- **Backfill** (`corpus-preparation/scripts/backfill-facets.mjs`): escribe los
  facets en las tarjetas existentes. **Dry-run por defecto**; `--write` para
  aplicar; `--root /data/kb` para apuntar al corpus vivo del VPS.
- **Resultado local**: 171 documentos leídos, 171 facetados, dry-run posterior
  con **0 documentos pendientes**.
- **Overrides resueltos**:
  - `vitamina-a` + `proteina-c-reactiva`
  - `vitamina-b6` + `proteina-c-reactiva`
  - `vitamina-e` + `colesterol-total`
  - `vitamina-k` + `tp-inr`
  - `leucocitos` como grupo/fórmula leucocitaria

### 3.3 Vocabulario

El valor de `marker` debe coincidir con las claves canónicas de
`corpus-taxonomy.json`. El runtime ya no mantiene una lista `CANONICAL`
hardcodeada en `lib/marker-scope.ts`: consume
`apps/web/lib/generated/marker-vocabulary.ts`, generado desde la taxonomía.

La taxonomía incluye `query_groups` para motivos de consulta o lenguaje de
usuario que no son markers reales. Ejemplo: `higado`, `perfil hepatico` o
`Leberwerte` expanden a `alt`, `ast`, `ggt` y `fosfatasa-alcalina`, pero
`higado` no debe aparecer en `marker:`.

Contrato de seguridad:

- `npm run taxonomy:generate --workspace apps/web` actualiza el vocabulario
  runtime.
- `npm run test:marker-taxonomy --workspace apps/web` falla si el generado no
  está sincronizado, si un `query_group` apunta a un marker inexistente o si
  una tarjeta local usa un marker fuera de la taxonomía.

Decisión tomada: `TP/INR` no es alias de vitamina K; es un marker propio
(`tp-inr`) relacionado con `vitamina-k`. Así una búsqueda por INR no arrastra
vitamina K de forma automática salvo que la tarjeta declare ambos markers.

### 3.4 Idioma y jurisdicción de la fuente

Como el público principal previsto es alemán, las tarjetas deben distinguir el
idioma de la **fuente enlazada** del idioma de la respuesta del chat.

Campos añadidos:

- `source_language`: idioma real de la página enlazada (`de`, `en`, `es`, `zh`, etc.).
- `source_jurisdiction`: marco principal de la fuente (`DE`, `EU`, `US`, `GB`, `INT`, etc.).

Regla editorial: para `locale=de`, VitaMap debe preferir fuentes alemanas o
europeas cuando exista una fuente equivalente, fiable y con derechos
compatibles. No se sustituye una fuente fuerte por una fuente alemana peor solo
por idioma. Si la mejor fuente está en inglés, se usa y se declara como tal.

Implementación actual:

- El backfill infiere `source_language`/`source_jurisdiction` desde `source_url`
  cuando es razonable.
- `queryMemoryAndKB` recibe el `locale` y pide más candidatos de KB cuando hay
  preferencia lingüística.
- Tras marker-scope, reordena candidatos para priorizar `de/DE`, luego `EU`,
  y finalmente fuentes en inglés cuando no hay alternativa alemana.
- El prompt QMD recibe `source_language` y `source_jurisdiction`.
- Las tarjetas de cita pueden mostrar el idioma y jurisdicción de la fuente.

---

## 4. Qué queda por hacer

### 4.1 Validación y aplicación en el VPS
- [ ] Hacer backup del volumen vivo `vitamap_data:/data/kb`.
- [ ] Copiar/poner disponible `corpus-taxonomy.json` y `backfill-facets.mjs` en
      el entorno desde donde se vaya a operar el corpus vivo.
- [ ] Ejecutar dry-run contra `/data/kb`:
      `node corpus-preparation/scripts/backfill-facets.mjs --root /data/kb`.
- [ ] Revisar que el resultado convence: conteos esperados, 0 sorpresas de
      `source_type`, multi-marcadores conocidos, sin cambios masivos ajenos al
      frontmatter.
- [ ] Si convence, aplicar:
      `node corpus-preparation/scripts/backfill-facets.mjs --root /data/kb --write`.
- [ ] Verificar en chat que las citas recuperadas ya traen atributos
      `marker`, `section`, `health_area` y `system`.
- [ ] Confirmar si hace falta reindexar QMD o basta con releer el markdown del
      volumen. Si hay duda, reiniciar/reindexar de forma controlada tras backup.
- [ ] En el próximo lote de contenido alemán, crear tarjetas equivalentes con
      fuentes DE/EU para validar la preferencia real en chat.

### 4.2 Validación de comportamiento
- [ ] Regla 13 contra Mistral: `ASSISTANT_EDU_GUIDE=true`, `LLM_PROVIDER=external`.
      Verificar respuesta **citada**, **sin interpretar el valor personal**, guardrail `safe`.
- [ ] Acotación por marcador: `KB_MARKER_SCOPE=true`. Repetir la pregunta de
      glucosa/LDL y comprobar que el doc hepático ya no aparece (logs `[chat] marker scope`).
- [ ] Re-validar la suite de regresión contra **Qwen3-4B local** antes del blindaje final (ADR-014).
- [ ] Decisión **Tarjetas B** (alimentación/factores): validar el caso
      `edu-guide-tarjeta-b-colesterol-01` (que se citen en descriptivo, no como pauta).

### 4.3 Prompts de investigación
- [x] Actualizar `PROMPT-INVESTIGACION-RAG.md` para que el frontmatter nuevo
      use la taxonomía facetada, no solo `marker`.
- [x] Añadir una fase previa de cobertura: grupo existente/nuevo, tarjetas A/B/C/D/E
      ya cubiertas, huecos internos, relaciones D/E necesarias y entrada de
      taxonomía requerida.
- [x] Actualizar `PROMPT-INVESTIGACION-RAG-ENRIQUECIMIENTO.md` para que las
      tarjetas C y capas tradicionales/prácticas nazcan con `seccion`,
      `tradicion` cuando corresponda y `area_de_salud`.
- [x] Actualizar prompts satélite: vitaminas/micronutrientes, especies
      medicinales, acupuntura y prácticas complementarias.
- [x] Corregir instrucciones antiguas que digan "no añadas todavía campos
      nuevos al frontmatter operativo"; ya no encajan con el facetado.
- [ ] Usar los prompts actualizados en el próximo lote nuevo y revisar una
      salida real antes de subir material al VPS.

### 4.4 Huecos de contenido
El facetado mejora la recuperación, pero no crea conocimiento que no existe. Hay
dos tipos de brecha:

- **Huecos dentro de grupos existentes**: completar tarjetas A/B/C/D/E o
  relaciones D/E ausentes.
- **Grupos enteros ausentes**: añadir topic a `corpus-taxonomy.json`, crear
  carpeta en `approved-current-structure/`, producir tarjetas y subirlas por
  `/admin/corpus`.

Huecos ya identificados como candidatos:

- `glucemia-insulina`: insulina, HOMA-IR.
- `perfil-lipidico`: ApoB, Lp(a).
- `perfil-hepatico`: bilirrubina, albúmina.
- `perfil-tiroideo`: T3 libre/total, anticuerpos tiroideos.
- `eje-suprarrenal-hormonas`: cortisol y paneles relacionados.
- `hematologia`: subtipos de fórmula leucocitaria si se decide modelarlos como
  markers propios.
- `coagulacion`: TP/INR como marker/panel formal.

### 4.5 Grupos puente por motivo de consulta (`area_de_salud`)
Los "grupos puente" para motivos de consulta difusos (`energia-fatiga`,
`estado-animo-estres`, `fertilidad`, `rendimiento-deportivo`, `sueño`) **no son
una taxonomía nueva**: ya existen como el campo `area_de_salud` que cada tarjeta
declara. Lo que falta no es el dato, sino el camino inverso —del motivo de
consulta ("estoy cansado") al área y a sus marcadores—, que es trabajo de
router, no de corpus.

Decisiones tomadas en la discusión:

- Reutilizar `area_de_salud`, **no** crear `query_groups` paralelos (evita
  reabrir el problema de vocabularios que divergen).
- Tratar el grupo puente como **scope amplio pero curado**, no como filtro fino:
  *ensancha* la búsqueda cuando la pregunta es difusa, al revés que el scope por
  marcador, que la *estrecha*.
- Encaja en la rama "sin marcador detectado" del scope por marcador: solo se
  activa cuando la pregunta no trae marcador explícito.
- Requiere detección del motivo de consulta (mini-router) y es **multilingüe**
  (ES/DE): ahí está el coste real y la fragilidad, no en los datos.

Implementación inicial:

- `health_area_routes` vive en `corpus-taxonomy.json` y usa claves reales de
  `area_de_salud`.
- El vocabulario runtime genera `HEALTH_AREAS`.
- `deriveScope` devuelve ahora `markers`, `lens` y `healthAreas`.
- `healthAreas` no filtra duro: expande la query de KB y reordena candidatos
  que ya declaran esa `area_de_salud`.
- Áreas activas iniciales: `energia-fatiga` y `estado-animo-estres`.
- `sueño`/`sueno` queda pendiente hasta que existan tarjetas etiquetadas con
  esa `area_de_salud`.

### Retrieval de fondo (más adelante)
- [ ] Recalibrar o quitar `minScore` (hoy es recorte de ranking, no relevancia; QMD-EVOLUCION §7 P0).
- [ ] Reranking con Qwen3-Reranker (diferido a GPU; QMD-EVOLUCION §Q5).

### Cambios en el working tree (sin commitear, pendientes de subir)
- [ ] §4.7 de `docs/QMD-EVOLUCION-VITAMAP.md` (corpus en volumen vs repo).
- [ ] Taxonomía + backfill facetado + corpus local facetado.
- [ ] Backend/import/admin/prompt de QMD con facets.
- [ ] Prompts de investigación alineados con facets, pendientes de validación con una salida real.
- [ ] Preferencia DE/EU de fuentes implementada; corpus actual aún tiene pocas
      o ninguna fuente alemana equivalente.

---

## 5. Flags introducidos

| Flag | Default | Efecto |
|---|---|---|
| `ASSISTANT_EDU_GUIDE` | `false` | Activa la regla 13 (guía educativa) |
| `KB_MARKER_SCOPE` | `false` | Activa el filtro de KB por marcador |

Ambos se leen directamente de `process.env` (como el resto de módulos
conmutables) y se documentan en `.env.example` e `infra/.env.example`.

---

## 6. Referencias

- ADR-016 — Guía educativa del asistente · `docs/DECISIONS.md`
- ADR-014 — Inferencia externa UE (Mistral) durante el piloto · `docs/DECISIONS.md`
- QMD-EVOLUCION §4.7 (corpus en volumen), §7 P0 (minScore), §13.12 (recuperación por intención)
- Suite de regresión · `test-data/chat-regression-cases.json`
- Núcleo de acotación · `apps/web/lib/marker-scope.ts` (`npm run test:marker-scope`)
- Taxonomía facetada · `corpus-preparation/corpus-taxonomy.json`
- Backfill facetado · `corpus-preparation/scripts/backfill-facets.mjs` (dry-run / `--write`)
- Preferencia de fuente por idioma/jurisdicción · `apps/web/lib/source-locale.ts`
