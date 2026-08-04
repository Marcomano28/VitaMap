# Statuten für Begleitpersonen (Supporter) · ENTWURF

Version **0.1-Entwurf** · 2026-08-02
Status: **NICHT IN KRAFT** — Arbeitsentwurf zur juristischen Prüfung
Zugehöriger ADR: ADR-018 · Vorschlag: `PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-PACIENTES.md`
Spanische Fassung: `ESTATUTOS-SUPPORTER.md` (Arbeitsfassung)

> **Hinweis zu diesem Dokument.** Entwurf auf Grundlage des technischen
> Designs (ADR-018) und der `GUIA-LEGAL-PILOTO-ALEMANIA.md`. Kein geprüfter
> Rechtstext. Zweck: einer deutschen Fachperson etwas Konkretes zum Korrigieren
> zu geben, statt bei null anzufangen. **Keine Begleitperson darf diese
> Statuten annehmen oder danach handeln, solange der Status nicht auf "in
> Kraft" steht.**
>
> §0 enthält die Entscheidungen, die dieser Entwurf nicht selbst treffen kann.
> Solange sie offen sind, ist der übrige Text vorläufig.
>
> **Diese deutsche Fassung ist die, die nach der Prüfung verbindlich werden
> soll.** Die spanische Fassung dient als Arbeits- und Abstimmungsfassung; bei
> Abweichungen geht nach Inkrafttreten die deutsche Fassung vor.
>
> **Anrede:** Dieses Dokument verwendet "Sie", abweichend vom "du" der
> Anwendung. Begründung: es handelt sich um ein förmliches, unterzeichnetes
> Dokument mit vertragsähnlichem Charakter. Bei Bedarf anpassbar.

---

## 0. Offene Entscheidungen (blockieren die verbindliche Fassung)

Diese Fragen bestimmen den tatsächlichen Inhalt der Statuten. Sie stehen
bewusst am Anfang, weil sie den gesamten Text verändern.

**0.1 · Wer ist Verantwortlicher für die Daten der begleiteten Person?** Das ist
die zentrale Frage. Bisher ist jede Nutzerin und jeder Nutzer Inhaber der
eigenen Daten und willigt für sich selbst ein. Mit den Kabinen ("Cubicles")
entstehen Gesundheitsdaten einer Person, die **kein eigenes Konto** hat. Die
beiden möglichen Lesarten führen zu unterschiedlichen Dokumenten:

- *(a)* Die **Begleitperson** ist Verantwortliche, VitaMap ist
  Auftragsverarbeiter → erforderlich ist ein Auftragsverarbeitungsvertrag nach
  Art. 28 DSGVO zwischen Betreiber und jeder Begleitperson; diese Statuten sind
  dann eine Anlage dazu.
- *(b)* Der **Betreiber von VitaMap** bleibt Verantwortlicher, die
  Begleitperson ist eine weisungsgebundene autorisierte Person → diese Statuten
  sind das Instrument der Weisung und Autorisierung, und der Betreiber haftet
  unmittelbar gegenüber der begleiteten Person.

Dieser Entwurf ist in der Annahme *(b)* verfasst, weil sie für den Betreiber
die konservativere ist (mehr Verantwortung, nicht weniger). **Zu bestätigen.**

**0.2 · Dürfen im Piloten begleitete Personen ohne eigenes Konto existieren?**
Das ist Variante A des Designs. Der Vorteil ist technisch; der Preis ist, dass
diese Person ihre Rechte nicht in der Anwendung ausüben kann. Solange das so
ist, schreibt §7 ein manuelles Verfahren vor, dessen Angemessenheit zu bewerten
ist.

**0.3 · Gehört das überhaupt in den aktuellen Piloten?** Die
`GUIA-LEGAL-PILOTO-ALEMANIA.md` §3 ordnet den "Zugang von Ärztinnen und Ärzten,
Therapeutinnen und Therapeuten, Forschenden oder Angehörigen" der **Stufe D**
zu, die eine neue Bewertung von Zweck, Rechtsgrundlage, Verträgen, DSFA,
Sicherheit und MDR-Klassifizierung verlangt. Der geschlossene Pilot ist Stufe B.
Es ist ausdrücklich zu entscheiden, ob Stufe D eröffnet wird oder ob die Figur
der Begleitperson wartet.

**0.4 · Schutzbedürftige Personen und Minderjährige.** Dieselbe §3 nennt sie als
Auslöser einer neuen Bewertung. Wenn die Figur der Begleitperson gerade für
Menschen gedacht ist, die ihre Daten nicht selbst verwalten können, ist dieser
Punkt nicht am Rand, sondern wahrscheinlich der Kernfall. Erfordert eine
ausdrückliche Position.

**0.5 · Heilberuf?** Ist die Begleitperson Therapeutin, Therapeut oder
Angehörige eines Gesundheitsberufs, gelten eigene Pflichten
(Schweigepflicht, Dokumentationspflichten), die mit der pädagogischen
Positionierung von VitaMap in Spannung stehen können. Zu klären ist, ob diese
Statuten genügen oder ob diese Figur ausgeschlossen bleibt.

---

## 1. Was eine Begleitperson ist und was nicht

**Sie ist.** Eine Vertrauensperson — pflegende, angehörige, technisch
unterstützende oder beruflich begleitende Person — die vom Betreiber
ausdrücklich zugelassen wurde, um innerhalb von VitaMap Gesundheitsdaten
bestimmter von ihr begleiteter Personen zu ordnen und einzusehen, mit
dokumentierter Erlaubnis dieser Personen.

**Sie ist nicht.** Keine Administratorin und kein Administrator der Plattform:
kein Zugriff auf Konfiguration, Korpus oder Daten anderer Nutzender außerhalb
der freigegebenen Personen. Keine klinische Rolle: VitaMap ist keine
Patientenakte und kein Instrument für Diagnose oder Behandlung. Kein Weg, den
Zugang über persönliches Vertrauen auszuweiten: jeder Zugriff entsteht aus einer
registrierten und widerruflichen Autorisierung.

Die Eigenschaft als Begleitperson entsteht nicht durch Registrierung. **Sie kann
ausschließlich aus einer namentlichen Einladung entstehen, die der Betreiber
ausstellt oder bestätigt** (§8).

---

## 2. Klauseln

Nummeriert, damit sie in Audit und Vorfällen zitierbar sind. Mit der Annahme
verpflichtet sich die Begleitperson zu Folgendem.

**2.1 · Zweck.** VitaMap ausschließlich als Unterstützung für Bildung,
Organisation von Informationen und begleitete Erklärung zu nutzen. Nicht zur
Diagnose, zur Anordnung, Anpassung oder Beendigung von Behandlungen und nicht
als Ersatz für fachliche Beratung.

**2.2 · Nutzungsgrenzen.** VitaMap nicht in Notfällen einzusetzen und nicht in
Situationen, in denen eine verspätete oder falsche Antwort Schaden verursachen
kann. Keine Heilungs-, Vorbeugungs- oder Besserungsversprechen. Keine
intransparente oder irreführende Gewinnung begleiteter Personen und keine
Ausnutzung eines Abhängigkeitsverhältnisses.

**2.3 · Vorherige Einwilligung.** Keine Daten einer Person einzugeben ohne deren
vorherige, informierte und dokumentierte Einwilligung, erhoben mit der Vorlage
`EINWILLIGUNG-BEGLEITETE-PERSON.md`. Kann die Person nicht selbst
einwilligen, ist ohne nachgewiesene gesetzliche Vertretung und ohne Mitteilung
an den Betreiber nicht fortzufahren (siehe §0.4).

**2.4 · Datenminimierung.** Nur das für den vereinbarten Zweck Erforderliche
hochzuladen. Eine Kabine pro Person, ohne Vermischung von Informationen
mehrerer Personen. Keine Daten Dritter aufzunehmen, die beiläufig in einem
Dokument auftauchen (etwa in einem Befund erwähnte Angehörige), sofern dafür
kein tatsächlicher Bedarf besteht.

**2.5 · Vertraulichkeit.** Keine Bildschirmfotos, Exporte, Links oder Inhalte an
Personen außerhalb des Begleitverhältnisses weiterzugeben. Konto, Passwort und
zweiten Faktor nicht zu teilen. Das Konto ist streng persönlich.

**2.6 · Sicherheit.** Den zweiten Faktor (MFA) zu aktivieren und zu erhalten,
bevor auf echte Daten Dritter zugegriffen wird. Geräte mit Bildschirmsperre und
ohne geteilte Sitzung zu verwenden. Dem Betreiber **unverzüglich, spätestens
innerhalb von 24 Stunden**, jeden Geräteverlust, jeden Verdacht auf unbefugten
Zugriff und jede Kompromittierung von Zugangsdaten mitzuteilen, damit der
Betreiber seine Meldefristen bei Datenschutzverletzungen einhalten kann.

**2.7 · Nachvollziehbarkeit.** Zu akzeptieren, dass jeder Zugriff auf Daten
einer anderen Person unveränderbar protokolliert wird (handelnde Person,
betroffene Person, Zeitpunkt und Art des Zugriffs), dass diese Protokolle bei
einem Vorfall oder einer Beschwerde ausgewertet werden können und dass sie der
begleiteten Person auf Verlangen gezeigt werden können.

**2.8 · Widerruf.** Zu akzeptieren, dass die Erlaubnis für jede Person jederzeit
entzogen werden kann — durch diese Person, durch den Betreiber oder durch die
Begleitperson selbst — mit sofortiger Wirkung, ohne Vorankündigung und ohne
Begründung. Nach dem Entzug ist nicht zu versuchen, den Zugang auf irgendeinem
Weg wiederzuerlangen; außerhalb der Plattform sind keine Kopien aufzubewahren.

**2.9 · Delegierte Einladung.** Räumt der Betreiber die Befugnis ein, neue
Begleitpersonen vorzuschlagen, ist sie als Verantwortung und nicht als Privileg
auszuüben: nur persönlich bekannte Personen, innerhalb der zugewiesenen Quote,
unter Hinweis auf diese Statuten. Die Befugnis ist begrenzt und widerruflich;
ein Vorschlag überträgt keinerlei Entscheidungsmacht über die Plattform. Im
Piloten gilt §8.

**2.10 · Eskalation.** Alle rechtlichen Fragen, Sicherheitsvorfälle, Konflikte
mit der begleiteten Person sowie Anzeichen klinischen Risikos oder einer Krise
außerhalb des Werkzeugs zu klären. VitaMap ist kein Betreuungs- und kein
Notfallkanal.

---

## 3. Annahme und Registrierung

Die Annahme ist ein ausdrücklicher und versionierter Akt, mit demselben
Mechanismus wie die Einwilligung der regulären Nutzenden (`CONSENT_VERSION` in
`apps/web/lib/consent.ts`):

- die angenommene **Version** der Statuten und das Datum werden erfasst;
- ändert sich der Text wesentlich, wird die Version erhöht und die
  Begleitperson muss sie **erneut annehmen**, bevor sie weiter auf Daten Dritter
  zugreift;
- die Annahme wird im Auditprotokoll festgehalten.

Im Design vorgesehenes Feld: `statutes_version` in der Einladung der
Begleitperson (Vorschlag §3.1).

---

## 4. Was eine Begleitperson technisch tun kann

Übersetzung der Klauseln in das, was das System zulässt (Scopes aus ADR-018),
damit zwischen Unterschriebenem und Ausführbarem kein Abstand entsteht:

| Berechtigung | Bedeutung | Im Piloten |
|---|---|---|
| `read` | Informationen der betroffenen Person einsehen | Ja |
| `chat` | Mit dem Assistenten im Kontext dieser Person sprechen | Ja |
| `manage` | Informationen hochladen, ändern, löschen | Nur in eigenen Kabinen |

Garantien des Systems, nicht des guten Willens: ohne aktive Berechtigung wird
der Zugriff stets verweigert; ein Widerruf wirkt sofort; Informationen zweier
Personen werden nie in demselben Gespräch vermischt; und kein Pfad der
Anwendung kann die Prüfung umgehen (verifiziert durch
`npm run check:data-access`).

Eine Begleitperson kann sich **keine** Berechtigungen selbst erteilen, keine
nicht freigegebenen Personen einsehen und weder auf das Korpus noch auf
Administrationsfunktionen zugreifen.

---

## 5. Verstöße

Bei einem Verstoß kann der Betreiber den Zugang sofort und vorsorglich ohne
Vorankündigung sperren. Je nach Schwere: Entzug aller Berechtigungen, Schließung
des Kontos, Verlust der Befugnis zum Vorschlag neuer Begleitpersonen und,
soweit einschlägig, Benachrichtigung der betroffenen Personen und der
zuständigen Datenschutzaufsichtsbehörde.

Die vorsorgliche Sperrung setzt keinen abschließenden Beweis voraus; ein
begründeter Verdacht genügt. Es gilt: erst unterbrechen, dann prüfen.

---

## 6. Widerruf und Ausscheiden

Scheidet eine Begleitperson aus — auf eigenen Wunsch, auf Entscheidung des
Betreibers oder wegen eines Verstoßes — gilt: alle Berechtigungen werden mit
sofortiger Wirkung entzogen; es wird ausdrücklich entschieden, was mit den Daten
der von ihr begleiteten Personen geschieht (**offene Entscheidung**: Verbleib
beim Betreiber, Übertragung auf eine andere Begleitperson mit neuer
Einwilligung, Herausgabe an die Person oder Löschung); die betroffenen Personen
werden informiert; und bestand eine Vorschlagsbefugnis, wird entschieden, was
mit den von ihr vorgeschlagenen Begleitpersonen geschieht.

Nach dem Ausscheiden einer Begleitperson dürfen keine Daten einer begleiteten
Person ohne identifizierbare verantwortliche Stelle zurückbleiben.

---

## 7. Rechte der begleiteten Person

Solange die begleitete Person kein eigenes Konto hat (§0.2), sind ihre Rechte
auf Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung und
Datenübertragbarkeit **nicht in der Anwendung ausübbar**. Deshalb müssen sie
schriftlich abgesichert sein:

- die Einwilligungsvorlage enthält eine direkte Kontaktmöglichkeit zum
  Betreiber, damit sie nicht von der Begleitperson abhängt;
- der Betreiber unterhält ein manuelles Verfahren, um solche Anfragen innerhalb
  der Fristen der DSGVO zu bearbeiten, einschließlich der Auffindung der
  betreffenden Kabine;
- ein Löschverlangen muss auch dann ausführbar sein, wenn die Begleitperson
  nicht mitwirkt.

Dieser Punkt ist der tatsächliche Preis der Variante A und muss ausdrücklich
festgehalten werden, nicht bloß mitgedacht.

---

## 8. Aufnahme von Begleitpersonen im Piloten

Für den Piloten gilt das restriktivste Modell, passend zum geschlossenen
Charakter der Stufe B:

1. **Erste Begleitpersonen ("Saat"):** jede Aufnahme genehmigt der Betreiber
   einzeln nach vorherigem Gespräch. Keine freie Registrierung, keine
   Selbstbedienung.
2. **Keine aktive Delegation:** keine Begleitperson kann eine andere aufnehmen.
   Sie kann allenfalls eine Person **vorschlagen**, die der Betreiber bestätigt
   oder ablehnt.
3. **Ausdrückliche Quote:** Höchstzahl begleiteter Personen je Begleitperson,
   bei Aufnahme festgelegt und überprüfbar.
4. **Namentliche Erfassung:** wer sie ist, wen sie begleitet und seit wann.

Das im Vorschlag §3.1 beschriebene Patenschaftsnetz mit Tiefe und Quoten bleibt
**außerhalb des Piloten**. Es kommt erst in Betracht, wenn echte Erfahrung mit
den ersten Begleitpersonen vorliegt und die Statuten in Kraft sind.

---

## 9. Versionskontrolle

| Version | Datum | Änderungen | Status |
|---|---|---|---|
| 0.1-Entwurf | 2026-08-02 | Erstfassung aus ADR-018 und Rechtsleitfaden | Nicht in Kraft |

Beim Inkrafttreten: Version 1.0 festlegen, Datum erfassen, die deutsche Fassung
als verbindlich kennzeichnen und die Kennung in `statutes_version` abbilden.
