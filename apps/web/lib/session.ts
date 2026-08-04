/**
 * Helpers de sesión para server components, server actions y route handlers.
 *
 * Todas las funciones aquí asumen Node runtime (no Edge), ya que
 * BetterAuth + better-sqlite3 requieren acceso al filesystem.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
// Re-export por compatibilidad: la implementación vive en lib/user-id.ts
// (módulo sin dependencias, compartido con el choke point de data-access).
import { safeUserId } from "./user-id";

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

export { safeUserId };
