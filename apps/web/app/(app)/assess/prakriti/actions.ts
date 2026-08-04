"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assessmentsEnabled } from "@/lib/flags";
import { writeConstitutionProfile } from "@/lib/memory";
import { logAuditEventSafe } from "@/lib/audit";
import { requireDataSubject } from "@/lib/data-access-guards";
import { getLocale } from "@/lib/locale";
import { getPrakritiItems, scorePrakriti, isDosha, type ItemAnswer } from "@/lib/prakriti";

export async function savePrakritiAction(formData: FormData) {
  if (!assessmentsEnabled()) notFound();
  const { subject: userId } = await requireDataSubject("manage");
  const locale = await getLocale();
  const items = getPrakritiItems(locale);

  const answers: ItemAnswer[] = [];
  for (const item of items) {
    const raw = formData.get(`q_${item.id}`);
    if (!isDosha(raw)) throw new Error(`respuesta inválida en ${item.id}`);
    const secRaw = formData.get(`q_${item.id}_sec`);
    const secondary = isDosha(secRaw) && secRaw !== raw ? secRaw : null;
    answers.push({ primary: raw, secondary });
  }

  const observed_at =
    String(formData.get("observed_at") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim();

  const profile = scorePrakriti(answers, locale);

  await writeConstitutionProfile(
    userId,
    {
      instrument: "Prakriti",
      observedAt: observed_at,
      counts: profile.counts,
      percentages: profile.percentages,
      dominant: profile.dominant,
      type: profile.type,
      notes,
    },
    locale,
  );

  await logAuditEventSafe({
    actor: userId,
    action: "memory.write",
    subjectId: userId,
    payloadSum: `type=constitution instrument=Prakriti dominant=${profile.dominant}`,
  });

  revalidatePath("/memory");
  const { vata, pitta, kapha } = profile.percentages;
  redirect(`/assess/prakriti/result?v=${vata}&p=${pitta}&k=${kapha}&t=${encodeURIComponent(profile.type)}`);
}
