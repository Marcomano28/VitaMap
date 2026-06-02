"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { logAuditEventSafe } from "@/lib/audit";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/memory");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email y contraseña obligatorios")}`);
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
    const msg =
      err instanceof APIError ? "Credenciales incorrectas" : "Error al iniciar sesión";
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }

  redirect(next.startsWith("/") ? next : "/memory");
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
