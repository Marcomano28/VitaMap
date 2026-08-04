/**
 * Choke point ÚNICO de autorización de acceso a datos de sujetos.
 *
 * Implementa la pieza crítica de PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-
 * PACIENTES.md (§5) y ADR-018: toda ruta que direcciona `data/users/<id>`
 * obtiene ese id de `requireDataSubject*()` / `resolveDataSubject()`,
 * nunca de la sesión directamente.
 *
 * Invariantes (ver suite scripts/test-data-access.ts):
 *   1. target == actor  → siempre permitido, SIN tocar la tabla de grants
 *      (camino del usuario común: cero superficie nueva).
 *   2. target != actor sin grant activo → ForbiddenError, siempre.
 *   3. Grant revocado → corte inmediato (status leído en cada petición,
 *      sin caché de autorización).
 *   4. Scope insuficiente → denegado (manage ⊇ chat ⊇ read).
 *   5. Ids con formato inválido se rechazan (safeUserId) ANTES de mirar
 *      grants.
 *   6. Todo acceso cruzado (actor != subject) deja evento de auditoría.
 *   7. Ninguna ruta de datos usa requireSubscribedUserId*() directamente
 *      (control automático: scripts/check-data-access-invariant.ts).
 *
 * Anti-enumeración: el error es idéntico exista o no el sujeto — nunca se
 * consulta la existencia del sujeto por separado.
 *
 * Fail-closed adicional: el acceso cruzado entero está detrás del flag
 * SUPPORTER_ACCESS_ENABLED (apagado por defecto, patrón lib/flags.ts).
 */

import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { getEnv } from "./env";
import { safeUserId } from "./user-id";
import { logAuditEventSafe } from "./audit";
import { supporterAccessEnabled } from "./flags";

// =====================================================================
// Tipos
// =====================================================================

export type DataScope = "read" | "chat" | "manage";

/** Jerarquía de scopes: un grant `manage` satisface `chat` y `read`, etc. */
const SCOPE_RANK: Record<DataScope, number> = { read: 1, chat: 2, manage: 3 };

export class ForbiddenError extends Error {
  constructor() {
    super("forbidden");
    this.name = "ForbiddenError";
  }
}

export type DataSubjectKind = "account" | "cubicle";
export type GrantOrigin = "ownership" | "patient_grant";

export interface DataSubject {
  id: string;
  kind: DataSubjectKind;
  displayLabel: string | null;
  createdBy: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface DataAccessGrant {
  id: string;
  dataSubjectId: string;
  actorUserId: string;
  scope: DataScope;
  origin: GrantOrigin;
  status: "active" | "revoked";
  consentVersion: string | null;
  grantedBy: string;
  grantedAt: string;
  revokedAt: string | null;
}

// =====================================================================
// DB (misma auth.sqlite que BetterAuth / audit_event / invitaciones)
// =====================================================================

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS data_subject (
    id            TEXT PRIMARY KEY,
    kind          TEXT NOT NULL CHECK (kind IN ('account','cubicle')),
    display_label TEXT,
    created_by    TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    archived_at   TEXT
  );
  CREATE TABLE IF NOT EXISTS data_access_grant (
    id              TEXT PRIMARY KEY,
    data_subject_id TEXT NOT NULL REFERENCES data_subject(id),
    actor_user_id   TEXT NOT NULL,
    scope           TEXT NOT NULL CHECK (scope IN ('read','chat','manage')),
    origin          TEXT NOT NULL CHECK (origin IN ('ownership','patient_grant')),
    status          TEXT NOT NULL CHECK (status IN ('active','revoked')),
    consent_version TEXT,
    granted_by      TEXT NOT NULL,
    granted_at      TEXT NOT NULL,
    revoked_at      TEXT,
    UNIQUE (data_subject_id, actor_user_id, scope)
  );
  CREATE INDEX IF NOT EXISTS data_access_grant_actor
    ON data_access_grant(actor_user_id, status);
`;

const connections = new Map<string, Database.Database>();

function getDb(): Database.Database {
  const dbPath = path.resolve(getEnv().AUTH_DB_PATH);
  const existing = connections.get(dbPath);
  if (existing) return existing;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const conn = new Database(dbPath);
  conn.pragma("journal_mode = WAL");
  conn.pragma("synchronous = NORMAL");
  conn.exec(CREATE_TABLES_SQL);
  connections.set(dbPath, conn);
  return conn;
}

interface GrantRow {
  id: string;
  data_subject_id: string;
  actor_user_id: string;
  scope: DataScope;
  origin: GrantOrigin;
  status: "active" | "revoked";
  consent_version: string | null;
  granted_by: string;
  granted_at: string;
  revoked_at: string | null;
}

function toGrant(row: GrantRow): DataAccessGrant {
  return {
    id: row.id,
    dataSubjectId: row.data_subject_id,
    actorUserId: row.actor_user_id,
    scope: row.scope,
    origin: row.origin,
    status: row.status,
    consentVersion: row.consent_version,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
  };
}

// =====================================================================
// Choke point
// =====================================================================

/**
 * Traduce (actor de sesión, sujeto solicitado, scope) → id de datos
 * autorizado, fallando cerrado.
 *
 * - `targetSubjectId` undefined o igual al actor: acceso propio (camino
 *   de hoy; no se consulta ninguna tabla).
 * - Distinto: exige flag activo + grant ACTIVO con scope suficiente.
 *   Si no, ForbiddenError idéntico exista o no el sujeto.
 * - El acceso cruzado se audita SIEMPRE.
 */
export async function resolveDataSubject(
  actorUserId: string,
  targetSubjectId: string | undefined,
  scope: DataScope,
): Promise<string> {
  const actor = safeUserId(actorUserId);
  const subject = safeUserId(targetSubjectId ?? actor);

  if (subject === actor) return subject; // acceso propio: camino corto

  // Todo lo que sigue es acceso cruzado.
  if (!supporterAccessEnabled()) {
    throw new ForbiddenError();
  }

  const grant = getActiveGrant(subject, actor, scope);
  if (!grant) {
    // Fail-closed + anti-enumeración: mismo error exista o no el sujeto.
    throw new ForbiddenError();
  }

  await logAuditEventSafe({
    actor,
    action: `data.cross_access.${scope}`,
    subjectId: subject,
    payloadSum: `grant=${grant.id} origin=${grant.origin}`,
  });
  return subject;
}

/**
 * Grant activo con scope suficiente (jerarquía manage ⊇ chat ⊇ read).
 * Lee `status` en cada llamada: la revocación corta al instante.
 */
export function getActiveGrant(
  dataSubjectId: string,
  actorUserId: string,
  scope: DataScope,
): DataAccessGrant | null {
  const rows = getDb()
    .prepare(
      `SELECT * FROM data_access_grant
       WHERE data_subject_id = ? AND actor_user_id = ? AND status = 'active'`,
    )
    .all(dataSubjectId, actorUserId) as GrantRow[];
  const sufficient = rows.find(
    (r) => SCOPE_RANK[r.scope] >= SCOPE_RANK[scope],
  );
  return sufficient ? toGrant(sufficient) : null;
}

export interface SubjectContext {
  /** userId real de la sesión (quien actúa). */
  actor: string;
  /** id de datos autorizado sobre el que operar (hoy siempre == actor). */
  subject: string;
}

// Las guardas de ruta (requireDataSubject / requireDataSubjectFromRequest)
// viven en lib/data-access-guards.ts para que este módulo no dependa de
// Next y la suite de seguridad pueda ejecutarlo aislado.

// =====================================================================
// Gestión de sujetos y grants (sin UI todavía; usados por scripts/tests
// y por el futuro flujo de cubículos/supporters)
// =====================================================================

export function createDataSubject(input: {
  kind: DataSubjectKind;
  createdBy: string;
  displayLabel?: string;
  /** Para kind='account' debe ser el userId de la cuenta. Para cubículos se genera. */
  id?: string;
}): DataSubject {
  const id = safeUserId(input.id ?? randomUUID().replace(/-/g, ""));
  const createdBy = safeUserId(input.createdBy);
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO data_subject (id, kind, display_label, created_by, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, input.kind, input.displayLabel ?? null, createdBy, createdAt);
  return {
    id,
    kind: input.kind,
    displayLabel: input.displayLabel ?? null,
    createdBy,
    createdAt,
    archivedAt: null,
  };
}

export function grantDataAccess(input: {
  dataSubjectId: string;
  actorUserId: string;
  scope: DataScope;
  origin: GrantOrigin;
  grantedBy: string;
  consentVersion?: string;
}): DataAccessGrant {
  const grant: DataAccessGrant = {
    id: randomUUID(),
    dataSubjectId: safeUserId(input.dataSubjectId),
    actorUserId: safeUserId(input.actorUserId),
    scope: input.scope,
    origin: input.origin,
    status: "active",
    consentVersion: input.consentVersion ?? null,
    grantedBy: safeUserId(input.grantedBy),
    grantedAt: new Date().toISOString(),
    revokedAt: null,
  };
  getDb()
    .prepare(
      `INSERT INTO data_access_grant
         (id, data_subject_id, actor_user_id, scope, origin, status,
          consent_version, granted_by, granted_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    )
    .run(
      grant.id,
      grant.dataSubjectId,
      grant.actorUserId,
      grant.scope,
      grant.origin,
      grant.consentVersion,
      grant.grantedBy,
      grant.grantedAt,
    );
  void logAuditEventSafe({
    actor: grant.grantedBy,
    action: "data.grant.created",
    subjectId: grant.dataSubjectId,
    payloadSum: `grant=${grant.id} actor=${grant.actorUserId} scope=${grant.scope} origin=${grant.origin}`,
  });
  return grant;
}

/** Revocación inmediata y dura: el siguiente resolveDataSubject ya deniega. */
export function revokeDataAccessGrant(grantId: string, revokedBy: string): boolean {
  const result = getDb()
    .prepare(
      `UPDATE data_access_grant
       SET status = 'revoked', revoked_at = ?
       WHERE id = ? AND status = 'active'`,
    )
    .run(new Date().toISOString(), grantId);
  if (result.changes === 1) {
    void logAuditEventSafe({
      actor: revokedBy,
      action: "data.grant.revoked",
      subjectId: grantId,
      payloadSum: `grant=${grantId}`,
    });
    return true;
  }
  return false;
}

/** Cubículo (Variante A): crea el sujeto y el grant `manage` del dueño. */
export function createCubicle(
  supporterUserId: string,
  displayLabel?: string,
): { subject: DataSubject; grant: DataAccessGrant } {
  const supporter = safeUserId(supporterUserId);
  const subject = createDataSubject({
    kind: "cubicle",
    createdBy: supporter,
    displayLabel,
  });
  const grant = grantDataAccess({
    dataSubjectId: subject.id,
    actorUserId: supporter,
    scope: "manage",
    origin: "ownership",
    grantedBy: supporter,
  });
  void logAuditEventSafe({
    actor: supporter,
    action: "data.subject.created",
    subjectId: subject.id,
    payloadSum: `kind=cubicle grant=${grant.id}`,
  });
  return { subject, grant };
}

export function listGrantsForActor(actorUserId: string): DataAccessGrant[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM data_access_grant
       WHERE actor_user_id = ? AND status = 'active'
       ORDER BY granted_at DESC`,
    )
    .all(safeUserId(actorUserId)) as GrantRow[];
  return rows.map(toGrant);
}

export function listGrantsForSubject(dataSubjectId: string): DataAccessGrant[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM data_access_grant
       WHERE data_subject_id = ?
       ORDER BY granted_at DESC`,
    )
    .all(safeUserId(dataSubjectId)) as GrantRow[];
  return rows.map(toGrant);
}
