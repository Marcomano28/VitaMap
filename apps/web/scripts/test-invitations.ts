import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assignConsumedInvitationToUser,
  consumeInvitation,
  createInvitation,
  listInvitations,
  reopenConsumedInvitation,
  releaseInvitation,
  reserveInvitation,
  revokeInvitation,
} from "../lib/invitations";

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vitamap-invitations-"));
  const dbPath = path.join(dir, "auth.sqlite");
  const now = 1_800_000_000;

  try {
  const created = createInvitation("Persona@Example.com", 7, dbPath, now);
  assert.equal(created.invitation.email, "persona@example.com");

  assert.equal(
    reserveInvitation("codigo-incorrecto", "persona@example.com", dbPath, now),
    null,
  );
  assert.equal(
    reserveInvitation(created.code, "otra@example.com", dbPath, now),
    null,
  );

  const reservation = reserveInvitation(
    created.code,
    "PERSONA@example.com",
    dbPath,
    now,
  );
  assert.ok(reservation);
  assert.equal(
    reserveInvitation(created.code, "persona@example.com", dbPath, now),
    null,
  );

  releaseInvitation(reservation, dbPath);
  const retried = reserveInvitation(
    created.code,
    "persona@example.com",
    dbPath,
    now,
  );
  assert.ok(retried);
  const pendingMarker = `pending:${retried.reservationId}`;
  assert.equal(consumeInvitation(retried, pendingMarker, dbPath, now), true);
  assert.equal(
    reserveInvitation(created.code, "persona@example.com", dbPath, now),
    null,
  );
  assert.equal(
    assignConsumedInvitationToUser(
      retried,
      pendingMarker,
      "user_12345678",
      dbPath,
    ),
    true,
  );

  const recoverable = createInvitation("retry@example.com", 7, dbPath, now);
  const recoverableReservation = reserveInvitation(
    recoverable.code,
    "retry@example.com",
    dbPath,
    now,
  );
  assert.ok(recoverableReservation);
  const recoverableMarker = `pending:${recoverableReservation.reservationId}`;
  assert.equal(
    consumeInvitation(recoverableReservation, recoverableMarker, dbPath, now),
    true,
  );
  assert.equal(
    reopenConsumedInvitation(
      recoverableReservation,
      recoverableMarker,
      dbPath,
    ),
    true,
  );
  assert.ok(
    reserveInvitation(recoverable.code, "retry@example.com", dbPath, now),
  );

  const expired = createInvitation("expired@example.com", 1, dbPath, now);
  assert.equal(
    reserveInvitation(expired.code, "expired@example.com", dbPath, now + 86_401),
    null,
  );

  const revoked = createInvitation("revoked@example.com", 7, dbPath, now);
  assert.equal(revokeInvitation(revoked.invitation.id, dbPath, now), true);
  assert.equal(
    reserveInvitation(revoked.code, "revoked@example.com", dbPath, now),
    null,
  );

  const rows = listInvitations(dbPath, now);
  assert.equal(rows.length, 4);
  assert.ok(rows.some((row) => row.consumedByUserId === "user_12345678"));
  assert.ok(rows.some((row) => row.revokedAt !== null));

  Object.assign(process.env, {
    AUTH_DB_PATH: dbPath,
    DATA_ROOT: dir,
    KB_INDEX_PATH: path.join(dir, "kb.sqlite"),
    LLM_BASE_URL: "http://127.0.0.1:8080/v1",
    LLM_MODEL: "test",
    LLM_API_KEY: "test",
    QMD_EMBED_MODEL: "test",
    MASTER_KEY:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
  });
  const { authorizeInternalSignup, getAuth } = await import("../lib/auth");
  const directSignup = await getAuth().handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "bypass@example.com",
        password: "password-segura-123",
        name: "Bypass",
      }),
    }),
  );
  assert.equal(directSignup.status, 403);

  const internalSignup = await getAuth().handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: authorizeInternalSignup(
        new Headers({ "content-type": "application/json" }),
      ),
      body: JSON.stringify({
        email: "internal@example.com",
        password: "password-segura-123",
        name: "Internal",
      }),
    }),
  );
  assert.equal(internalSignup.status, 200);

    console.log("Invitaciones: todas las pruebas pasaron.");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
