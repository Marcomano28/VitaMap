"use server";

import fs from "node:fs/promises";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  copyInboxOriginalToDocuments,
  deleteInboxItem,
  getInboxItem,
} from "@/lib/inbox";
import { enqueueInboxExtraction } from "@/lib/inbox-queue";
import { LabResultExtraction, type LabMarker } from "@/lib/extraction";
import { writeLabResult } from "@/lib/memory";
import { logAuditEventSafe } from "@/lib/audit";
import { requireDataSubject } from "@/lib/data-access-guards";
import { getLocale } from "@/lib/locale";
import { normalizeLabMarker } from "@/lib/lab-visualization";

/**
 * Lee de FormData los markers editados y construye el LabResultExtraction
 * que se promociona a markdown. Campos por marker indexados como
 *   marker_name_<i>, marker_value_<i>, marker_unit_<i>, marker_range_<i>,
 *   marker_flag_<i>.
 */
function parseMarkersFromForm(fd: FormData): LabMarker[] {
  const markers: LabMarker[] = [];
  for (const key of fd.keys()) {
    const m = key.match(/^marker_name_(\d+)$/);
    if (!m) continue;
    const i = m[1];
    const name = String(fd.get(`marker_name_${i}`) ?? "").trim();
    if (!name) continue; // permite borrar limpiando el nombre
    const rawValue = String(fd.get(`marker_value_${i}`) ?? "").trim();
    const value = rawValue ? Number(rawValue.replace(",", ".")) : null;
    const unit = (String(fd.get(`marker_unit_${i}`) ?? "").trim() || null);
    const reference_range = (String(fd.get(`marker_range_${i}`) ?? "").trim() || null);
    const flagRaw = String(fd.get(`marker_flag_${i}`) ?? "unknown");
    const flag = (["low", "normal", "high", "unknown"] as const).includes(
      flagRaw as never,
    )
      ? (flagRaw as LabMarker["flag"])
      : "unknown";
    markers.push(normalizeLabMarker({
      name,
      value: Number.isFinite(value as number) ? (value as number) : null,
      unit,
      reference_range,
      flag,
      marker_id: null,
      unit_ucum: null,
      reference_range_structured: null,
      normalization_status: "raw",
    }));
  }
  return markers;
}

export async function commitInboxItemAction(formData: FormData) {
  const { subject: userId } = await requireDataSubject("manage");
  const locale = await getLocale();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("missing id");
  const item = await getInboxItem(userId, id);
  if (!item) throw new Error("inbox item not found");

  const observed_at = String(formData.get("observed_at") ?? item.extracted?.observed_at ?? "");
  const lab_name = String(formData.get("lab_name") ?? item.extracted?.lab_name ?? "") || null;
  const notes = String(formData.get("notes") ?? item.extracted?.notes ?? "") || null;
  const markers = parseMarkersFromForm(formData);

  const data = LabResultExtraction.parse({
    lab_name,
    observed_at,
    markers,
    notes,
  });

  let finalPath: string | null = null;
  try {
    // El original permanece en el inbox hasta terminar todo el commit.
    finalPath = await copyInboxOriginalToDocuments(userId, id);
    await writeLabResult(userId, data, finalPath, locale);
  } catch (err) {
    if (finalPath) {
      await fs.rm(finalPath, { force: true }).catch(() => undefined);
    }
    console.error("[inbox] commit failed", { userId, id }, err);
    redirect(`/inbox/${id}?error=commit_failed`);
  }

  // La memoria ya está escrita e indexada; ahora sí se puede vaciar el inbox.
  await deleteInboxItem(userId, id).catch((err) => {
    console.error("[inbox] committed but inbox cleanup failed", { userId, id }, err);
  });

  await logAuditEventSafe({
    actor: userId,
    action: "document.commit",
    subjectId: userId,
    payloadSum: `id=${id} markers=${data.markers.length}`,
  });

  revalidatePath("/upload");
  revalidatePath("/memory");
  redirect("/memory");
}

export async function discardInboxItemAction(formData: FormData) {
  const { subject: userId } = await requireDataSubject("manage");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteInboxItem(userId, id);
  await logAuditEventSafe({
    actor: userId,
    action: "document.delete",
    subjectId: userId,
    payloadSum: `id=${id} stage=inbox`,
  });
  redirect("/upload");
}

export async function retryInboxExtractionAction(formData: FormData) {
  const { subject: userId } = await requireDataSubject("manage");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await enqueueInboxExtraction({ userId, id });
  revalidatePath("/upload");
  revalidatePath(`/inbox/${id}`);
}
