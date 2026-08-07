# VitaMap

*[Versión en español](README.md)*

A self-hosted personal health intelligence platform. It helps a person make
sense of their own health data — lab results, documents, notes — and prepare
better questions for the professionals who treat them.

**It is an educational tool, not a medical device.** It does not diagnose, does
not prescribe, and does not replace a qualified clinician. That constraint is
not a disclaimer bolted on at the end; it is enforced in code (see
[The anti-diagnosis guardrail](#the-anti-diagnosis-guardrail)).

Self-hosted · GDPR-oriented · EU infrastructure.

---

## Current status

**Phase 1 — closed pilot.** Running on a single Hetzner VPS in the EU, serving
a small invite-only group. The stack is Docker Compose: Caddy (TLS) + Next.js +
restic backups, with the LLM either local (llama.cpp) or delegated to an EU API
provider during the tuning phase (see
[Where inference happens](#where-inference-happens)).

Data from real third parties is gated behind a legal and technical checklist
documented in [the German pilot guide](docs/es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md).

---

## The idea

Most people receive their health data as a stack of PDFs they cannot read, at
appointments too short to ask everything they wanted to ask. The information
exists, but it is fragmented across labs, clinics and years, and none of it is
in a form they can think with.

VitaMap gives that person a private space where their own data accumulates over
time and becomes searchable, contextualized, and explainable in ordinary
language. The assistant is deliberately Socratic: it explains what a marker
*is*, what the literature says about it in general, and what would be worth
asking — but it does not tell you what *your* result means for *you*. That line
is the product.

Three things follow from this:

1. **The data is the most sensitive category that exists.** Health data is
   GDPR Article 9 special-category data. The architecture is organized around
   that fact rather than adapted to it afterwards.
2. **Retrieval must be honest.** Answers are grounded in a curated scientific
   corpus with explicit evidence levels and citations, not in the model's
   recollection.
3. **The user owns the exit.** Export and deletion are first-class features,
   not support tickets.

---

## How a user experiences it

1. Receives a nominative invitation (registration is closed — see
   [Invitations](#invitations-and-registration)).
2. Registers with email + password and accepts two explicit acknowledgements:
   the educational nature of the tool, and Article 9(2)(a) consent for
   processing health data. The version of the consent text they accepted is
   recorded.
3. Completes Stripe Checkout. Functional access is granted **only** when the
   webhook confirms an active subscription — returning from Checkout is not
   enough.
4. Uploads documents (OCR runs server-side), builds up a memory of markers and
   notes, and chats with an assistant that cites the corpus.
5. Can export everything as a ZIP, or delete the account and have the data
   actually erased.

---

## Architecture at a glance

A monorepo with a single application package. Next.js 15 (App Router, Node
runtime — native dependencies: `better-sqlite3`, `@tobilu/qmd`).

```
apps/web/            Next.js 15 + TypeScript (UI + API)
  lib/               ~50 modules: the actual logic
  app/api/           route handlers
  scripts/           test suites and operational tooling
corpus-preparation/  briefs, prompts and bundles used to build the corpus
eval/                YAML evaluation suites for the assistant
data/                runtime persistence (gitignored except the seed KB)
infra/               Docker Compose, Caddy, deployment scripts
docs/                architecture, administration and legal documentation
```

**The path of any request that touches user data:**

```
BetterAuth session          lib/session.ts
        ↓
subscription guard          lib/subscription-access.ts
        ↓
AUTHORIZATION CHOKE POINT   lib/data-access.ts        ← the security boundary
        ↓
per-user data addressing    lib/qmd.ts, lib/memory*.ts
        ↓
filesystem + SQLite         data/users/<id>/…, data/auth.sqlite
```

**Persistence** is deliberately boring: no Postgres in Phase 0/1 (ADR-005). Per
user, a directory `data/users/<id>/` holds memory (markdown with YAML
frontmatter), encrypted documents, an inbox and a QMD index. A single
`auth.sqlite` holds BetterAuth's tables, the audit log, invitations, billing
state and the data-access grant tables.

**Retrieval** runs on QMD as the RAG engine (ADR-001) with a multilingual
embedding model fixed from day one (Qwen3-Embedding-0.6B, ADR-002) so that the
corpus does not have to be re-indexed when a language is added.

---

## Data security

This is the part worth reading carefully.

### Design principles

- **One choke point, not many checks.** Authorization is not sprinkled across
  route handlers; every route that addresses `data/users/<id>` obtains that id
  from `requireDataSubject*()`, never from the session directly.
- **Fail closed.** Absence of a rule denies. Feature flags default to off.
- **The common user path adds no surface.** When a user accesses their own
  data, the grant table is never consulted at all.
- **Honest about what is not protected yet.** See
  [Known limitations](#known-limitations-stated-plainly).

### The authorization choke point (ADR-018)

`lib/data-access.ts` resolves *(actor, subject, scope)* for every data access.
Scopes are hierarchical: `manage ⊇ chat ⊇ read`. Seven invariants are enforced
and continuously tested:

1. `target == actor` → always allowed, **without touching the grants table**.
2. `target != actor` with no active grant → `ForbiddenError`, always.
3. A revoked grant cuts access immediately — status is read on every request,
   with no authorization cache.
4. Insufficient scope is denied.
5. Malformed ids are rejected *before* grants are consulted.
6. Every cross-subject access writes an audit event.
7. No data route may call `requireSubscribedUserId*()` directly — enforced
   automatically by a script, not by convention.

Invariant 7 is the interesting one: it is a static check
(`npm run check:data-access`) that fails the build if a new route bypasses the
choke point. There is exactly one documented allowlist entry, the GDPR export
route, which by design only ever touches the caller's own data.

**Anti-enumeration:** the error returned is identical whether or not the
subject exists. Subject existence is never queried separately.

**Double lock:** cross-account access as a whole sits behind the
`SUPPORTER_ACCESS_ENABLED` flag, which is off by default. Even with a valid
grant row in the database, access is denied while the flag is off.

Run `npm run test:data-access -w @vitamap/web` to execute the invariant suite.

### Encryption of documents at rest

Uploaded documents are encrypted with [age](https://age-encryption.org)
(`age-encryption`, pure JS — no binaries) using a **per-user key derived from
the master key**:

```
passphrase(userId) = HMAC-SHA256(MASTER_KEY, "user:" + userId)
```

The passphrase never leaves the server, and is never persisted — it is
recomputed on demand. Two consequences matter:

- Compromising one user's derived key does not yield any other user's key.
- Because the key is bound to the user id, erasing a user makes their
  ciphertext permanently undecryptable — data minimisation and right-to-erasure
  hold by construction rather than by cleanup discipline.

`MASTER_KEY` is validated at boot as exactly 64 hex characters (32 bytes). **If
it is lost, encrypted documents are unrecoverable — backups included.**

### Append-only audit log with a hash chain (ADR-007)

Every meaningful action writes to `audit_event` in `auth.sqlite`. Each row
carries `prev_hash` and `event_hash = sha256(prev || fields)`, so retroactive
tampering breaks the chain and is detectable. A daily verification runs against
it, and the application's `/api/health` endpoint reports `audit_chain: ok|broken`
— which is also how a restored backup is validated for integrity.

Recorded actions include authentication and consent events, memory reads and
writes, document lifecycle, chat queries and responses, guardrail blocks and
rewrites, crisis detection, corpus administration, account purges, and every
cross-subject access.

Actor and subject are recorded separately, which is what makes delegated access
auditable rather than merely logged.

### Authentication and sessions (ADR-009)

BetterAuth over SQLite, sharing the same database as the audit log so that no
additional infrastructure is introduced. Email + password, minimum 10
characters, httpOnly session cookie valid 14 days with daily refresh.

The session cookie is the **only** way a user is identified. There are no
`?userId=` query parameters anywhere in the application.

Managed identity services (Clerk, Auth0, Supabase Auth) were rejected
deliberately: they would send patient identities to a third party and undermine
the "nothing leaves the VPS" framing.

### Invitations and registration

Registration is closed (ADR-012). Invitation codes are nominative, bound to one
email address, expire, and allow exactly one account. VitaMap stores a **hash**
of the code, never the code itself, and codes must travel through a private
channel — never in a URL.

BetterAuth's direct sign-up endpoint is blocked: only the internal action that
already validated an invitation can create a user.

```bash
npm run invite -w @vitamap/web -- create person@example.com --days 7
npm run invite -w @vitamap/web -- list
npm run invite -w @vitamap/web -- revoke <invitation-id>
```

### Subscription gating

Enforced server-side. Without a confirmed payment, billing, settings, export
and account deletion remain reachable; chat, memory, documents and assessments
are blocked. Stripe TEST and LIVE states are kept separate in the local
database, so a subscription created during testing grants nothing once LIVE
keys are in use. Deleting an account cancels any live subscription first, so
nobody is charged for a service they no longer have.

### The anti-diagnosis guardrail

Every model response passes through a second, independent LLM call (ADR-006)
that classifies whether it contains diagnostic or prescriptive language. If it
does, the response is rewritten Socratically or blocked outright. This is a
safety layer that does not depend on the main model behaving well.

Streaming is deliberately disabled in Phase 1 (ADR-010): tokens cannot be
emitted before the guardrail has seen the complete response. Latency was traded
for integrity, knowingly.

A separate crisis-detection path (`lib/crisis.ts`) handles messages suggesting
acute distress.

### Backups

`restic` to a Hetzner Storage Box over SFTP, client-side encrypted, with
retention (7 daily / 4 weekly / 6 monthly) and periodic integrity checks. The
backup container mounts the data volume **read-only**, so it cannot corrupt what
it is protecting. Authentication is by SSH key, not by credentials in
environment variables.

`RESTIC_PASSWORD` shares the property of `MASTER_KEY`: lose it and the backups
are unrecoverable.

### GDPR rights in practice

- **Portability (Art. 20):** ZIP export of the full personal memory.
- **Erasure (Art. 17):** type-to-confirm plus password. Order of operations is
  audited: consent revocation → `rm -rf data/users/<id>/` → BetterAuth deletion
  → purge complete. Audit events survive the deletion under a pseudonymised
  identifier, which is what allows compliance to be *demonstrated* rather than
  asserted.
- **Consent versioning:** `CONSENT_VERSION` in `lib/consent.ts`. Which version
  each user accepted is stored; changes increment the version.

### Environment validation

All environment variables are validated with zod at boot (`lib/env.ts`) and the
process fails fast on anything missing or malformed — `MASTER_KEY` must be 64
hex characters, Stripe keys must match `sk_(live|test)_` / `price_` / `whsec_`
prefixes, URLs must parse. The intent is to fail at startup rather than halfway
through a user's checkout.

---

## Known limitations, stated plainly

A security section that only lists strengths is not useful. These are the gaps,
each with a documented decision and a review trigger:

| Gap | Status | Reference |
|---|---|---|
| **No full-disk encryption at rest** for active storage. An attacker with hypervisor-level disk access or a provider snapshot could read memory markdown and SQLite indexes. Documents remain age-encrypted. | Deferred to Phase 2. On a VPS, LUKS means every reboot blocks on a console passphrase or requires dropbear in initramfs; with one operator and three pilot users, the operational cost exceeded the risk. Accepted and disclosed — the consent text does **not** promise at-rest encryption of active storage. | ADR-015 |
| **No MFA yet.** | Blocking requirement before real third-party health data: TOTP or passkey with tested recovery, revocation and device-loss procedure. | ADR-009 |
| **Inference may leave the server during the pilot.** | See below. | ADR-014 |
| **Consent re-acceptance is not yet enforced** when the consent version increases. | Recorded as P0 before the real pilot. | ADR-009 |

### Where inference happens

Full local inference is the product's flag, but it is a *production* promise,
not a requirement of the tuning phase. Qwen3-4B on CPU produced 50–80 s per
response once the guardrail's second pass is included — unusable for iterating
on retrieval quality.

So during the pilot, inference may be delegated to an EU OpenAI-compatible
provider. **Everything else stays local**: the RAG index, authentication,
profiles, the audit log, backups. Only prompts travel, in transit.

Mandatory conditions before enabling external mode: confirmed training opt-out
in the provider's console, Zero Data Retention where the plan allows it,
explicit per-user consent during onboarding, and **no advertising of "total
privacy" while external mode is active**. Return to local inference is
triggered by any of: GPU server, end of the pilot phase, or more than 10 users.

The privacy promise is explicitly deferred here, not quietly broken. That
distinction is the point.

---

## Running it locally

Requirements: Node.js 22+, npm 10+, and something serving an OpenAI-compatible
LLM endpoint ([Ollama](https://ollama.com) or
[llama.cpp server](https://github.com/ggerganov/llama.cpp)). On macOS,
`brew install sqlite` helps — QMD uses SQLite with native extensions.

```bash
cp .env.example .env
#   openssl rand -hex 32  →  MASTER_KEY
#   openssl rand -hex 32  →  BETTER_AUTH_SECRET

npm install

# in another terminal
ollama pull qwen3:4b-instruct
ollama serve          # http://localhost:11434 — set LLM_BASE_URL accordingly

npm run dev           # → http://localhost:3000
```

Workspace commands:

```bash
npm run dev           # apps/web in development mode
npm run build         # production build
npm run typecheck     # type check across all workspaces
npm run lint          # lint across all workspaces
```

### Verification suites

Over 30 test suites, run individually per script. The security-relevant ones:

```bash
npm run test:data-access        -w @vitamap/web   # the 7 authorization invariants
npm run check:data-access       -w @vitamap/web   # static check of invariant 7
npm run test:memory-path-safety -w @vitamap/web   # path traversal defenses
npm run test:invitations        -w @vitamap/web
npm run test:billing            -w @vitamap/web
npm run test:crisis             -w @vitamap/web
```

Recommended in CI / pre-deploy: `typecheck`, `test:data-access` and
`check:data-access` at minimum.

---

## Production deployment

The Phase 1 stack lives in `infra/`: Docker Compose with Caddy (automatic TLS),
Next.js, optionally llama.cpp, and restic.

```bash
git clone <repo> vitamap && cd vitamap
cp infra/.env.example infra/.env     # fill in secrets and domain
bash infra/scripts/download-model.sh # only for local-LLM mode
cd infra && docker compose --env-file .env up -d --build
```

The `local-llm` Compose profile controls whether the llama.cpp container starts
at all; with external inference it stays down and frees roughly 5 GB of RAM.

Operational documentation (Spanish, with German translations):

- Day-to-day administration: [`docs/es/administracion/MANUAL-VPS.md`](docs/es/administracion/MANUAL-VPS.md)
  · [Deutsch](docs/de/HANDBUCH-VPS.md)
- Server migration runbook, including a tested restore procedure:
  [`docs/es/administracion/RUNBOOK-MIGRACION-SERVIDOR.md`](docs/es/administracion/RUNBOOK-MIGRACION-SERVIDOR.md)
- Architecture decision record: [`docs/es/arquitectura/DECISIONS.md`](docs/es/arquitectura/DECISIONS.md)
- Legal and technical pilot guide (Germany):
  [`docs/es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md`](docs/es/legal/GUIA-LEGAL-PILOTO-ALEMANIA.md)

---

## Roadmap

1. **Chat UI** — input in `/chat`, citation rendering with evidence type and
   level, token-by-token streaming (Phase 2, once the guardrail can operate on
   a stream without losing integrity).
2. **Memory viewer** — timeline, category filters, image viewer with
   client-side decryption.
3. **MFA before the real pilot** — TOTP or passkey with tested recovery.
   Blocking requirement before custodying third-party health data.
4. **ZIP memory export** — portability button in `/settings` (Art. 20).
5. **Legal dossier** — DPIA, Art. 30 register, MDR analysis, processor
   contracts and consumer documentation, per the German guide.

---

## Licence and notice

VitaMap is an **educational tool**. It issues no diagnoses and no treatment
recommendations, and does not substitute consultation with a qualified health
professional.
