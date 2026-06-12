"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { logAuditEventSafe } from "@/lib/audit";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const ERRORS = {
  es: {
    required: "Email y contraseña obligatorios",
    invalid: "Credenciales incorrectas",
    failed: "Error al iniciar sesión",
  },
  de: {
    required: "E-Mail-Adresse und Passwort sind erforderlich",
    invalid: "E-Mail-Adresse oder Passwort ist falsch",
    failed: "Anmeldung fehlgeschlagen",
  },
} as const;

export async function signInAction(formData: FormData) {
  const locale = await getLocale();
  const t = localize(locale, ERRORS);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/memory");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent(t.required)}`);
  }

  try {
    const result = await getAuth().api.signInEmail({
      body: { email, password },
      headers: await headers(),
      asResponse: false,
    });
    if (result?.user?.id) {
      await logAuditEventSafe({
        actor: result.user.id,
        action: "auth.login",
        subjectId: result.user.id,
        payloadSum: `email=${maskEmail(email)}`,
      });
    }
  } catch (err) {
    if (
      err instanceof APIError &&
      err.body?.code === "EMAIL_NOT_VERIFIED"
    ) {
      redirect("/verify-email-pending?resent=1");
    }
    const msg = err instanceof APIError ? t.invalid : t.failed;
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/memory";
  redirect(safeNext);
}

export async function signOutAction() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  await getAuth().api.signOut({ headers: await headers() });
  if (session?.user?.id) {
    await logAuditEventSafe({
      actor: session.user.id,
      action: "auth.logout",
      subjectId: session.user.id,
      payloadSum: "",
    });
  }
  redirect("/");
}

function maskEmail(e: string): string {
  const [user, domain] = e.split("@");
  if (!domain) return "***";
  const head = user.slice(0, 2);
  return `${head}***@${domain}`;
}
