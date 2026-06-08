"use server";

import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeImageObservation } from "@/lib/memory";
import { encryptForUser } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { logAuditEventSafe } from "@/lib/audit";
import { requireSubscribedUserId } from "@/lib/subscription-access";
import { getLocale } from "@/lib/locale";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function createImageObservationAction(formData: FormData) {
  const userId = await requireSubscribedUserId();
  const locale = await getLocale();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("missing file");
  if (file.size === 0) throw new Error("empty file");
  if (file.size > MAX_BYTES) throw new Error("file too large");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) throw new Error("formato no permitido");

  const observed_at = String(formData.get("observed_at") ?? "").trim();
  const category = String(formData.get("category") ?? "other") as
    | "iridology"
    | "tongue-tcm"
    | "skin"
    | "wound"
    | "other";
  const description = String(formData.get("description") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  if (!observed_at || !description) throw new Error("missing required fields");

  // Cifrar y guardar la imagen.
  const buffer = new Uint8Array(await file.arrayBuffer());
  const encrypted = await encryptForUser(userId, buffer);
  const id = crypto.randomUUID();
  const dstDir = path.join(getEnv().DATA_ROOT, "users", userId, "documents");
  await fs.mkdir(dstDir, { recursive: true });
  const dst = path.join(dstDir, `${id}${ext}.age`);
  await fs.writeFile(dst, encrypted);

  await writeImageObservation(
    userId,
    {
      observedAt: observed_at,
      category,
      description,
      encryptedPath: dst,
      tags,
    },
    locale,
  );

  await logAuditEventSafe({
    actor: userId,
    action: "memory.write",
    subjectId: userId,
    payloadSum: `type=image category=${category} size=${file.size}`,
  });

  revalidatePath("/memory");
  redirect("/memory");
}
