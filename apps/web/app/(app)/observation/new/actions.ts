"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeObservation } from "@/lib/memory";
import { logAuditEventSafe } from "@/lib/audit";
import { requireDataSubject } from "@/lib/data-access-guards";

export async function createObservationAction(formData: FormData) {
  const { subject: userId } = await requireDataSubject("manage");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const observed_at = String(formData.get("observed_at") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  if (!title || !body || !observed_at) {
    throw new Error("missing required fields");
  }

  const { path } = await writeObservation(userId, {
    observedAt: observed_at,
    title,
    body,
    tags,
  });

  await logAuditEventSafe({
    actor: userId,
    action: "memory.write",
    subjectId: userId,
    payloadSum: `type=observation file=${path.split("/").slice(-1)[0]}`,
  });

  revalidatePath("/memory");
  redirect("/memory");
}
