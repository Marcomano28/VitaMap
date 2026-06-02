"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { logAuditEventSafe } from "@/lib/audit";
import { CONSENT_VERSION } from "@/lib/consent";

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordRepeat = String(formData.get("password_repeat") ?? "");
  const ackEducational = formData.get("ack_educational") === "on";
  const ackConsent = formData.get("ack_consent") === "on";

  // Validación básica.
  if (!email || !password) {
    redirect(`/register?error=${encodeURIComponent("Email y contraseña obligatorios")}`);
  }
  if (password.length < 10) {
    redirect(`/register?error=${encodeURIComponent("La contraseña debe tener al menos 10 caracteres")}`);
  }
  if (password !== passwordRepeat) {
    redirect(`/register?error=${encodeURIComponent("Las contraseñas no coinciden")}`);
  }
  if (!ackEducational || !ackConsent) {
    redirect(`/register?error=${encodeURIComponent("Debes aceptar ambos reconocimientos para continuar")}`);
  }

  // Alta + auto-signin.
  let userId: string | undefined;
  try {
    const result = await getAuth().api.signUpEmail({
      body: { email, password, name: email.split("@")[0] },
      headers: await headers(),
      asResponse: false,
    });
    userId = result?.user?.id;
  } catch (err) {
    const msg =
      err instanceof APIError && err.message.toLowerCase().includes("exist")
        ? "Ya existe una cuenta con ese email"
        : "No se pudo crear la cuenta";
    redirect(`/register?error=${encodeURIComponent(msg)}`);
  }

  if (userId) {
    await logAuditEventSafe({
      actor: userId,
      action: "auth.register",
      subjectId: userId,
      payloadSum: `email=${maskEmail(email)}`,
    });
    await logAuditEventSafe({
      actor: userId,
      action: "auth.consent.granted",
      subjectId: userId,
      payloadSum: `version=${CONSENT_VERSION}`,
    });
  }

  redirect("/memory");
}

function maskEmail(e: string): string {
  const [user, domain] = e.split("@");
  if (!domain) return "***";
  const head = user.slice(0, 2);
  return `${head}***@${domain}`;
}
