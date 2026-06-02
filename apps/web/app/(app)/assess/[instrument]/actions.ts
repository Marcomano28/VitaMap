"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeAssessment } from "@/lib/memory";
import { logAuditEventSafe } from "@/lib/audit";
import { requireUserId } from "@/lib/session";

const INSTRUMENT_LEN: Record<string, number> = {
  "PHQ-9": 9,
  "GAD-7": 7,
};

export async function saveAssessmentAction(formData: FormData) {
  const userId = await requireUserId();
  const instrumentRaw = String(formData.get("instrument") ?? "");
  if (!(instrumentRaw in INSTRUMENT_LEN)) {
    throw new Error("instrumento desconocido");
  }
  const instrument = instrumentRaw as "PHQ-9" | "GAD-7";
  const len = INSTRUMENT_LEN[instrument];

  const observed_at =
    String(formData.get("observed_at") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim();

  const subscores: Record<string, number> = {};
  let total = 0;
  for (let i = 1; i <= len; i++) {
    const raw = String(formData.get(`q${i}`) ?? "");
    const v = Number(raw);
    if (!Number.isInteger(v) || v < 0 || v > 3) {
      throw new Error(`respuesta inválida en pregunta ${i}`);
    }
    subscores[`q${i}`] = v;
    total += v;
  }

  await writeAssessment(userId, {
    instrument,
    observedAt: observed_at,
    score: total,
    subscores,
    notes,
  });

  await logAuditEventSafe({
    actor: userId,
    action: "memory.write",
    subjectId: userId,
    payloadSum: `type=assessment instrument=${instrument} score=${total}`,
  });

  revalidatePath("/memory");
  redirect(`/assess/${instrument.toLowerCase()}/result?score=${total}&q9=${subscores.q9 ?? 0}`);
}
