/**
 * Suite de seguridad del choke point de autorización (ADR-018).
 * Cubre los invariantes de PROPUESTA-USUARIOS-TERAPEUTAS-Y-ACCESO-
 * PACIENTES.md §5.3.
 *
 * Ejecutar: npm run test:data-access
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import {
  ForbiddenError,
  createCubicle,
  grantDataAccess,
  listGrantsForActor,
  resolveDataSubject,
  revokeDataAccessGrant,
} from "../lib/data-access";

// ---------------------------------------------------------------------
// Entorno hermético: BD temporal y variables mínimas. Los módulos lib no
// leen getEnv() en tiempo de import, así que fijarlas aquí es seguro.
// ---------------------------------------------------------------------

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vitamap-data-access-"));
process.env.AUTH_DB_PATH = path.join(tmp, "auth.sqlite");
const fallbackEnv: Record<string, string> = {
  LLM_BASE_URL: "http://localhost:9999",
  LLM_MODEL: "test",
  LLM_API_KEY: "test",
  QMD_EMBED_MODEL: "test",
  DATA_ROOT: path.join(tmp, "data"),
  KB_INDEX_PATH: path.join(tmp, "kb.sqlite"),
  MASTER_KEY: "a".repeat(64),
  BETTER_AUTH_SECRET: "s".repeat(40),
  BETTER_AUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};
for (const [key, value] of Object.entries(fallbackEnv)) {
  if (process.env[key] === undefined) process.env[key] = value;
}
delete process.env.SUPPORTER_ACCESS_ENABLED; // flag apagado al empezar

const ACTOR = "supporter00000001";
const OTHER = "patient000000001";

function countCrossAccessAudits(): number {
  const db = new Database(process.env.AUTH_DB_PATH!, { readonly: true });
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS n FROM audit_event
         WHERE action LIKE 'data.cross_access.%'`,
      )
      .get() as { n: number };
    return row.n;
  } finally {
    db.close();
  }
}

async function expectForbidden(fn: () => Promise<unknown>): Promise<ForbiddenError> {
  try {
    await fn();
  } catch (err) {
    assert.ok(err instanceof ForbiddenError, `esperaba ForbiddenError, fue ${err}`);
    return err;
  }
  throw new Error("esperaba ForbiddenError y no lanzó");
}

async function main() {
  // Invariante 1 — acceso propio siempre permitido, con flag apagado y
  // sin ninguna fila en la BD (el camino corto no toca grants).
  assert.equal(await resolveDataSubject(ACTOR, undefined, "read"), ACTOR);
  assert.equal(await resolveDataSubject(ACTOR, ACTOR, "manage"), ACTOR);

  // Flag apagado — todo acceso cruzado denegado aunque haya grant.
  process.env.SUPPORTER_ACCESS_ENABLED = "true";
  const { subject: cubicle, grant: ownGrant } = createCubicle(ACTOR, "Paciente A.M.");
  process.env.SUPPORTER_ACCESS_ENABLED = "false";
  await expectForbidden(() => resolveDataSubject(ACTOR, cubicle.id, "read"));

  // A partir de aquí, flag encendido.
  process.env.SUPPORTER_ACCESS_ENABLED = "true";

  // Invariante 2 + anti-enumeración — sin grant → ForbiddenError, con
  // error idéntico exista o no el sujeto.
  const errNoSubject = await expectForbidden(() =>
    resolveDataSubject(OTHER, "nonexistent00001", "read"),
  );
  const errNoGrant = await expectForbidden(() =>
    resolveDataSubject(OTHER, cubicle.id, "read"),
  );
  assert.equal(errNoSubject.name, errNoGrant.name);
  assert.equal(errNoSubject.message, errNoGrant.message);

  // Grant activo con scope suficiente → permitido y auditado.
  const before = countCrossAccessAudits();
  assert.equal(await resolveDataSubject(ACTOR, cubicle.id, "manage"), cubicle.id);
  // manage ⊇ chat ⊇ read
  assert.equal(await resolveDataSubject(ACTOR, cubicle.id, "chat"), cubicle.id);
  assert.equal(await resolveDataSubject(ACTOR, cubicle.id, "read"), cubicle.id);
  // Invariante 6 — cada acceso cruzado deja evento de auditoría.
  assert.equal(countCrossAccessAudits(), before + 3);

  // Invariante 4 — scope insuficiente denegado.
  const readGrant = grantDataAccess({
    dataSubjectId: cubicle.id,
    actorUserId: OTHER,
    scope: "read",
    origin: "patient_grant",
    grantedBy: ACTOR,
  });
  assert.equal(await resolveDataSubject(OTHER, cubicle.id, "read"), cubicle.id);
  await expectForbidden(() => resolveDataSubject(OTHER, cubicle.id, "chat"));
  await expectForbidden(() => resolveDataSubject(OTHER, cubicle.id, "manage"));

  // Invariante 3 — revocación corta al instante.
  assert.equal(revokeDataAccessGrant(readGrant.id, ACTOR), true);
  await expectForbidden(() => resolveDataSubject(OTHER, cubicle.id, "read"));
  // Revocar dos veces no "resucita" nada.
  assert.equal(revokeDataAccessGrant(readGrant.id, ACTOR), false);

  // El grant del dueño sigue intacto tras revocar el de OTHER.
  assert.equal(await resolveDataSubject(ACTOR, cubicle.id, "manage"), cubicle.id);
  assert.equal(listGrantsForActor(ACTOR).length, 1);
  assert.equal(listGrantsForActor(ACTOR)[0].id, ownGrant.id);

  // Invariante 5 — formato inválido rechazado antes de mirar grants.
  await assert.rejects(
    () => resolveDataSubject(ACTOR, "../../etc/passwd", "read"),
    /formato inválido/,
  );
  await assert.rejects(
    () => resolveDataSubject("bad id!", undefined, "read"),
    /formato inválido/,
  );

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("Data access: todas las pruebas pasaron.");
}

void main();
