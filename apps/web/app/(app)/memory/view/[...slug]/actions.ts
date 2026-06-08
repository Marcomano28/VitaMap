"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { deleteMemoryItem } from "@/lib/memory-reader";
import { reindexUser } from "@/lib/qmd";
import { logAuditEventSafe } from "@/lib/audit";

export async function deleteMemoryItemAction(formData: FormData) {
  const userId = await requireSubscribedUserId();
  const relPath = String(formData.get("relPath") ?? "").trim();
  if (!relPath) throw new Error("missing relPath");

  await deleteMemoryItem(userId, relPath);
  // Reindexar para que QMD deje de devolverlo en queries.
  await reindexUser(userId);

  await logAuditEventSafe({
    actor: userId,
    action: "memory.delete",
    subjectId: userId,
    payloadSum: `path=${relPath}`,
  });

  revalidatePath("/memory/timeline");
  redirect("/memory/timeline");
}
