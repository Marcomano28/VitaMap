"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { authorizeInternalSignup, getAuthReady } from "@/lib/auth";
import { logAuditEventSafe } from "@/lib/audit";
import { CONSENT_VERSION } from "@/lib/consent";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import {
  assignConsumedInvitationToUser,
  consumeInvitation,
  reopenConsumedInvitation,
  releaseInvitation,
  reserveInvitation,
} from "@/lib/invitations";

const ERRORS = {
  es: {
    required: "Invitación, email y contraseña obligatorios",
    shortPassword: "La contraseña debe tener al menos 10 caracteres",
    mismatch: "Las contraseñas no coinciden",
    acknowledgement: "Debes aceptar ambos reconocimientos para continuar",
    invalidInvitation:
      "La invitación no es válida para ese email, ha caducado o ya fue utilizada",
    unavailable: "La invitación dejó de estar disponible. Solicita una nueva",
    exists: "Ya existe una cuenta con ese email",
    createFailed: "No se pudo crear la cuenta",
    missingUser: "BetterAuth no devolvió el usuario creado",
  },
  de: {
    required: "Einladung, E-Mail-Adresse und Passwort sind erforderlich",
    shortPassword: "Das Passwort muss mindestens 10 Zeichen lang sein",
    mismatch: "Die Passwörter stimmen nicht überein",
    acknowledgement: "Du musst beide Bestätigungen akzeptieren",
    invalidInvitation:
      "Die Einladung ist für diese E-Mail-Adresse ungültig, abgelaufen oder bereits verwendet",
    unavailable: "Die Einladung ist nicht mehr verfügbar. Bitte fordere eine neue an",
    exists: "Für diese E-Mail-Adresse besteht bereits ein Konto",
    createFailed: "Das Konto konnte nicht angelegt werden",
    missingUser: "BetterAuth hat kein angelegtes Benutzerkonto zurückgegeben",
  },
} as const;

export async function registerAction(formData: FormData) {
  const locale = await getLocale();
  const t = localize(locale, ERRORS);
  const invitationCode = String(formData.get("invitation_code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordRepeat = String(formData.get("password_repeat") ?? "");
  const ackEducational = formData.get("ack_educational") === "on";
  const ackConsent = formData.get("ack_consent") === "on";

  // Validación básica.
  if (!invitationCode || !email || !password) {
    redirect(`/register?error=${encodeURIComponent(t.required)}`);
  }
  if (password.length < 10) {
    redirect(`/register?error=${encodeURIComponent(t.shortPassword)}`);
  }
  if (password !== passwordRepeat) {
    redirect(`/register?error=${encodeURIComponent(t.mismatch)}`);
  }
  if (!ackEducational || !ackConsent) {
    redirect(`/register?error=${encodeURIComponent(t.acknowledgement)}`);
  }

  const reservation = reserveInvitation(invitationCode, email);
  if (!reservation) {
    redirect(
      `/register?error=${encodeURIComponent(
        t.invalidInvitation,
      )}`,
    );
  }

  // Consumir antes de crear la cuenta cierra la carrera entre BetterAuth y
  // SQLite. Si el alta falla, solo este marcador puede reabrir la invitación.
  const pendingMarker = `pending:${reservation.reservationId}`;
  if (!consumeInvitation(reservation, pendingMarker)) {
    releaseInvitation(reservation);
    redirect(
      `/register?error=${encodeURIComponent(
        t.unavailable,
      )}`,
    );
  }

  // Alta + auto-signin.
  let userId: string | undefined;
  try {
    const auth = await getAuthReady();
    const signupHeaders = authorizeInternalSignup(await headers());
    const result = await auth.api.signUpEmail({
      body: { email, password, name: email.split("@")[0] },
      headers: signupHeaders,
      asResponse: false,
    });
    userId = result?.user?.id;
  } catch (err) {
    reopenConsumedInvitation(reservation, pendingMarker);
    const msg =
      err instanceof APIError && err.message.toLowerCase().includes("exist")
        ? t.exists
        : t.createFailed;
    redirect(`/register?error=${encodeURIComponent(msg)}`);
  }

  if (userId) {
    if (!assignConsumedInvitationToUser(reservation, pendingMarker, userId)) {
      await logAuditEventSafe({
        actor: userId,
        action: "auth.invitation.failed",
        subjectId: userId,
        payloadSum: `invitation_id=${reservation.invitationId};stage=assign_user`,
      });
    }
    await logAuditEventSafe({
      actor: userId,
      action: "auth.invitation.used",
      subjectId: userId,
      payloadSum: `invitation_id=${reservation.invitationId}`,
    });
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
  } else {
    reopenConsumedInvitation(reservation, pendingMarker);
    throw new Error(t.missingUser);
  }

  redirect("/memory");
}

function maskEmail(e: string): string {
  const [user, domain] = e.split("@");
  if (!domain) return "***";
  const head = user.slice(0, 2);
  return `${head}***@${domain}`;
}
