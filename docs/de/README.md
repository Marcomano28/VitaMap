# VitaMap-Dokumentation · deutsch

Was zum **Betrieb** der Instanz und für die zu unterzeichnenden
**Rechtsdokumente** erforderlich ist.

---

## Handbücher

| Dokument | Wofür |
|---|---|
| `HANDBUCH-VPS.md` | **Hier beginnen.** Deployment, Befehle, Backups, Einladungen, Störungen |
| `HANDBUCH-RAG-KARTEN.md` | Vollständiger Prozess: Karten erstellen, hochladen, veröffentlichen, prüfen |

## Rechtsdokumente (Entwürfe)

| Dokument | Status |
|---|---|
| `STATUTEN-BEGLEITPERSON.md` | **Entwurf, nicht in Kraft** · zur juristischen Prüfung |
| `EINWILLIGUNG-BEGLEITETE-PERSON.md` | **Entwurf, nicht in Kraft** · wird auf Papier unterzeichnet |

Beide sollen nach der Prüfung die **verbindliche** Fassung sein; die spanischen
Gegenstücke in `../es/legal/` sind Arbeitsfassungen.

---

## Was auf Spanisch bleibt und warum

Die tiefere Architekturdokumentation — RAG-Engine (QMD), thematische
Korpusstruktur, Prädikatenregister, Roadmap, ADR — liegt nur auf Spanisch in
`../es/arquitectura/`. Grund: mehrere tausend Zeilen, die sich häufig ändern;
eine gespiegelte Übersetzung würde den Pflegeaufwand verdoppeln und schnell
auseinanderlaufen.

Die deutschen Handbücher verweisen an den Stellen darauf, wo es nötig ist. Die
wichtigsten spanischen Dokumente für den Betrieb:

| Dokument | Wofür |
|---|---|
| `../es/arquitectura/DECISIONS.md` | ADR — warum die Dinge so sind, wie sie sind |
| `../es/arquitectura/ROADMAP.md` | Phasen und Skalierung |
| `../es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md` | Rechtsrahmen, Stufen, Meldeverfahren |
| `../es/administracion/CHECKLIST-GO-LIVE-PILOTO-REAL.md` | Was vor echten Daten fehlt |

Wird ein weiteres Dokument regelmäßig gebraucht, ist eine Übersetzung sinnvoll —
aber bewusst und einzeln, nicht als vollständige Spiegelung.

---

## Wichtiger Hinweis

Technische Bezeichner bleiben spanisch: Frontmatter-Felder (`dominio`,
`seccion`, `marker`), Ordnernamen des Korpus und npm-Skripte. Sie sind Code,
keine Prosa, und dürfen nicht übersetzt werden.
