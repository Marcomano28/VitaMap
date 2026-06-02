/**
 * Helpers de sesión para server components, server actions y route handlers.
 *
 * Todas las funciones aquí asumen Node runtime (no Edge), ya que
 * BetterAuth + better-sqlite3 requieren acceso al filesystem.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

/** Devuelve la sesión activa o null. NO lanza. */
export async function getSession() {
  const auth = getAuth();
  return auth.api.getSession({ headers: await headers() });
}

/** Obtiene la sesión a partir de un Request (route handlers). */
export async function getSessionFromRequest(req: Request) {
  const auth = getAuth();
  return auth.api.getSession({ headers: req.headers });
}

/**
 * Devuelve el userId de la sesión. Si no hay sesión, redirige a /login.
 * Usar en server components y server actions.
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return safeUserId(session.user.id);
}

/**
 * Devuelve el userId de la sesión a partir de un Request o lanza 401.
 * Usar en route handlers.
 */
export async function requireUserIdFromRequest(req: Request): Promise<string> {
  const session = await getSessionFromRequest(req);
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return safeUserId(session.user.id);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Defensa en profundidad: rechaza userIds con caracteres que podrían
 * permitir path traversal. BetterAuth genera UUIDs así que pasa
 * trivialmente, pero validamos por si algún día cambia el esquema.
 */
export function safeUserId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
    throw new Error("userId con formato inválido");
  }
  return id;
}
