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
      // Iniciar sesión automáticamente tras registrarse (UX más limpia
      // dado que el alta es invite-only y ya hay confianza).
      autoSignIn: true,
      // Mínimos razonables para un piloto. Endurecer en Fase 2.
      minPasswordLength: 10,
      maxPasswordLength: 256,
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
