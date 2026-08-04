# Einwilligung der begleiteten Person · ENTWURF

Version **0.1-Entwurf** · 2026-08-02
Status: **NICHT IN KRAFT** — Arbeitsentwurf zur juristischen Prüfung
Schwesterdokument: `STATUTEN-BEGLEITPERSON.md` · Zugehöriger ADR: ADR-018
Spanische Fassung: `CONSENTIMIENTO-PERSONA-ACOMPANADA.md` (Arbeitsfassung)

> **Hinweis.** Entwurf auf Grundlage von `apps/web/lib/consent.ts`
> (`CONSENT_TEXT_DE`) und der `GUIA-LEGAL-PILOTO-ALEMANIA.md`. Kein geprüfter
> Rechtstext; **mit niemandem zu unterzeichnen**, bevor eine deutsche
> Fachperson ihn geprüft hat.
>
> Hängt von den offenen Entscheidungen in §0 der Statuten ab, insbesondere
> davon, wer Verantwortlicher ist (§0.1). Die mit `[[ … ]]` markierten Lücken
> sind vor Verwendung auszufüllen; die mit `[[ENTSCHEIDEN: … ]]` markierten
> erfordern eine vorherige Entscheidung, nicht nur eine Angabe.
>
> **Diese deutsche Fassung ist die, die nach der Prüfung verbindlich werden
> soll.**
>
> Diese Einwilligung wird **auf Papier oder auf einem nachweisbaren Weg
> außerhalb der Anwendung** unterzeichnet, weil die unterzeichnende Person kein
> Konto haben muss. Sie ist aufzubewahren: ohne sie darf die Begleitperson
> keine Daten dieser Person eingeben.
>
> **Anrede:** "Sie", abweichend vom "du" der Anwendung — förmliches,
> unterzeichnetes Dokument, das auch von älteren oder unterstützungsbedürftigen
> Personen gelesen wird.

---

## Anwendungshinweise (nicht Teil des zu unterzeichnenden Dokuments)

- Es wird **eine Einwilligung je begleiteter Person** ausgestellt, nicht eine je
  Begleitperson und keine pauschale.
- Der Person wird eine unterschriebene Kopie ausgehändigt. Liegt sie nur bei der
  Begleitperson, läuft §6 leer.
- Kann die Person nicht selbst einwilligen, genügt dieses Dokument **nicht**:
  siehe §0.4 der Statuten, Position noch offen.
- Der Text behauptet nichts, was nicht bereits in `consent.ts` entschieden ist.
  Wo die Verarbeitung von der regulären abweicht (Daten, die eine dritte Person
  eingibt; kein eigenes Konto), wird das ausdrücklich gesagt.

---

# Information und Einwilligung in die Verarbeitung von Gesundheitsdaten in VitaMap

## 1. Wer Ihre Daten verarbeitet

**Verantwortlicher:** `[[NAME ODER FIRMA, ANSCHRIFT UND ECHTE KONTAKTDATEN DES
BETREIBERS]]`

> Der Rechtsleitfaden §4.1 ist eindeutig: es muss eine echte Identifikation
> angegeben werden. "Der Betreiber dieser Instanz" genügt nicht.

**Ihre Begleitperson:** `[[NAME DER BEGLEITPERSON]]`, die Ihre Informationen im
Werkzeug eingibt und einsieht.

`[[ENTSCHEIDEN: gemäß §0.1 der Statuten ist hier anzugeben, ob die
Begleitperson unter der Verantwortung des Betreibers handelt (Annahme b) oder
ob sie selbst Verantwortliche ist und der Betreiber Auftragsverarbeiter
(Annahme a). Die Formulierung dieses Abschnitts ändert sich entsprechend.]]`

**Direkter Kontakt für Ihre Rechte:** `[[E-MAIL UND POSTANSCHRIFT DES
BETREIBERS]]`. Sie können sich jederzeit an diese Adresse wenden — **ohne den
Umweg über Ihre Begleitperson**.

## 2. Was VitaMap ist

Ein pädagogisches Werkzeug, das hilft, Gesundheitsinformationen zu ordnen und
zu verstehen. **Es stellt keine Diagnosen, empfiehlt keine Behandlungen und
ersetzt keine Beratung durch medizinisches Fachpersonal.** Es darf nicht in
Notfällen verwendet werden.

## 3. Was verarbeitet wird und wozu

**Zweck:** Ihre Begleitperson soll Ihre Gesundheitsinformationen ordnen und mit
dem Assistenten des Werkzeugs darüber sprechen können, um Ihnen zu helfen, sie
besser zu verstehen.

**Daten:** diejenigen, die Sie und diese Person gemeinsam festlegen. Dazu können
Laborergebnisse, ärztliche Befunde, Beobachtungen zu Ihrem Befinden, Antworten
auf Fragebögen und hochgeladene Bilder gehören. Es handelt sich um
Gesundheitsdaten, die nach Art. 9 DSGVO besonders geschützt sind.

**Es wird nur das Erforderliche eingegeben.** Wenn Sie nicht möchten, dass etwas
Bestimmtes in das Werkzeug gelangt, sagen Sie es: es muss nicht hinein.

**Rechtsgrundlage:** Ihre **ausdrückliche Einwilligung** nach Art. 6 Abs. 1
lit. a und Art. 9 Abs. 2 lit. a DSGVO. Ohne sie werden keine Daten von Ihnen
verarbeitet.

## 4. Wer Ihre Informationen sehen kann

Ihre in §1 genannte Begleitperson und sonst niemand unter den Nutzenden des
Werkzeugs. Keine andere Begleitperson und keine anderen Nutzenden können auf
Ihre Daten zugreifen: das System verhindert es technisch und verweigert den
Zugriff standardmäßig.

Der Betreiber kann aus technischen Gründen zugreifen — Wartung, Sicherheit oder
zur Bearbeitung einer Anfrage von Ihnen.

**Jeder Zugriff wird unveränderbar protokolliert:** wer zugegriffen hat, worauf,
wann und in welcher Form. Sie können Einsicht in dieses Protokoll verlangen.

**Beteiligte Dienstleister:** Das Werkzeug wird auf einem Server in der
Europäischen Union betrieben (Hetzner). Während der Pilotphase werden die
Anfragen an den KI-Assistenten (die Frage und die zur Beantwortung nötigen
Kontextausschnitte) über Mistral AI verarbeitet, einen Anbieter mit Sitz in der
Europäischen Union, mit deaktivierter Nutzung für das Modelltraining. Ihre
Dokumente und der Hauptspeicher verbleiben auf dem Server. Sind externe
Sicherungskopien aktiviert, speichert Backblaze B2 verschlüsselte Kopien. Sie
zahlen nichts und haben kein Abonnement, daher erhält **kein
Zahlungsdienstleister Informationen über Sie**. `[[PRÜFEN gegen die geltende
Dienstleisterliste im Rechtsleitfaden §4.3 vor der Unterzeichnung — ändert sich
der Anbieter für Inferenz oder Sicherungskopien, ändert sich dieser Absatz.]]`

**Ihre Daten werden in keinem Fall zum Training von Modellen verwendet.**

## 5. Wie lange

Solange die Begleitung und Ihre Einwilligung bestehen. Widerrufen Sie sie, oder
endet die Begleitung, werden Ihre Daten aus dem aktiven Speicher gelöscht.

`[[ENTSCHEIDEN: was mit Ihren Daten geschieht, wenn Ihre Begleitperson das
Werkzeug nicht mehr nutzt — siehe §6 der Statuten. Muss hier in einem klaren
Satz beantwortbar sein.]]`

Verschlüsselte Sicherungskopien bleiben isoliert, werden für keinen anderen
Zweck verwendet und verfallen nach der veröffentlichten Aufbewahrungsregel.

## 6. Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Widerspruch,
Einschränkung der Verarbeitung und Datenübertragbarkeit. Ebenso das Recht, sich
bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren.

**Wie Sie sie ausüben:** durch eine Nachricht an den Kontakt in §1. Da Sie kein
eigenes Konto im Werkzeug haben, können Sie diese Rechte nicht in der Anwendung
ausüben; der Betreiber verpflichtet sich, sie dennoch innerhalb der gesetzlichen
Fristen zu erfüllen — **auch wenn Ihre Begleitperson nicht mitwirkt oder nicht
einverstanden ist**.

**Sie können Ihre Einwilligung jederzeit und ohne Angabe von Gründen
widerrufen.** Der Widerruf berührt nicht die Rechtmäßigkeit der bis dahin
erfolgten Verarbeitung. Mit dem Widerruf wird der Zugriff sofort unterbrochen
und Ihre Daten werden aus dem aktiven Speicher gelöscht.

## 7. Was Sie unterschreiben

Kreuzen Sie jedes Feld nur an, wenn Sie einverstanden sind. Sie können einzelne
Felder ablehnen, und Sie können auch gar nicht unterschreiben.

- [ ] Ich habe diese Information gelesen und konnte Fragen stellen.
- [ ] Ich verstehe, dass VitaMap ein pädagogisches Werkzeug und **kein
      Medizinprodukt** ist, keine medizinische Beratung darstellt und nicht für
      Notfälle geeignet ist.
- [ ] Ich willige **ausdrücklich** in die Verarbeitung meiner Gesundheitsdaten
      in VitaMap nach Art. 9 Abs. 2 lit. a DSGVO zu den beschriebenen
      Bedingungen ein.
- [ ] Ich ermächtige `[[NAME DER BEGLEITPERSON]]`, meine
      Gesundheitsinformationen im Werkzeug einzugeben und einzusehen und mit
      dem Assistenten darüber zu sprechen.
- [ ] Ich weiß, dass ich diese Ermächtigung jederzeit durch eine Nachricht an
      `[[KONTAKT DES BETREIBERS]]` widerrufen kann und der Zugriff dann sofort
      unterbrochen wird.
- [ ] Ich habe eine unterschriebene Kopie dieses Dokuments erhalten.

<br>

| | |
|---|---|
| Name der begleiteten Person | `……………………………………………` |
| Datum und Ort | `……………………………………………` |
| Unterschrift | `……………………………………………` |
| | |
| Name der Begleitperson | `……………………………………………` |
| Unterschrift | `……………………………………………` |

<br>

**Dokumentversion:** 0.1-Entwurf · 2026-08-02
**Interne Kennung des Eintrags:** `[[wird bei der Registrierung der
Einwilligung im System vergeben — Feld consent_version des Grants]]`

---

## Versionskontrolle

| Version | Datum | Änderungen | Status |
|---|---|---|---|
| 0.1-Entwurf | 2026-08-02 | Erstfassung aus consent.ts und Rechtsleitfaden | Nicht in Kraft |
