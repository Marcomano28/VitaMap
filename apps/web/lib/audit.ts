/**
 * Audit log append-only con hash chain.
 *
 * Implementación con better-sqlite3 sobre data/auth.sqlite (compartida
 * con BetterAuth cuando se cablee). Hash chain: cada evento contiene el
 * hash del evento anterior. Manipular un evento pasado rompe la cadena.
 */

import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import { getEnv } from "./env";

// =====================================================================
// Tipos
// =====================================================================

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.register"
  | "auth.invitation.used"
  | "auth.invitation.failed"
  | "auth.consent.granted"
  | "auth.consent.revoked"
  | "memory.read"
  | "memory.write"
  | "memory.delete"
  | "document.upload"
  | "document.extract"
  | "document.commit"
  | "document.delete"
  | "chat.query"
  | "chat.response"
  | "guardrail.block"
  | "guardrail.rewrite"
  | "kb.draft.create"
  | "kb.draft.update"
  | "kb.draft.delete"
  | "kb.publish"
  | "kb.retire"
  | "kb.reindex"
  | "user.purge";

export interface AuditEventInput {
  actor: string;
  action: AuditAction;
  subjectId?: string;
  payloadSum: string;
}

export interface AuditEvent extends AuditEventInput {
  id: number;
  ts: string;
  prevHash: string;
  eventHash: string;
}

// =====================================================================
// DB singleton
// =====================================================================

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  const env = getEnv();
  fs.mkdirSync(path.dirname(env.AUTH_DB_PATH), { recursive: true });
  const conn = new Database(env.AUTH_DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("synchronous = NORMAL");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS audit_event (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ts          TEXT    NOT NULL,
      actor       TEXT    NOT NULL,
      action      TEXT    NOT NULL,
      subject_id  TEXT,
      payload_sum TEXT    NOT NULL,
      prev_hash   TEXT    NOT NULL,
      event_hash  TEXT    NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS audit_event_subject_ts
      ON audit_event(subject_id, ts);
  `);
  db = conn;
  return conn;
}

const ZERO_HASH = "0".repeat(64);

function computeHash(
  prevHash: string,
  ts: string,
  actor: string,
  action: string,
  subjectId: string,
  payloadSum: string,
): string {
  return createHash("sha256")
    .update(prevHash)
    .update("|")
    .update(ts)
    .update("|")
    .update(actor)
    .update("|")
    .update(action)
    .update("|")
    .update(subjectId)
    .update("|")
    .update(payloadSum)
    .digest("hex");
}

// =====================================================================
// API pública
// =====================================================================

/**
 * Registra un evento. Síncrono internamente (better-sqlite3) pero
 * exportado como async para futura compatibilidad si migramos a un
 * backend remoto.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<AuditEvent> {
  const conn = getDb();
  return conn.transaction(() => {
    const last = conn
      .prepare("SELECT event_hash FROM audit_event ORDER BY id DESC LIMIT 1")
      .get() as { event_hash: string } | undefined;
    const prevHash = last?.event_hash ?? ZERO_HASH;
    const ts = new Date().toISOString();
    const subjectId = input.subjectId ?? "";
    const eventHash = computeHash(
      prevHash,
      ts,
      input.actor,
      input.action,
      subjectId,
      input.payloadSum,
    );

    const info = conn
      .prepare(
        `INSERT INTO audit_event (ts, actor, action, subject_id, payload_sum, prev_hash, event_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(ts, input.actor, input.action, input.subjectId ?? null, input.payloadSum, prevHash, eventHash);

    return {
      id: Number(info.lastInsertRowid),
      ts,
      actor: input.actor,
      action: input.action,
      subjectId: input.subjectId,
      payloadSum: input.payloadSum,
      prevHash,
      eventHash,
    };
  })();
}

/**
 * Verifica la integridad de la cadena completa. Devuelve { ok: true } si
 * todo es consistente; { ok: false, brokenAt: id } si encuentra rotura.
 */
export async function verifyAuditChain(): Promise<{ ok: boolean; brokenAt?: number }> {
  const conn = getDb();
  const rows = conn
    .prepare(
      `SELECT id, ts, actor, action, subject_id, payload_sum, prev_hash, event_hash
       FROM audit_event ORDER BY id ASC`,
    )
    .all() as Array<{
    id: number;
    ts: string;
    actor: string;
    action: string;
    subject_id: string | null;
    payload_sum: string;
    prev_hash: string;
    event_hash: string;
  }>;

  let expectedPrev = ZERO_HASH;
  for (const row of rows) {
    if (row.prev_hash !== expectedPrev) return { ok: false, brokenAt: row.id };
    const recomputed = computeHash(
      row.prev_hash,
      row.ts,
      row.actor,
      row.action,
      row.subject_id ?? "",
      row.payload_sum,
    );
    if (recomputed !== row.event_hash) return { ok: false, brokenAt: row.id };
    expectedPrev = row.event_hash;
  }
  return { ok: true };
}

/**
 * Wrapper conveniente: registra el evento y nunca lanza. Útil cuando
 * no queremos abortar el flujo principal por un fallo del log.
 */
export async function logAuditEventSafe(input: AuditEventInput): Promise<void> {
  try {
    await logAuditEvent(input);
  } catch (err) {
    console.error("[audit] FALLO al registrar evento", input.action, err);
  }
}
