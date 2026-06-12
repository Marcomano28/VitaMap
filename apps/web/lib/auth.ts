/**
 * BetterAuth — instancia singleton.
 *
 * Backend: better-sqlite3 sobre AUTH_DB_PATH (data/auth.sqlite por defecto).
 * Estrategia: email + contraseña + sesión por cookie httpOnly.
 *
 * BetterAuth crea automáticamente sus propias tablas (`user`, `session`,
 * `account`, `verification`) en la misma BD donde vive `audit_event`.
 * Ambas convivencias dentro del mismo fichero SQLite, sin conflictos.
 */

import path from "node:path";
import fs from "node:fs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { getEnv } from "./env";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email";
import { logAuditEventSafe } from "./audit";

const INTERNAL_SIGNUP_HEADER = "x-vitamap-internal-signup";

function internalSignupToken(): string {
  return createHmac("sha256", getEnv().BETTER_AUTH_SECRET)
    .update("vitamap:invited-signup:v1")
    .digest("hex");
}

function hasValidInternalSignupToken(headers?: Headers): boolean {
  const provided = headers?.get(INTERNAL_SIGNUP_HEADER) ?? "";
  const expected = internalSignupToken();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function authorizeInternalSignup(baseHeaders: Headers): Headers {
  const authorized = new Headers(baseHeaders);
  authorized.set(INTERNAL_SIGNUP_HEADER, internalSignupToken());
  return authorized;
}

function buildAuth() {
  const env = getEnv();
  fs.mkdirSync(path.dirname(env.AUTH_DB_PATH), { recursive: true });
  const db = new Database(env.AUTH_DB_PATH);
  db.pragma("journal_mode = WAL");

  return betterAuth({
    database: db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 256,
      // Recuperación de contraseña por email (Brevo). Enlace de 1 hora.
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPasswordEmail(user.email, url);
        await logAuditEventSafe({
          actor: user.id,
          action: "auth.password_reset.sent",
          subjectId: user.id,
          payloadSum: "",
        });
      },
      onPasswordReset: async ({ user }) => {
        await logAuditEventSafe({
          actor: user.id,
          action: "auth.password_reset.completed",
          subjectId: user.id,
          payloadSum: "sessions_revoked=true",
        });
      },
    },
    // Verificación obligatoria antes del primer login. Un intento de acceso
    // correcto pero no verificado reenvía el enlace con rate limit.
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(user.email, url);
        await logAuditEventSafe({
          actor: user.id,
          action: "auth.email_verification.sent",
          subjectId: user.id,
          payloadSum: "",
        });
      },
      afterEmailVerification: async (user) => {
        await logAuditEventSafe({
          actor: user.id,
          action: "auth.email_verified",
          subjectId: user.id,
          payloadSum: "",
        });
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;
        if (!hasValidInternalSignupToken(ctx.headers)) {
          throw new APIError("FORBIDDEN", {
            message: "El registro requiere una invitacion valida",
          });
        }
      }),
    },
    // Protección de fuerza bruta. Activado también en desarrollo para que
    // el comportamiento sea idéntico al de producción. Almacenamiento en
    // memoria: suficiente para una sola instancia (piloto).
    rateLimit: {
      enabled: true,
      window: 60, // segundos
      max: 60, // límite general por IP en endpoints de auth
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        // Anti-abuso del envío de emails de recuperación.
        "/request-password-reset": { window: 300, max: 3 },
        "/reset-password": { window: 60, max: 5 },
        "/send-verification-email": { window: 300, max: 3 },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14 días
      updateAge: 60 * 60 * 24, // refresh diario sin sacar de la sesión
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 min para reducir hits a la BD
      },
    },
    user: {
      additionalFields: {
        consentVersion: {
          type: "string",
          required: false,
          input: false,
        },
        consentGrantedAt: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    advanced: {
      // Misma cookie en HTTP local (dev) y HTTPS (prod). En prod las
      // cookies son Secure automáticamente al detectar baseURL https.
      useSecureCookies: env.NODE_ENV === "production",
      // IP real del cliente para el rate limit. Detrás de Caddy todas las
      // conexiones llegan desde el contenedor del proxy; la IP original
      // viaja en estas cabeceras, que Caddy SOBRESCRIBE con la dirección
      // real del cliente (ver infra/Caddyfile, header_up) — un cliente no
      // puede falsificarlas. Sin esto, el límite de 5 intentos/min de
      // login se compartiría entre todos los usuarios.
      ipAddress: {
        ipAddressHeaders: ["x-real-ip", "x-forwarded-for"],
      },
    },
    // Necesario para que los Server Actions de Next.js puedan escribir
    // la cookie de sesión al navegador vía next/headers cookies().
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof buildAuth>;

let _auth: AuthInstance | null = null;
let _ready: Promise<AuthInstance> | null = null;

export function getAuth(): AuthInstance {
  if (_auth) return _auth;
  _auth = buildAuth();
  // Ejecutar migraciones la primera vez — crea las tablas de BetterAuth
  // si no existen. Es idempotente y rápido en SQLite.
  if (!_ready) {
    _ready = _auth.$context
      .then((ctx) => ctx.runMigrations())
      .then(() => _auth!)
      .catch((err) => {
        console.error("[auth] runMigrations failed:", err);
        return _auth!;
      });
  }
  return _auth;
}

/** Espera a que las migraciones hayan terminado antes de operar. */
export async function getAuthReady(): Promise<AuthInstance> {
  getAuth();
  return _ready!;
}
