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
import { UnauthorizedError } from "./session";
import { demoModeEnabled } from "./flags";
import { DEMO_SUBJECT_ID, clientIpKey } from "./demo";
import type { QuotaTier } from "./llm-quota";

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

/**
 * Contexto de una petición de chat, sea de una persona con cuenta o de un
 * visitante anónimo de la demostración.
 */
export interface ChatContext extends SubjectContext {
  /** Sin cuenta: visitante del modo demostración. */
  anonymous: boolean;
  /** Clave con la que se contabiliza la cuota diaria (ADR-019). */
  quotaKey: string;
  quotaTier: QuotaTier;
}

/**
 * Resuelve el contexto del chat admitiendo dos caminos.
 *
 * **Con sesión** (siempre, esté o no el modo demostración): el camino de
 * siempre, por el choke point de ADR-018. Nada cambia para quien tiene cuenta.
 *
 * **Sin sesión y con `DEMO_MODE=true`**: visitante anónimo. El sujeto es
 * `DEMO_SUBJECT_ID`, **constante y nunca tomado de la petición**, así que no
 * hay forma de que un visitante direccione los datos de una persona real. La
 * cuota se contabiliza por IP con la capa `anon`.
 *
 * **Sin sesión y sin modo demostración**: se propaga `UnauthorizedError`, igual
 * que antes.
 *
 * Solo se cae al camino anónimo ante `UnauthorizedError`. Una sesión válida sin
 * suscripción sigue recibiendo `SubscriptionRequiredError`: quien tiene cuenta
 * no debe colarse por la puerta de los visitantes.
 */
export async function requireChatContext(req: Request): Promise<ChatContext> {
  try {
    const ctx = await requireDataSubjectFromRequest(req, "chat");
    return {
      ...ctx,
      anonymous: false,
      quotaKey: ctx.actor,
      quotaTier: "user",
    };
  } catch (err) {
    if (err instanceof UnauthorizedError && demoModeEnabled()) {
      return {
        actor: DEMO_SUBJECT_ID,
        subject: DEMO_SUBJECT_ID,
        anonymous: true,
        quotaKey: clientIpKey(req),
        quotaTier: "anon",
      };
    }
    throw err;
  }
}
