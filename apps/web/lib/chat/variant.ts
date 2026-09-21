import { z } from "zod";

export const ChatVariantSchema = z.enum(["current", "jev"]);
export type ChatVariant = z.infer<typeof ChatVariantSchema>;

type VariantSelection =
  | { allowed: true; variant: "current" }
  | {
      allowed: false;
      status: 403 | 503;
      error: "chat_experiment_forbidden" | "chat_variant_unavailable";
    };

/** Server-only policy: the callback must check the current authenticated actor.
 * No client flag, email, or requested subject grants experimental access.
 * Public free-text chat never dispatches to Jev. The synthetic-only laboratory
 * has its own admin API and accepts server-owned fixture IDs instead of text.
 */
export async function resolveChatVariant(
  requested: ChatVariant,
  policy: {
    experimentsEnabled: boolean;
    isAdminActor: () => Promise<boolean>;
  },
): Promise<VariantSelection> {
  if (requested === "current") return { allowed: true, variant: "current" };
  if (!policy.experimentsEnabled || !(await policy.isAdminActor())) {
    return { allowed: false, status: 403, error: "chat_experiment_forbidden" };
  }
  // This endpoint cannot supply the laboratory's synthetic-data guarantee.
  return { allowed: false, status: 503, error: "chat_variant_unavailable" };
}
