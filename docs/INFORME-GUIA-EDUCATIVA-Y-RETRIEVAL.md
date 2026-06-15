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
| **Acotación por marcador** (núcleo puro) tras flag `KB_MARKER_SCOPE` | `lib/marker-scope.ts` + test | ✅ probado local |
| Cableado del filtro en `queryMemoryAndKB` (default off) | `lib/qmd.ts` | ✅ this PR |

**Cómo funciona la acotación por marcador.** Con `KB_MARKER_SCOPE=true`,
`queryMemoryAndKB` pide más candidatos de KB, deriva los marcadores en juego de
la **memoria del usuario** (su analítica) + la pregunta, y filtra los
documentos al marcador correspondiente. Conservador: documentos transversales
(ayuno, interferencias) se conservan; si no se detecta marcador, no filtra. En
la analítica sintética, un documento hepático queda fuera de una conversación
de glucosa/LDL. Probado en `npm run test:marker-scope`.

---

## 3. Cambios previstos / pendientes

| Pendiente | Por qué | Nota |
|---|---|---|
| **Validar en el VPS** la regla 13 (contra Mistral) | El comportamiento real solo se ve con el LLM de chat | `ASSISTANT_EDU_GUIDE=true`, `LLM_PROVIDER=external` |
| **Validar en el VPS** la acotación por marcador | El caso del hígado solo se reproduce con el corpus del volumen | `KB_MARKER_SCOPE=true`; revisar logs `[chat] marker scope` |
| **Re-validar contra Qwen3 local** antes del blindaje final | Los ajustes contra Mistral transfieren solo en parte (ADR-014) | Correr la suite de regresión |
| **Campo `marker` en el frontmatter del corpus** | Sustituir el match por nombre (taxonomía del piloto) por uno robusto | Idealmente lo emiten los prompts de `corpus-preparation/` |
| **Recalibrar/quitar `minScore`** | Hoy es un recorte de ranking, no relevancia | QMD-EVOLUCION §7 P0 |
| **Reranking (Qwen3-Reranker)** | Arreglo de fondo de la relevancia | Diferido a GPU (QMD-EVOLUCION §Q5) |
| **Decisión Tarjetas B** (alimentación/factores) | Ya están en el volumen; validar que se citan en descriptivo | Caso `edu-guide-tarjeta-b-colesterol-01` de la suite |

---

## 4. Flags introducidos

| Flag | Default | Efecto |
|---|---|---|
| `ASSISTANT_EDU_GUIDE` | `false` | Activa la regla 13 (guía educativa) |
| `KB_MARKER_SCOPE` | `false` | Activa el filtro de KB por marcador |

Ambos se leen directamente de `process.env` (como el resto de módulos
conmutables) y se documentan en `.env.example` e `infra/.env.example`.

---

## 5. Referencias

- ADR-016 — Guía educativa del asistente · `docs/DECISIONS.md`
- ADR-014 — Inferencia externa UE (Mistral) durante el piloto · `docs/DECISIONS.md`
- QMD-EVOLUCION §4.7 (corpus en volumen), §7 P0 (minScore), §13.12 (recuperación por intención)
- Suite de regresión · `test-data/chat-regression-cases.json`
- Núcleo de acotación · `apps/web/lib/marker-scope.ts` (`npm run test:marker-scope`)
