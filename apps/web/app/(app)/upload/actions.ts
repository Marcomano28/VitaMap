"use server";

import { revalidatePath } from "next/cache";
import { deleteInboxItem } from "@/lib/inbox";
import { enqueueInboxExtraction } from "@/lib/inbox-queue";
import { logAuditEventSafe } from "@/lib/audit";
import { requireSubscribedUserId } from "@/lib/subscription-access";

export async function discardInboxItemAction(formData: FormData) {
  const userId = await requireSubscribedUserId();
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

export async function retryInboxExtractionAction(formData: FormData) {
  const userId = await requireSubscribedUserId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await enqueueInboxExtraction({ userId, id });
  revalidatePath("/upload");
  revalidatePath(`/inbox/${id}`);
}
