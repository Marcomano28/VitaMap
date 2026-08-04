/**
 * Guardas de ruta del choke point de autorización (ADR-018).
 *
 * Las rutas de datos usan ESTAS funciones en lugar de
 * requireSubscribedUserId*() (invariante 7, comprobado por
 * scripts/check-data-access-invariant.ts). Separadas de lib/data-access.ts
 * para que el core de autorización no dependa de Next.
 */

import {
  requireSubscribedUserId,
  requireSubscribedUserIdFromRequest,
} from "./subscription-access";
import {
  resolveDataSubject,
  type DataScope,
  type SubjectContext,
} from "./data-access";

/**
 * Server Components y Server Actions. Redirige a login/billing si falta
 * sesión o suscripción (comportamiento heredado de requireSubscribedUserId).
 *
 * `targetSubjectId` vendrá del selector de contexto del supporter cuando
 * exista UI; hoy las rutas no lo pasan y el camino es el propio (subject
 * == actor, sin tocar la tabla de grants).
 */
export async function requireDataSubject(
  scope: DataScope,
  targetSubjectId?: string,
): Promise<SubjectContext> {
  const actor = await requireSubscribedUserId();
  const subject = await resolveDataSubject(actor, targetSubjectId, scope);
  return { actor, subject };
}

/** Equivalente para Route Handlers (lanza en vez de redirigir). */
export async function requireDataSubjectFromRequest(
  req: Request,
  scope: DataScope,
  targetSubjectId?: string,
): Promise<SubjectContext> {
  const actor = await requireSubscribedUserIdFromRequest(req);
  const subject = await resolveDataSubject(actor, targetSubjectId, scope);
  return { actor, subject };
}
