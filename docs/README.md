# Documentación de VitaMap · VitaMap-Dokumentation

Reorganizada el 2026-08-02. Nada se ha borrado.
Neu geordnet am 2026-08-02. Nichts wurde gelöscht.

---

## Estructura · Struktur

```
docs/
├── es/           Documentación activa (español)
│   ├── administracion/   Manuales de operación: VPS y tarjetas RAG
│   ├── arquitectura/     Decisiones, roadmap y diseño técnico vivo
│   └── legal/            Marco legal, consentimientos y estatutos
├── de/           Betriebshandbücher und Rechtsdokumente (deutsch)
├── vision/       Visión de producto, marca y material editorial
└── recycle/      Documentación histórica del proceso — puede sacarse del proyecto
```

---

## Por dónde empezar · Wo anfangen

**Si vas a operar la instancia** → `es/administracion/MANUAL-VPS.md`
**Wenn Sie die Instanz betreiben** → `de/HANDBUCH-VPS.md`

**Si vas a crear contenido del corpus** → `es/administracion/MANUAL-TARJETAS-RAG.md`
**Wenn Sie Korpusinhalte erstellen** → `de/HANDBUCH-RAG-KARTEN.md`

**Si vas a tocar el código** → `es/arquitectura/DECISIONS.md` (ADR) y
`es/arquitectura/INFORME-ARQUITECTURA-2026-08-02.md`

**Antes de admitir datos reales** → `es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md` y
`es/administracion/CHECKLIST-GO-LIVE-PILOTO-REAL.md`

---

## Criterio de reparto · Aufteilungskriterium

| Carpeta | Qué contiene | Estado |
|---|---|---|
| `es/` | Todo lo vigente: operar, decidir y evolucionar | Activo, se mantiene |
| `de/` | Lo que un colaborador alemán necesita para **operar**: manuales y documentos legales que se firman | Activo, se mantiene |
| `vision/` | Producto, marca, estética, metodología editorial | Vivo pero no operativo |
| `recycle/` | Auditorías cerradas, instantáneas e informes puntuales | Congelado, no se mantiene |

**Sobre el alemán.** La arquitectura profunda (QMD, corpus temático, registro
de predicados) permanece solo en español: traducirla duplicaría el coste de
mantenimiento de miles de líneas que cambian a menudo. Los manuales alemanes
remiten a ella cuando hace falta. Los documentos legales que **se firman**
—estatutos y consentimiento— sí existen en alemán, y la versión alemana es la
destinada a ser la vinculante.

**Die Architekturdokumentation bleibt spanisch.** Die deutschen Handbücher
verweisen darauf, wo nötig. Die zu unterzeichnenden Rechtsdokumente liegen auf
Deutsch vor; die deutsche Fassung soll die verbindliche sein.

---

## Sobre `recycle/` · Zu `recycle/`

Contiene documentación del proceso: auditorías ya resueltas, instantáneas de
estado e informes de una fecha concreta. Se conserva por trazabilidad, pero
**no describe el sistema actual** y puede sacarse del proyecto sin pérdida
funcional. Ver `recycle/README.md`.

Enthält Prozessdokumentation: erledigte Audits, Zustandsaufnahmen und
stichtagsbezogene Berichte. Wird zur Nachvollziehbarkeit aufbewahrt,
**beschreibt aber nicht das aktuelle System** und kann ohne funktionalen
Verlust aus dem Projekt entfernt werden.
