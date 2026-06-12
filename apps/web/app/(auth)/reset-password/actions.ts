"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const ERRORS = {
  es: {
    required: "Contraseña obligatoria (mínimo 10 caracteres)",
    mismatch: "Las contraseñas no coinciden",
    invalidToken:
      "El enlace no es válido o ha caducado. Solicita uno nuevo.",
    failed: "No se pudo restablecer la contraseña",
  },
  de: {
    required: "Passwort erforderlich (mindestens 10 Zeichen)",
    mismatch: "Die Passwörter stimmen nicht überein",
    invalidToken:
      "Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.",
    failed: "Das Passwort konnte nicht zurückgesetzt werden",
  },
} as const;

export async function resetPasswordAction(formData: FormData) {
  const locale = await getLocale();
  const t = localize(locale, ERRORS);
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const back = (error: string) =>
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(error)}`,
    );

  if (!token) redirect("/forgot-password");
  if (password.length < 10) back(t.required);
  if (password !== confirm) back(t.mismatch);

  try {
    await getAuth().api.resetPassword({
      body: { newPassword: password, token },
      headers: await headers(),
    });
  } catch (err) {
    console.error("[auth] reset_password_failed", err);
    back(err instanceof APIError ? t.invalidToken : t.failed);
  }

  redirect("/login?reset=1");
}
