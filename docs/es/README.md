# Documentación activa · español

Todo lo vigente para operar, decidir y evolucionar el proyecto.

---

## `administracion/` — cómo se opera

| Documento | Para qué |
|---|---|
| `MANUAL-VPS.md` | **Empieza aquí para operar.** Despliegue, comandos, backups, invitaciones, incidencias |
| `MANUAL-TARJETAS-RAG.md` | **Empieza aquí para el corpus.** Proceso completo de crear y publicar tarjetas |
| `RUNBOOK-MIGRACION-SERVIDOR.md` | Migrar el VPS a otra máquina paso a paso · incluye prueba de restauración |
| `CHECKLIST-GO-LIVE-PILOTO-REAL.md` | Qué falta antes de admitir datos reales · documento vivo |
| `PLAN-REMEDIACION-BLOQUEANTES.md` | Orden de resolución de bloqueantes |
| `PILOTO-FASE1-GUIA-OPERATIVA.txt` | Secuencia histórica completa del piloto y su contexto |

Los dos manuales son nuevos (2026-08-02) y consolidan lo que antes estaba
disperso. Los tres siguientes son el material original, conservado porque
contiene contexto y estado que los manuales no repiten.

## `arquitectura/` — por qué es como es

| Documento | Para qué |
|---|---|
| `DECISIONS.md` | **Registro ADR.** Toda decisión técnica con su contexto. Nunca se borra nada |
| `ROADMAP.md` | Fases del piloto y ruta prevista |
| `INFORME-ARQUITECTURA-2026-08-02.md` | Mapa del repo, inconsistencias y deuda localizada |
| [PROPUESTA-ORQUESTACION-CONVERSACIONAL.md](arquitectura/PROPUESTA-ORQUESTACION-CONVERSACIONAL.md) | Propuesta: contornos del agente, evaluación de TypeSafe y mapa de implementación |
| [PLAN-VARIANTE-JEV.md](arquitectura/PLAN-VARIANTE-JEV.md) | Plan acotado: Jev para intención, pertinencia y respaldo de afirmaciones; ventajas y evaluación |
| `QMD-EVOLUCION-VITAMAP.md` | Motor RAG: configuración operativa y evolución. Prevalece sobre los ejemplos del roadmap |
| `ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md` | Estructura temática del corpus y evolución de la recuperación |
| `REGISTRO-PREDICADOS.md` | Contrato de aristas del grafo de conocimiento |
| `PRIORIDADES-ESTRUCTURA-RAG-FIGURA-FONDO.md` | Plan priorizado de estructura figura-fondo |
| `HOJA-DE-RUTA-MULTILINGUE-NIVELES-Y-CURIOSIDAD.md` | Interfaz y contenido multilingüe, niveles de lenguaje |
| `CONTORNOS-AYURVEDA-Y-ANALITICA.md` | Contrato metodológico: Ayurveda como fondo autónomo |
| `COBERTURA-CORPUS-ANGULOS-DEBILES.md` | Seguimiento editorial: qué ángulos faltan por tema |
| `PROPUESTA-CORPUS-LINT.md` | Gate de integridad propuesto para tarjetas |
| `Flujo-End-to-End.txt` | Recorrido completo de una petición en lenguaje llano · **buen punto de entrada para alguien nuevo** |

## `legal/` — marco y documentos que se firman

| Documento | Estado |
|---|---|
| `GUIA-LEGAL-PILOTO-ALEMANIA.md` | Borrador operativo interno · etapas, bases legales, expediente mínimo |
| `PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-PACIENTES.md` | Base técnica implementada (ADR-018); acceso cruzado apagado por flag |
| `ESTATUTOS-SUPPORTER.md` | **Borrador, no vigente** · versión alemana en `../../de/` |
| `CONSENTIMIENTO-PERSONA-ACOMPANADA.md` | **Borrador, no vigente** · versión alemana en `../../de/` |
| `BORRADOR-TRANSFERENCIA-LLM-MISTRAL.md` | Borrador para revisión jurídica · relacionado con ADR-014 |

Ninguno de estos documentos es un dictamen legal. Los marcados como borrador
requieren revisión por un especialista alemán antes de usarse con personas
reales.
