import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "vitamap-auth-email-"));
const authDb = path.join(root, "auth.sqlite");
const sent: Array<Record<string, unknown>> = [];

Object.assign(process.env, {
  LLM_BASE_URL: "http://localhost:8080/v1",
  LLM_MODEL: "test-model",
  LLM_API_KEY: "test-key",
  LLM_PROVIDER: "external",
  QMD_EMBED_MODEL: "test-embedding",
  DATA_ROOT: path.join(root, "data"),
  KB_INDEX_PATH: path.join(root, "kb.sqlite"),
  AUTH_DB_PATH: authDb,
  MASTER_KEY: "a".repeat(64),
  BETTER_AUTH_SECRET: "b".repeat(64),
  BETTER_AUTH_URL: "http://localhost:3000/api/auth",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NODE_ENV: "test",
  BREVO_API_KEY: "xkeysib-test-key",
  EMAIL_FROM: "VitaMap <no-reply@vitamap.example.com>",
  EMAIL_REPLY_TO: "support@vitamap.example.com",
});

globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
  return new Response(JSON.stringify({ messageId: "test" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertSentCount(expected: number, message: string) {
  if (sent.length !== expected) {
    throw new Error(`${message}: esperado=${expected}, obtenido=${sent.length}`);
  }
}

function extractUrl(payload: Record<string, unknown>, marker: string): URL {
  const text = String(payload.textContent ?? "");
  const line = text.split("\n").find((value) => value.includes(marker));
  assert(line, `No se encontró URL con ${marker}`);
  return new URL(line);
}

async function main() {
  const { authorizeInternalSignup, getAuthReady } = await import("../lib/auth");
  const auth = await getAuthReady();
  const baseHeaders = new Headers({ origin: "http://localhost:3000" });
  const signupHeaders = authorizeInternalSignup(baseHeaders);
  const email = "pilot@example.com";
  const oldPassword = "old-password-123";
  const newPassword = "new-password-456";

  const signup = await auth.api.signUpEmail({
    body: {
      email,
      password: oldPassword,
      name: "Pilot",
      callbackURL: "/settings/billing",
    },
    headers: signupHeaders,
  });
  assert(signup.token === null, "El registro no debe iniciar sesión");
  assertSentCount(1, "Debe enviarse un email de verificación");

  try {
    await auth.api.signInEmail({
      body: { email, password: oldPassword },
      headers: baseHeaders,
    });
    throw new Error("El login sin verificar debería fallar");
  } catch (err) {
    assert(
      typeof err === "object" &&
        err !== null &&
        "body" in err &&
        (err as { body?: { code?: string } }).body?.code ===
          "EMAIL_NOT_VERIFIED",
      "El login debe exigir email verificado",
    );
  }
  assertSentCount(2, "El login no verificado debe reenviar el enlace");

  const verificationUrl = extractUrl(sent[0], "/verify-email?");
  const token = verificationUrl.searchParams.get("token");
  assert(token, "El enlace de verificación debe contener token");
  await auth.api.verifyEmail({
    query: { token },
    headers: baseHeaders,
  });

  await auth.api.signInEmail({
    body: { email, password: oldPassword },
    headers: baseHeaders,
  });

  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/reset-password" },
    headers: baseHeaders,
  });
  assertSentCount(3, "Debe enviarse el email de recuperación");

  const resetUrl = extractUrl(sent[2], "/reset-password/");
  const resetToken = resetUrl.pathname.split("/").pop();
  assert(resetToken, "El enlace de recuperación debe contener token");
  await auth.api.resetPassword({
    body: { token: resetToken, newPassword },
    headers: baseHeaders,
  });

  const db = new Database(authDb);
  const sessions = db
    .prepare("SELECT COUNT(*) AS count FROM session")
    .get() as { count: number };
  db.close();
  assert(sessions.count === 0, "El reset debe revocar todas las sesiones");

  await auth.api.signInEmail({
    body: { email, password: newPassword },
    headers: baseHeaders,
  });

  console.log(
    "Auth email: registro sin auto-login, verificación obligatoria, reset y revocación de sesiones OK.",
  );
}

main()
  .finally(() => fs.rmSync(root, { recursive: true, force: true }))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
