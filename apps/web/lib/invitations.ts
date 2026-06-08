import { createHash, randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getEnv } from "./env";

const RESERVATION_TTL_SECONDS = 10 * 60;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS registration_invitation (
    id                      TEXT PRIMARY KEY,
    token_hash              TEXT NOT NULL UNIQUE,
    email                   TEXT NOT NULL,
    created_at              INTEGER NOT NULL,
    expires_at              INTEGER NOT NULL,
    reservation_id          TEXT,
    reservation_expires_at  INTEGER,
    consumed_at             INTEGER,
    consumed_by_user_id     TEXT,
    revoked_at              INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_invitation_email
    ON registration_invitation(email);
  CREATE INDEX IF NOT EXISTS idx_invitation_status
    ON registration_invitation(expires_at, consumed_at, revoked_at);
`;

export interface Invitation {
  id: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  consumedByUserId: string | null;
  revokedAt: Date | null;
  reserved: boolean;
}

export interface CreatedInvitation {
  invitation: Invitation;
  code: string;
}

export interface InvitationReservation {
  invitationId: string;
  reservationId: string;
  email: string;
}

interface InvitationRow {
  id: string;
  email: string;
  created_at: number;
  expires_at: number;
  reservation_id: string | null;
  reservation_expires_at: number | null;
  consumed_at: number | null;
  consumed_by_user_id: string | null;
  revoked_at: number | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

function defaultDbPath(): string {
  return getEnv().AUTH_DB_PATH;
}

function openDb(dbPath = defaultDbPath()): Database.Database {
  const resolvedPath = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  db.exec(CREATE_TABLE_SQL);
  return db;
}

function toInvitation(row: InvitationRow, now: number): Invitation {
  return {
    id: row.id,
    email: row.email,
    createdAt: new Date(row.created_at * 1000),
    expiresAt: new Date(row.expires_at * 1000),
    consumedAt: row.consumed_at ? new Date(row.consumed_at * 1000) : null,
    consumedByUserId: row.consumed_by_user_id,
    revokedAt: row.revoked_at ? new Date(row.revoked_at * 1000) : null,
    reserved:
      row.reservation_id !== null &&
      row.reservation_expires_at !== null &&
      row.reservation_expires_at > now,
  };
}

export function createInvitation(
  email: string,
  validForDays = 7,
  dbPath?: string,
  now = Math.floor(Date.now() / 1000),
): CreatedInvitation {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Email de invitacion invalido");
  }
  if (!Number.isInteger(validForDays) || validForDays < 1 || validForDays > 90) {
    throw new Error("La validez debe estar entre 1 y 90 dias");
  }

  const code = randomBytes(24).toString("base64url");
  const id = randomUUID();
  const expiresAt = now + validForDays * 24 * 60 * 60;
  const db = openDb(dbPath);
  try {
    db.prepare(
      `INSERT INTO registration_invitation
        (id, token_hash, email, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, hashCode(code), normalizedEmail, now, expiresAt);

    const row = db
      .prepare("SELECT * FROM registration_invitation WHERE id = ?")
      .get(id) as InvitationRow;
    return { invitation: toInvitation(row, now), code };
  } finally {
    db.close();
  }
}

export function reserveInvitation(
  code: string,
  email: string,
  dbPath?: string,
  now = Math.floor(Date.now() / 1000),
): InvitationReservation | null {
  const normalizedEmail = normalizeEmail(email);
  const tokenHash = hashCode(code);
  const reservationId = randomUUID();
  const db = openDb(dbPath);

  try {
    const result = db
      .prepare(
        `UPDATE registration_invitation
         SET reservation_id = @reservationId,
             reservation_expires_at = @reservationExpiresAt
         WHERE token_hash = @tokenHash
           AND email = @email
           AND expires_at > @now
           AND consumed_at IS NULL
           AND revoked_at IS NULL
           AND (
             reservation_id IS NULL
             OR reservation_expires_at IS NULL
             OR reservation_expires_at <= @now
           )`,
      )
      .run({
        reservationId,
        reservationExpiresAt: now + RESERVATION_TTL_SECONDS,
        tokenHash,
        email: normalizedEmail,
        now,
      });

    if (result.changes !== 1) return null;

    const row = db
      .prepare(
        `SELECT id, email
         FROM registration_invitation
         WHERE reservation_id = ?`,
      )
      .get(reservationId) as { id: string; email: string } | undefined;
    if (!row) return null;

    return {
      invitationId: row.id,
      reservationId,
      email: row.email,
    };
  } finally {
    db.close();
  }
}

export function consumeInvitation(
  reservation: InvitationReservation,
  consumedBy: string,
  dbPath?: string,
  now = Math.floor(Date.now() / 1000),
): boolean {
  const db = openDb(dbPath);
  try {
    const result = db
      .prepare(
        `UPDATE registration_invitation
         SET consumed_at = @now,
             consumed_by_user_id = @userId,
             reservation_id = NULL,
             reservation_expires_at = NULL
         WHERE id = @invitationId
           AND reservation_id = @reservationId
           AND reservation_expires_at > @now
           AND consumed_at IS NULL
           AND revoked_at IS NULL`,
      )
      .run({
        now,
        userId: consumedBy,
        invitationId: reservation.invitationId,
        reservationId: reservation.reservationId,
      });
    return result.changes === 1;
  } finally {
    db.close();
  }
}

export function assignConsumedInvitationToUser(
  reservation: InvitationReservation,
  pendingMarker: string,
  userId: string,
  dbPath?: string,
): boolean {
  const db = openDb(dbPath);
  try {
    const result = db
      .prepare(
        `UPDATE registration_invitation
         SET consumed_by_user_id = ?
         WHERE id = ?
           AND consumed_by_user_id = ?
           AND consumed_at IS NOT NULL`,
      )
      .run(userId, reservation.invitationId, pendingMarker);
    return result.changes === 1;
  } finally {
    db.close();
  }
}

export function reopenConsumedInvitation(
  reservation: InvitationReservation,
  pendingMarker: string,
  dbPath?: string,
): boolean {
  const db = openDb(dbPath);
  try {
    const result = db
      .prepare(
        `UPDATE registration_invitation
         SET consumed_at = NULL,
             consumed_by_user_id = NULL
         WHERE id = ?
           AND consumed_by_user_id = ?
           AND revoked_at IS NULL`,
      )
      .run(reservation.invitationId, pendingMarker);
    return result.changes === 1;
  } finally {
    db.close();
  }
}

export function releaseInvitation(
  reservation: InvitationReservation,
  dbPath?: string,
): void {
  const db = openDb(dbPath);
  try {
    db.prepare(
      `UPDATE registration_invitation
       SET reservation_id = NULL,
           reservation_expires_at = NULL
       WHERE id = ?
         AND reservation_id = ?
         AND consumed_at IS NULL`,
    ).run(reservation.invitationId, reservation.reservationId);
  } finally {
    db.close();
  }
}

export function listInvitations(
  dbPath?: string,
  now = Math.floor(Date.now() / 1000),
): Invitation[] {
  const db = openDb(dbPath);
  try {
    const rows = db
      .prepare("SELECT * FROM registration_invitation ORDER BY created_at DESC")
      .all() as InvitationRow[];
    return rows.map((row) => toInvitation(row, now));
  } finally {
    db.close();
  }
}

export function revokeInvitation(
  invitationId: string,
  dbPath?: string,
  now = Math.floor(Date.now() / 1000),
): boolean {
  const db = openDb(dbPath);
  try {
    const result = db
      .prepare(
        `UPDATE registration_invitation
         SET revoked_at = ?,
             reservation_id = NULL,
             reservation_expires_at = NULL
         WHERE id = ?
           AND consumed_at IS NULL
           AND revoked_at IS NULL`,
      )
      .run(now, invitationId);
    return result.changes === 1;
  } finally {
    db.close();
  }
}
