import { redirect } from "next/navigation";
import { hasActiveSubscription } from "./billing";
import {
  requireUserId,
  requireUserIdFromRequest,
} from "./session";

export class SubscriptionRequiredError extends Error {
  constructor() {
    super("subscription_required");
    this.name = "SubscriptionRequiredError";
  }
}

/**
 * Guarda para Server Components y Server Actions que manejan datos de salud.
 * Billing, ajustes, exportacion y borrado usan requireUserId() directamente.
 */
export async function requireSubscribedUserId(): Promise<string> {
  const userId = await requireUserId();
  if (!hasActiveSubscription(userId)) {
    redirect("/settings/billing?required=1");
  }
  return userId;
}

/** Guarda equivalente para Route Handlers. */
export async function requireSubscribedUserIdFromRequest(
  req: Request,
): Promise<string> {
  const userId = await requireUserIdFromRequest(req);
  if (!hasActiveSubscription(userId)) {
    throw new SubscriptionRequiredError();
  }
  return userId;
}
