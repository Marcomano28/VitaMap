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
import { UnauthorizedError, getSession } from "./session";
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
 * Rutas que el visitante anónimo puede ver en modo demostración.
 *
 * Deliberadamente corta. Cada entrada es una superficie más que revisar, así
 * que solo están las que enseñan el producto:
 *
 *   · `/memory` y `/memory/map` — la serie temporal, que es lo que se entiende
 *     de un vistazo.
 *   · `/chat` — el asistente citando el corpus.
 *   · `/upload` — se ve la habitación, pero inerte (ver la propia página).
 *
 * Fuera quedan `/settings` (borrado y facturación: no enseña producto),
 * `/inbox` (vacío sin datos propios) y `/admin` (superficie administrativa:
 * oculta, no desactivada).
 *
 * `/guide` no aparece porque nunca estuvo protegida: ya es pública.
 */
export const DEMO_VISIBLE_PREFIXES = [
  "/memory",
  "/chat",
  "/upload",
] as const;

/** ¿Es una ruta que el visitante anónimo puede ver con el modo encendido? */
export function isDemoVisiblePath(pathname: string): boolean {
  return DEMO_VISIBLE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
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
/**
 * Contexto de una página (Server Component), con o sin cuenta.
 */
export interface ViewContext extends SubjectContext {
  /** Sin cuenta: visitante del modo demostración, todo de solo lectura. */
  anonymous: boolean;
}

/**
 * Equivalente de `requireChatContext` para páginas.
 *
 * **Con sesión**: `requireDataSubject`, el camino de siempre. Si falta
 * suscripción redirige a billing, exactamente igual que antes.
 *
 * **Sin sesión y con `DEMO_MODE=true`**: visitante anónimo sobre
 * `DEMO_SUBJECT_ID`. El sujeto es constante, nunca viene de la URL.
 *
 * **Sin sesión y sin modo demostración**: redirige a login (comportamiento
 * heredado, vía `requireSubscribedUserId`).
 *
 * Solo se cae al camino anónimo si NO hay sesión. Quien tiene cuenta sin
 * suscripción sigue yendo a billing: no se cuela por la puerta del visitante.
 *
 * `anonymous` es la señal que usan las páginas para renderizarse en modo
 * escaparate: sin acciones, con el aviso de datos ficticios. La seguridad no
 * depende de ese flag — las rutas de escritura exigen sesión y suscripción por
 * su cuenta, y un anónimo nunca las satisface.
 */
export async function requireViewSubject(
  scope: DataScope,
): Promise<ViewContext> {
  if (demoModeEnabled()) {
    const session = await getSession();
    if (!session?.user) {
      return {
        actor: DEMO_SUBJECT_ID,
        subject: DEMO_SUBJECT_ID,
        anonymous: true,
      };
    }
  }
  const ctx = await requireDataSubject(scope);
  return { ...ctx, anonymous: false };
}

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
