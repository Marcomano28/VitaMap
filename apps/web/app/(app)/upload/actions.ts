"use server";

import { revalidatePath } from "next/cache";
import { deleteInboxItem } from "@/lib/inbox";
import { logAuditEventSafe } from "@/lib/audit";
import { requireUserId } from "@/lib/session";

export async function discardInboxItemAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteInboxItem(userId, id);
  await logAuditEventSafe({
    actor: userId,
    action: "document.delete",
    subjectId: userId,
    payloadSum: `id=${id} stage=inbox`,
  });
  revalidatePath("/upload");
}
