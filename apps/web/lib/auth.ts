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
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { getEnv } from "./env";

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
