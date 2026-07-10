# Visuales · soporte de los conceptos básicos de VitaMap

Contenedor único de las piezas visuales que ilustran los conceptos del proyecto.
Cada pieza es un **HTML autocontenido** (se abre en el navegador sin servidor ni
dependencias), versionable en git y ligado al documento que fundamenta.

## Convención

- Un archivo por concepto, nombrado por el concepto (no por fecha).
- HTML autocontenido: nada de CDNs ni librerías externas → abre en local y a
  prueba de futuro.
- Cada entrada del catálogo declara: qué concepto sostiene, su **estado**
  (`boceto` = ilustración conceptual / `real` = construido sobre datos del
  proyecto), el documento al que pertenece y, si existe, el enlace publicado.
- El documento conceptual enlaza a su visual y viceversa.

## Estados

| Estado | Significado |
|---|---|
| `boceto` | Ilustración de la idea, posiciones a mano, **no** hecha con datos reales. Sirve para explicar y como plano de lo que habría que construir. |
| `real` | Construido leyendo datos reales del proyecto (p. ej. `corpus-taxonomy.json`). Es herramienta, no dibujo. |

## Catálogo

| Pieza | Concepto que ilustra | Estado | Documento | Enlace |
|---|---|---|---|---|
| [vitamap_mapa_conocimiento_figura_fondo.html](vitamap_mapa_conocimiento_figura_fondo.html) **(principal)** | Mapa navegable figura-fondo: dos planos (Ayurveda / analítica), aristas internas + tangencias, modos por intención (clínica/tradicional/comparación), autonomía Ayurveda | `boceto` (prototipo semilla; datos ilustrativos, **no** leídos de `corpus-taxonomy.json`) | [CONTORNOS-AYURVEDA-Y-ANALITICA.md](../CONTORNOS-AYURVEDA-Y-ANALITICA.md) §4 | https://claude.ai/code/artifact/7f75deaa-7d71-4fad-88de-fb4b07666b92 |
| [mapa-figura-fondo.html](mapa-figura-fondo.html) | Misma idea, versión estática mínima (clúster shukra) — **superada** por la interactiva de arriba | `boceto` | [CONTORNOS-AYURVEDA-Y-ANALITICA.md](../CONTORNOS-AYURVEDA-Y-ANALITICA.md) §4 | https://claude.ai/code/artifact/e496df14-2b96-4215-88b9-369bac8e4b10 |

## Pendientes / candidatos

- **Explorador interactivo del grafo clínico** (`real`): leído de
  `corpus-taxonomy.json` (~241 conexiones reales entre marcadores). Sería la
  versión herramienta del mapa. Ver la discusión en
  [CONTORNOS-AYURVEDA-Y-ANALITICA.md](../CONTORNOS-AYURVEDA-Y-ANALITICA.md) §4.
- **Grafo interno Ayurveda** (`real`): bloqueado hasta promover conceptos a
  marcadores canónicos (shukra, ojas…). Ver el mismo doc, §4.1.
