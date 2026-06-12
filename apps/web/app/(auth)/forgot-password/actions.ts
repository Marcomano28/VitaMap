"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

/**
 * Solicita el email de recuperación. Respuesta SIEMPRE genérica
 * (anti-enumeración de cuentas): el mensaje de éxito se muestra exista o
 * no el email. Los errores reales quedan en el log del servidor.
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    try {
      await getAuth().api.requestPasswordReset({
        body: { email, redirectTo: "/reset-password" },
        headers: await headers(),
      });
    } catch (err) {
      console.error("[auth] request_password_reset_failed", err);
    }
  }
  redirect("/forgot-password?sent=1");
}
