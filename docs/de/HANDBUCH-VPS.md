# Handbuch zur VPS-Administration

Version 1.0 · 2026-08-02
Status: Betriebsdokument · **bei Änderungen an `infra/` aktualisieren**

> Konsolidiertes Handbuch für den Betrieb der Instanz. Fasst zusammen, was
> zuvor über `infra/README.md`, `PILOTO-FASE1-GUIA-OPERATIVA.txt` und die
> Skripte verteilt war. Alle Befehle sind gegen `infra/docker-compose.yml` und
> `apps/web/package.json` geprüft.
>
> Spanische Fassung: `docs/es/administracion/MANUAL-VPS.md`.

**Vorab:** Keine echten Gesundheitsdaten gelangen ins System, bevor die
Blocker aus `CHECKLIST-GO-LIVE-PILOTO-REAL.md` und dem Rechtsleitfaden
`GUIA-LEGAL-PILOTO-ALEMANIA.md` abgearbeitet sind. Dieses Handbuch beschreibt,
*wie* betrieben wird, nicht *ob* betrieben werden darf.

---

## 1. Überblick über die Installation

Vier Dienste in Docker Compose, plus einer auf Abruf:

| Dienst | Aufgabe | Läuft |
|---|---|---|
| `caddy` | Reverse Proxy, automatisches TLS (Let's Encrypt) | Immer |
| `web` | Next.js-Anwendung mit eingebettetem QMD | Immer |
| `backup` | restic-Sidecar, täglicher verschlüsselter Snapshot zu Backblaze B2 | Immer |
| `llm` | llama.cpp mit Qwen3-4B | Nur mit Profil `local-llm` |
| `admin` | Administrative Aufgaben (Einladungen, KB) | Auf Abruf, Profil `tools` |

Die Daten liegen im Volume `vitamap_data`, eingebunden als `/data`:

```
/data
├── users/<userId>/     Speicher, verschlüsselte Dokumente, Index je Nutzer
├── kb/                 veröffentlichte Wissensbasis (RAG-Karten)
├── kb-inbox/           Entwürfe des Korpus, noch nicht veröffentlicht
├── auth.sqlite         Konten, Sitzungen, Audit, Einladungen, Billing
└── kb-index.sqlite     QMD-Index des Korpus
```

Alles andere ist rekonstruierbar. **Geht `/data` verloren, ist alles verloren** —
deshalb ist eine *getestete* Wiederherstellung Voraussetzung, nicht Kür.

Arbeitsverzeichnis auf dem aktuellen VPS: `/opt/vitamap-next`. Die Befehle
setzen `/opt/vitamap-next/infra` voraus, sofern nicht anders angegeben.

---

## 2. Neuinstallation

Nur für einen neuen VPS. Besteht die Instanz bereits, weiter bei §3.

**2.1 · Server vorbereiten** (Debian 12 / Ubuntu 24.04, LUKS auf Festplattenebene
aktiviert, bevor Docker installiert wird):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
git clone <repo-url> vitamap && cd vitamap
```

**2.2 · Umgebungsvariablen:**

```bash
cp infra/.env.example infra/.env
openssl rand -hex 32   # → MASTER_KEY
openssl rand -hex 32   # → BETTER_AUTH_SECRET
openssl rand -hex 32   # → RESTIC_PASSWORD
```

`infra/.env` mit Domain, Secrets und B2-Zugangsdaten befüllen. DNS-Einträge `A`
(und `AAAA` bei IPv6) auf den VPS richten.

> `MASTER_KEY` verschlüsselt die Nutzerdokumente. **Geht sie verloren, sind die
> Dokumente unwiederbringlich** — niemand kann sie entschlüsseln. Außerhalb des
> Servers in einem Passwortmanager aufbewahren.

**2.3 · Modell herunterladen** (nur im lokalen Modus):

```bash
bash infra/scripts/download-model.sh          # Qwen3-4B Q4_K_M, ca. 2,5 GB
```

Dauert 5–15 Minuten, nicht abbrechen. Für ein anderes Modell:

```bash
MODEL_REPO=Qwen/Qwen3-14B-Instruct-GGUF \
MODEL_FILE=qwen3-14b-instruct-q4_k_m.gguf \
bash infra/scripts/download-model.sh
```

(danach `LLM_MODEL_FILE` in `infra/.env` anpassen).

**2.4 · Stack starten:**

```bash
cd infra
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
```

Erster Start: 30–60 s, bis `web` *healthy* ist. Caddy holt das Zertifikat
selbstständig.

**2.5 · Wissensbasis indexieren:** siehe §5. Das Repository enthält nur einen
technischen Platzhalter und **keine für den Piloten geeignete wissenschaftliche
Basis**.

**2.6 · Prüfen:**

```bash
curl https://<deine-domain>/api/health
```

---

## 3. Täglicher Betrieb

```bash
cd /opt/vitamap-next/infra

# Status der Dienste
docker compose --env-file .env ps

# Logs live
docker compose --env-file .env logs -f web
docker compose --env-file .env logs -f web llm
docker compose --env-file .env logs web --tail=50

# Dienst neu starten
docker compose --env-file .env restart web

# Alles stoppen / starten
docker compose --env-file .env down
docker compose --env-file .env up -d
```

**Neue Version ausrollen:**

```bash
cd /opt/vitamap-next
git pull
cd infra
docker compose --env-file .env up -d --build
docker compose --env-file .env logs -f web     # Start beobachten
```

**Health-Check.** `GET /api/health` liefert `status`, `service`, `version`,
`phase`, `audit_chain` und `ts`. Erscheint `audit_chain` als `broken` oder
`error`, läuft der Dienst zwar möglicherweise weiter, ist aber **als Alarm zu
behandeln**: die Hash-Kette des Auditprotokolls verifiziert nicht, was
rechtliche und nicht nur technische Folgen hat.

---

## 4. Betriebsmodi und Kostengrenzen

### 4.1 Inferenz: lokal oder extern

Zwei Modi, gesteuert über zwei Variablen in `infra/.env`:

| Modus | Variablen | Wirkung |
|---|---|---|
| Lokal (empfohlen) | `COMPOSE_PROFILES=local-llm` · `LLM_PROVIDER=local` | Startet `llm` mit llama.cpp; nichts verlässt den VPS |
| Extern | `COMPOSE_PROFILES=` (leer) · `LLM_PROVIDER=external` | `llm` startet nicht; Anfragen gehen an den konfigurierten Anbieter |

Der externe Modus (derzeit Mistral, ADR-014) kommt nur mit Anbieter in der EU,
deaktivierter Nutzung für Modelltraining und einer Einwilligung in Betracht, die
das abbildet. **Ein Moduswechsel ändert, was den Nutzenden zugesagt wurde**: vor
einer Änderung `apps/web/lib/consent.ts` und den Rechtsleitfaden prüfen.

Auf einem CCX13 (2 dedizierte vCPU, EPYC) liegt die lokale Latenz bei 15–25 s
pro Antwort.

### 4.2 Tägliches Inferenzkontingent (ADR-019)

Begrenzt die täglichen **Kosten**, nicht die Frequenz (dafür ist der
Burst-Limiter im Code zuständig). Gezählt wird **eine Einheit pro Nutzerfrage**;
da jede Frage mehrere Modelldurchläufe auslöst (Generierung + Guardrail), ist
die Zahl der tatsächlichen Aufrufe ein Vielfaches davon. Das bei der
Dimensionierung berücksichtigen.

| Variable | Standard | Wofür |
|---|---|---|
| `LLM_DAILY_GLOBAL_MAX` | `300` | Obergrenze der gesamten Instanz. Die Garantie, dass die Rechnung nicht ausufert |
| `LLM_DAILY_USER_MAX` | `100` | Abonnent. Großzügig: im Normalbetrieb nicht spürbar. Absicherung gegen gestohlene Sitzung oder Client-Schleife |
| `LLM_DAILY_ANON_MAX` | `12` | Besucher im Demo-Modus, pro IP |
| `LLM_DISABLED` | `false` | **Notschalter.** Mit `true` wird jede Inferenz unterbunden |

Die Zähler liegen in `auth.sqlite` und **überstehen Neustarts**: ein Neustart des
Containers setzt die Obergrenze nicht zurück. Zurückgesetzt wird um
Mitternacht UTC.

Um laufenden Missbrauch zu stoppen:

```bash
cd /opt/vitamap-next/infra
sed -i 's/^LLM_DISABLED=.*/LLM_DISABLED=true/' .env
docker compose --env-file .env up -d web
```

Sitzung, Einstellungen, Export, Löschung und Billing funktionieren weiter; nur
die Inferenz wird verweigert.

Erreicht jemand das Abonnenten-Limit, ist das ein Hinweis, es anzuheben — nicht,
dass es gut funktioniert: dieses Limit soll im Normalbetrieb nie spürbar sein.

### 4.3 Demo-Modus (ADR-020)

`DEMO_MODE=true` macht die Instanz zu einer öffentlichen Demonstration: anonyme
Abfrage über **synthetische, nur lesbare** Daten, ohne Upload, ohne Registrierung
und ohne Bezahlung. Ausgeschaltet (Standard) verhält sich die Anwendung wie das
bisherige Pilotsystem.

Es lockert keine Zusicherung: die Tore der Go-live-Checkliste bleiben
unverändert geschlossen, denn dieser Modus verarbeitet keine Gesundheitsdaten
realer Personen.

**Beim Einschalten prüfen**, dass die Oberfläche deutlich ausweist, dass die
Daten fiktiv sind und es sich um eine Demonstration handelt, nicht um einen
Dienst. Es ist ein Gesundheitswerkzeug: diese Klarheit gehört zum Produkt und
ist keine Zierde.

---

## 5. Wissensbasis (KB)

Inhalte werden nach `HANDBUCH-RAG-KARTEN.md` erstellt und hochgeladen. Hier nur
die Serverbefehle.

```bash
# KB indexieren (erstmalig)
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts

# Vollständige Neuindexierung erzwingen
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/seed-kb.mts --force

# Index prüfen und echte Abfrage testen
docker compose --env-file .env --profile tools run --rm \
  --entrypoint node admin --import tsx scripts/check-kb.mts \
  "Vitamin D niedrige Werte"
```

Der letzte Befehl beantwortet die Frage "warum findet der Assistent das nicht?":
liefert `check-kb` nichts, liegt es am Korpus oder am Index, nicht am Modell.

---

## 6. Einladungen

Die Registrierung ist geschlossen. Ohne persönlichen, befristeten
Einmal-Code kann niemand ein Konto anlegen — der BetterAuth-Hook weist jede
Anmeldung ohne internen Code ab, auch über die Kommandozeile.

```bash
# Erstellen
docker compose --env-file .env --profile tools run --rm admin \
  create person@example.com --days 7

# Auflisten
docker compose --env-file .env --profile tools run --rm admin list

# Widerrufen
docker compose --env-file .env --profile tools run --rm admin \
  revoke <invitation-id>
```

**Der Code wird nur bei der Erstellung angezeigt.** Er wird über einen privaten
Kanal versandt und niemals in URLs, Tickets oder Logs eingefügt. Geht er
verloren: widerrufen und neu erstellen.

Auch die administrierende Person benötigt eine Einladung — es gibt keine
Abkürzung.

---

## 7. Korpus und Administrationskonto

Das Administrationskonto ist ein normales BetterAuth-Konto, dessen
E-Mail-Adresse in `ADMIN_EMAILS` in `infra/.env` steht. Keine zweite
Registrierung, kein separates Passwort. Oberfläche:

```
https://<deine-domain>/admin/corpus
```

Speichert Entwürfe in `/data/kb-inbox`, veröffentlicht nur Freigegebenes in
`/data/kb` und aktualisiert den Index. Einladungen werden dort **nicht**
verwaltet (§6).

---

## 8. Backups und Wiederherstellung

restic verschlüsselt `/data` vollständig und überträgt es alle 24 Stunden ab
Containerstart zu Backblaze B2, mit anfänglicher Zufallsverzögerung.

Konfiguration in `infra/.env`:

```
B2_ACCOUNT_ID=<account id>
B2_ACCOUNT_KEY=<application key>
RESTIC_REPOSITORY=b2:vitamap-backup:/restic
RESTIC_PASSWORD=<langes Passwort>
```

```bash
# Snapshots ansehen
docker compose --env-file .env exec backup restic snapshots

# Integrität des Backup-Repositories prüfen
docker compose --env-file .env exec backup restic check

# Nach Änderung der Zugangsdaten neu starten
docker compose --env-file .env restart backup
```

**Wiederherstellung** (bei gestopptem Stack):

```bash
docker compose --env-file .env run --rm backup /usr/local/bin/restore.sh /restore
```

`/restore` **im Container** prüfen, bevor es nach `/data` übernommen wird.
`/data` niemals direkt überschreiben, ohne vorher hineingesehen zu haben.

> Ein nie getestetes Backup ist kein Backup, sondern eine Annahme. Der Test ist
> Voraussetzung für den Go-live, keine offene Aufgabe.

---

## 9. Prüfbefehle des Codes

Auszuführen in `apps/web` (lokal oder im Administrationscontainer). Nach jeder
Änderung sinnvoll:

```bash
npm run typecheck                 # tsc --noEmit
npm run check:data-access         # Invariante des Autorisierungs-Choke-Points
npm run test:data-access          # Sicherheitssuite für Datenzugriff
npm run test:memory-path-safety   # Schutz vor Path Traversal
npm run taxonomy:check            # Marker-Taxonomie aktuell
npm run kb:check                  # Zustand des Korpus
npm run corpus:locale-audit       # Sprachaudit des Korpus
npm run eval                      # Evaluation des Assistenten (eval/*.yml)
```

Es gibt eine Suite je Modul (`npm run test:*` in `package.json`). Vor einem
Deployment mit echten Daten mindestens `typecheck`, `check:data-access`,
`test:data-access` und `test:memory-path-safety` durchlaufen lassen.

---

## 10. Häufige Störungen

| Symptom | Wo nachsehen |
|---|---|
| `web` startet nicht | `logs web` — fast immer eine ungültige Umgebungsvariable; `lib/env.ts` prüft beim Start und nennt die fehlerhafte |
| TLS-Zertifikat wird nicht ausgestellt | DNS falsch oder Port 443 geschlossen; `logs caddy` |
| `audit_chain: broken` in `/api/health` | Ernster Alarm: die Audit-Kette verifiziert nicht. Vor Weiterbetrieb klären |
| Assistent findet Inhalte nicht | `check-kb.mts` mit der Abfrage; ohne Treffer liegt es an Korpus oder Index |
| Latenz > 30 s | Modell/Hardware: siehe Skalierungstabelle |
| Registrierung abgewiesen | Fehlende gültige Einladung — erwartetes Verhalten (§6) |
| Keine Backup-Snapshots | B2-Zugangsdaten oder `RESTIC_PASSWORD`; `logs backup` |

**Wann skalieren:**

| Symptom | Maßnahme |
|---|---|
| Latenz > 30 s von Nutzenden gemeldet | Qwen3-7B oder Wechsel auf CCX53 (Phase 2) |
| KB > 5.000 Chunks, langsame Suche | CCX53 mit mehr RAM (Phase 2) |
| > 10 aktive Nutzende | Phase 2 |
| Latenz ist die Hauptbeschwerde | Phase 3 (VPS mit GPU) |

Details je Phase in `../es/arquitectura/ROADMAP.md` (spanisch).

---

## 11. Betriebssicherheit

- `infra/.env` **niemals** vom Server kopieren oder in einen Chat einfügen.
- `MASTER_KEY` und `RESTIC_PASSWORD` außerhalb des VPS in einem
  Passwortmanager. Ohne sie ist keine Wiederherstellung möglich.
- Einladungscodes gehören nicht in Logs, URLs oder Tickets.
- Bei Verdacht auf eine Datenschutzverletzung: eindämmen, Beweise sichern und
  dem Verfahren in `../es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md` §4.4 folgen —
  für die Meldung an die Aufsichtsbehörde gilt gegebenenfalls eine Frist von
  **72 Stunden**.
- Die Audit-Kette ist append-only mit Hash (ADR-007): `auth.sqlite` unter keinen
  Umständen von Hand bearbeiten.

---

## 12. Verwandte Dokumente

| Dokument | Wofür |
|---|---|
| `HANDBUCH-RAG-KARTEN.md` | Korpusinhalte erstellen und veröffentlichen |
| `STATUTEN-BEGLEITPERSON.md` | Statuten für Begleitpersonen (Entwurf) |
| `EINWILLIGUNG-BEGLEITETE-PERSON.md` | Einwilligungsvorlage (Entwurf) |
| `../es/administracion/CHECKLIST-GO-LIVE-PILOTO-REAL.md` | Was vor echten Daten fehlt (spanisch) |
| `../es/arquitectura/DECISIONS.md` | Warum die Dinge so sind, wie sie sind (ADR, spanisch) |
| `../es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md` | Rechtsrahmen, Stufen und Eintrittstore (spanisch) |
