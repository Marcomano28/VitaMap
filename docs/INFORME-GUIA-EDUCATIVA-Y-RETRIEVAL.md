# Informe · Guía educativa del asistente y acotación del retrieval

Versión 1.0 · 2026-06-16
Estado: cambios aplicados (detrás de flags) + plan de validación

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
| **Script de backfill `marker:`** (dry-run) | `corpus-preparation/scripts/backfill-marker.mjs` | ✅ en `main` |
| Convención `marker:` en el prompt (ejemplo + regla) | `corpus-preparation/PROMPT-INVESTIGACION-RAG.md` | ⚠️ editado, sin commitear |

**Cómo funciona la acotación por marcador.** Con `KB_MARKER_SCOPE=true`,
`queryMemoryAndKB` pide más candidatos de KB, deriva los marcadores en juego de
la **memoria del usuario** (su analítica) + la pregunta, y filtra los
documentos al marcador correspondiente. Conservador: documentos transversales
(ayuno, interferencias) se conservan; si no se detecta marcador, no filtra. En
la analítica sintética, un documento hepático queda fuera de una conversación
de glucosa/LDL. Probado en `npm run test:marker-scope`.

---

## 3. El campo `marker` (documentación)

Es la versión robusta del filtro `KB_MARKER_SCOPE`: hoy el filtro **adivina** el
marcador de un documento por su nombre de archivo; con un campo `marker:` en el
frontmatter, cada documento lo **declara** y no hay que adivinar.

### 3.1 Cómo se decide el marcador (no se interpreta el texto)

El marcador se sabe de antemano, por tres vías fiables:

1. **Documentos nuevos** → el **tema** que se le pide al prompt
   (`PROMPT-INVESTIGACION-RAG.md` trabaja "por tema"). El prompt lo escribe.
2. **Documentos existentes** → la **carpeta** en
   `approved-current-structure/` (ya están archivados por marcador:
   `colesterol-ldl/`, `glucosa-en-ayunas/`…). El nombre de la carpeta es el marcador.
3. **Casos con decisión humana**:
   - **Multi-marcador** (`lectura-conjunta`, `panel`, `seguimiento`): cubren
     varios → `marker` es una **lista**, p. ej. `marker: [vitamina-d, calcio, fosfato, pth]`.
   - **Transversales** (`ayuno`, `interferencias-analiticas`, `micronutrientes`):
     no son de un marcador → `marker: general` (siempre relevante; el filtro los conserva).

### 3.2 Herramientas preparadas

- **Backfill** (`corpus-preparation/scripts/backfill-marker.mjs`): escribe
  `marker:` en las tarjetas existentes desde su carpeta. **Dry-run por defecto**;
  `--write` para aplicar. Dry-run sobre el corpus actual: **171 documentos**
  etiquetables, **23 multi-marcador** reportados para revisión.
- **Convención en el prompt** (`PROMPT-INVESTIGACION-RAG.md`): `marker:` en el
  ejemplo de frontmatter y en la tabla de campos, para que los **nuevos** nazcan con él.

### 3.3 Vocabulario

El valor de `marker` debe coincidir con las claves canónicas que usa
`lib/marker-scope.ts`. Mantener UN vocabulario compartido entre: nombre de
carpeta, campo `marker`, claves del filtro y nombres de marcador de la analítica.

---

## 4. Qué queda por hacer

### Validación (en el VPS)
- [ ] Regla 13 contra Mistral: `ASSISTANT_EDU_GUIDE=true`, `LLM_PROVIDER=external`.
      Verificar respuesta **citada**, **sin interpretar el valor personal**, guardrail `safe`.
- [ ] Acotación por marcador: `KB_MARKER_SCOPE=true`. Repetir la pregunta de
      glucosa/LDL y comprobar que el doc hepático ya no aparece (logs `[chat] marker scope`).
- [ ] Re-validar la suite de regresión contra **Qwen3-4B local** antes del blindaje final (ADR-014).
- [ ] Decisión **Tarjetas B** (alimentación/factores): validar el caso
      `edu-guide-tarjeta-b-colesterol-01` (que se citen en descriptivo, no como pauta).

### Activar el campo `marker` (3 pasos)
- [ ] Revisar los **23 multi-marcador** y decidir su lista.
- [ ] Correr el backfill con `--write`.
- [ ] Actualizar `lib/marker-scope.ts` para **leer el campo `marker`** del
      frontmatter (preferirlo al match por nombre) — paso que conecta el corpus con `KB_MARKER_SCOPE`.

### Retrieval de fondo (más adelante)
- [ ] Recalibrar o quitar `minScore` (hoy es recorte de ranking, no relevancia; QMD-EVOLUCION §7 P0).
- [ ] Reranking con Qwen3-Reranker (diferido a GPU; QMD-EVOLUCION §Q5).

### Cambios en el working tree (sin commitear, pendientes de subir)
- [ ] §4.7 de `docs/QMD-EVOLUCION-VITAMAP.md` (corpus en volumen vs repo).
- [ ] `marker:` en `corpus-preparation/PROMPT-INVESTIGACION-RAG.md` (ejemplo + regla).

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
- Backfill del campo marker · `corpus-preparation/scripts/backfill-marker.mjs` (dry-run / `--write`)
