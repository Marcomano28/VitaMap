"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

export async function resendVerificationAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    try {
      await getAuth().api.sendVerificationEmail({
        body: { email, callbackURL: "/settings/billing" },
        headers: await headers(),
      });
    } catch (err) {
      console.error("[auth] resend_verification_failed", err);
    }
  }
  redirect("/verify-email-pending?resent=1");
}
