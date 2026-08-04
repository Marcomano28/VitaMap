# Handbuch zur Erstellung von RAG-Karten

Version 1.0 · 2026-08-02
Status: Betriebsdokument · **bei Formatänderungen aktualisieren**

> Konsolidiertes Handbuch des gesamten Prozesses: von der Auswahl einer Quelle
> bis zur Prüfung, dass der Assistent sie findet und korrekt zitiert. Fasst
> zusammen, was über `corpus-preparation/README.md`, die Recherche-Briefs und
> das tatsächliche Verhalten von `/admin/corpus` verteilt war.
>
> Spanische Fassung: `docs/es/administracion/MANUAL-TARJETAS-RAG.md`.

---

## 1. Was eine Karte ist und warum das Format zählt

Eine **Karte** ist ein kurzes Markdown-Dokument mit YAML-Frontmatter, das
**genau eine abrufbare Frage** beantwortet. Kein Artikel, keine allgemeine
Zusammenfassung: es ist die Einheit, die das System abruft und zitiert, wenn
jemand etwas Verwandtes fragt.

Das Format ist keine Bürokratie. Der Assistent darf nur behaupten, was eine
Karte belegt, und das Guardrail blockiert Aussagen ohne Quelle. Eine schlechte
Karte erzeugt keinen mittelmäßigen Text, sondern eine blockierte Antwort — oder
schlimmer: ein Zitat, das nicht das aussagt, was der Assistent behauptet.

**Grundregel:** Die Differenzierungen stehen am Ende der Karte und sind der
wertvollste Teil. Deshalb wird `limitations` beim Aufbau des Prompts nie
gekürzt (ADR-017). Eine Karte ohne ausdrückliche Grenzen ist Werbung, nicht
Evidenz.

---

## 2. Wo was liegt

```
corpus-preparation/
├── source-material/              Originale und ungeprüfte Notizen
├── approved-current-structure/   ← EINZIGER Ordner, aus dem hochgeladen wird
│   └── <thema>/                  thematisches Dossier (ein Ordner je Thema)
├── previously-uploaded/          Historie; KEIN normatives Beispiel
├── corpus-taxonomy.json          kontrolliertes Vokabular
├── PROMPT-INVESTIGACION-RAG*.md  Briefs je Inhaltstyp
└── BRIEF-TARJETA-*.md            Detailmodule D und E
```

Eine Datei hier zu verschieben, ändert **nichts** an `data/kb` oder am Index:
die Trennung ist redaktionell. Die eigentliche Veröffentlichung erfolgt in §7.

---

## 3. Kartentypen

**Biomedizinisch** (Laborwerte und Marker):

| Typ | Aufgabe | Pflicht? |
|---|---|---|
| A | Erklärt einen einzelnen Marker | Ja, die Basis |
| B | Dokumentierte Alltagsfaktoren (Ernährung, Gewohnheiten) | Empfohlen |
| C | Eine einprägsame wissenschaftliche Idee (Neugier) | Empfohlen |
| D | Beziehung zwischen Markern oder Lesen eines Panels | Optional |
| E | Wie man Veränderungen über die Zeit denkt | Optional |

**D und E werden nur erstellt, wenn eine geeignete Quelle eine echte, von A
verschiedene Absicht beiträgt.** Nicht aus Symmetrie ausfüllen.

**Heilpflanzen und Praktiken** (Pflanzen, Pilze, Algen, Akupunktur,
komplementäre Praktiken):

| Ebene | Aufgabe |
|---|---|
| Identität | Was es genau ist (Art, verwendeter Teil, Produktformen) |
| Dokumentierte Verwendung | Historische oder regulatorische Verwendung, mit präziser Quelle |
| Evidenz | Was die moderne Forschung sagt |
| Sicherheit | Vorsichtsmaßnahmen, Wechselwirkungen, Gegenanzeigen |

Die Ebene der traditionellen Verwendung wird **nur ergänzt, wenn eine
hinreichend präzise historische, regulatorische oder wissenschaftliche Quelle
vorliegt**. Fehlt sie, entfällt sie: ein unvollständiges Dossier ist besser als
eines, das Tradition erfindet.

Der jeweilige Brief liegt in `corpus-preparation/PROMPT-*.md`. Vor dem Schreiben
lesen: er legt Stil, Umfang und Grenzen des Typs fest.

---

## 4. Vollständiger Ablauf

**1 · Quelle wählen.** Primärquelle mit stabiler URL (DOI, MedlinePlus, HMPC,
NCCIH, WHO, systematische Übersichtsarbeiten). URL und, falls vorhanden, DOI
festhalten.

**2 · Frage abgrenzen.** Eine Karte = eine abrufbare Einheit. Entstehen beim
Schreiben zwei Fragen, sind es zwei Karten.

**3 · Zusammenfassung verfassen** nach dem Brief des Typs. 250–500 Wörter, die
Differenzierungen am Ende.

**4 · Gegen die Quelle prüfen**, Aussage für Aussage: jede Angabe, jedes Datum,
jede Referenz, jede Einschränkung. Dieser Schritt wird weder delegiert noch
übersprungen.

**5 · Frontmatter schreiben** (§5) mit kontrolliertem Vokabular (§6).

**6 · Im Dossier ablegen**, erst nach gemeinsamer Prüfung:
`approved-current-structure/<thema>/<sprechender-name>.md`. Nicht Freigegebenes
bleibt draußen.

**7 · Hochladen, prüfen, veröffentlichen** über `/admin/corpus` (§7).

**8 · Abruf testen** mit einer echten Abfrage (§8).

---

## 5. Frontmatter

Echtes Beispiel aus einer veröffentlichten Karte:

```yaml
---
title: 'Kinesiología aplicada: ¿es válido el test muscular como método diagnóstico?'
source_url: 'https://doi.org/10.1186/1746-1340-15-11'
doi: 10.1186/1746-1340-15-11
publication_date: '2007'
source_kind: clinical-evidence
source_type: complementary-practice-evidence-summary
rights_status: permitted
limitations:
  - >-
    Bewertet die Validität des Muskeltests als diagnostische Methode, nicht
    jede mögliche Behandlung.
  - >-
    Unzureichende Evidenz bedeutet, dass keine Validität nachgewiesen wurde,
    nicht den universellen Beweis, dass 'nie' etwas geschieht.
facets_version: 1
tarjeta_id: kinesiologia-aplicada-evidencia-test-muscular-haas
dominio: tradiciones-practicas
tipo: [intervencion]
marker: [kinesiologia-aplicada]
sistema: [osteoarticular, neurologico-cognitivo]
area_de_salud: [rendimiento-deportivo]
seccion: evidencia
alias: [kinesiologia aplicada]
source_language: en
---
```

> Die Feldnamen und ihre Werte sind **spanisch und bleiben spanisch** — sie sind
> technische Bezeichner, keine Übersetzung. `dominio`, `seccion`, `marker` usw.
> müssen exakt so geschrieben werden.

Hinweise, die Fehler ersparen:

- **`limitations` ist das Wichtigste.** Es erreicht das Modell ungekürzt.
  Schreiben Sie es mit Blick darauf, welchen Fehlschluss Sie verhindern wollen.
- **`seccion` leitet sich aus `source_type` ab**, ist also nicht frei wählbar:
  die Zuordnung steht in `corpus-taxonomy.json` → `sections_by_source_type`.
- **`source_language`** ist die Sprache der Quelle, nicht die der Karte.
- **`rights_status`** muss der tatsächlichen Lizenz entsprechen. Im Zweifel
  nicht veröffentlichen.

---

## 6. Kontrolliertes Vokabular

Die Felder mit geschlossenen Wertelisten stehen in
`corpus-preparation/corpus-taxonomy.json`: `dominio`, `tipo`, `marker`,
`categoria`, `muestra`, `sistema`, `area_de_salud`, `seccion`, `tradicion`,
`alias`, `relacionado_con`, `source_language`, `source_jurisdiction`.

**Keine Werte erfinden.** Fehlt einer, wird er bewusst zur Taxonomie ergänzt und
das Vokabular neu erzeugt:

```bash
cd apps/web
npm run taxonomy:generate     # erzeugt lib/generated/marker-vocabulary.ts neu
npm run taxonomy:check        # schlägt fehl, wenn Vokabular nicht synchron ist
```

`taxonomy:check` ist ein Gate: schlägt es fehl, weichen Korpus und Code
voneinander ab und das muss vor dem Weitermachen behoben werden.

---

## 7. Hochladen und veröffentlichen

Oberfläche: `https://<domain>/admin/corpus`, mit einem Konto, dessen
E-Mail-Adresse in `ADMIN_EMAILS` steht.

1. `.md` hochladen. Das Panel **importiert das Frontmatter** automatisch.
2. Importierte Metadaten prüfen und korrigieren. Im Formular von Hand
   eingetragene Felder haben **Vorrang** vor dem Frontmatter.
3. Als **Entwurf** speichern. Der Import veröffentlicht und indexiert nie von
   selbst: der Entwurf landet in `/data/kb-inbox`.
4. Herkunft, Rechte und tatsächlichen Nutzen für den Abruf prüfen.
5. **Veröffentlichen.** Erst dann wandert das Dokument nach `/data/kb` und in
   den gemeinsamen Index.

Schritt 3 existiert, damit nichts ohne ausdrückliche menschliche Prüfung zum
Assistenten gelangt. Machen Sie daraus keine Formalie.

---

## 8. Prüfung nach der Veröffentlichung

**Abruf testen** (vom VPS aus):

```bash
cd /opt/vitamap-next/infra
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "hier die Testabfrage"
```

Erscheint nichts, zuerst `marker`, `alias` und `seccion` prüfen: fast immer
liegt es an den Metadaten, nicht am Index.

**Danach im echten Chat** eine Frage stellen, die die Karte abrufen muss, und
**das Zitat lesen**: prüfen, ob der Assistent das behauptet, was die Quelle
sagt, und ob die Differenzierungen aus `limitations` an passender Stelle
auftauchen.

**Weitere nützliche Prüfungen:**

```bash
cd apps/web
npm run kb:check                 # Gesamtzustand des Korpus
npm run corpus:locale-audit      # Abdeckung nach Sprache
npm run eval                     # Evaluationssuiten (eval/*.yml)
```

---

## 9. Häufige Fehler

| Fehler | Folge | Vermeidung |
|---|---|---|
| Karte mit zwei Fragen | Unpräziser Abruf | In zwei Karten teilen |
| `limitations` leer oder generisch | Assistent behauptet zu viel | Schreiben, was **nicht** geschlossen werden darf |
| Erfundener Wert in geschlossenem Feld | `taxonomy:check` schlägt fehl | Zuerst die Taxonomie prüfen |
| Veröffentlichen ohne Rechteprüfung | Rechtliches Problem | Realer `rights_status`, sonst nicht veröffentlichen |
| Sekundärquelle (Blog, Zusammenfassung) | Nicht belastbares Zitat | Nur Primärquellen mit stabiler URL |
| Tradition ohne präzise Quelle | Geschichte wird erfunden | Ebene weglassen |
| Abruf nicht getestet | Karte praktisch unsichtbar | Immer `check-kb.mts` |

---

## 10. Verwandte Dokumente

| Dokument | Wofür |
|---|---|
| `corpus-preparation/README.md` | Tatsächlicher Stand der Ordner und Dossiers (spanisch) |
| `corpus-preparation/PROMPT-INVESTIGACION-RAG*.md` | Briefs je Inhaltstyp (spanisch) |
| `HANDBUCH-VPS.md` | Serverbefehle |
| `../es/arquitectura/ARQUITECTURA-CORPUS-TEMATICO-Y-RECUPERACION.md` | Thematische Struktur und Entwicklung des Abrufs (spanisch) |
| `../es/arquitectura/COBERTURA-CORPUS-ANGULOS-DEBILES.md` | Was thematisch noch fehlt (spanisch) |
