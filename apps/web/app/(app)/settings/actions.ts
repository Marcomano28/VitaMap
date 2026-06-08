"use server";

import path from "node:path";
import fs from "node:fs/promises";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { getAuth } from "@/lib/auth";
import { getSession, requireUserId } from "@/lib/session";
import { logAuditEvent, logAuditEventSafe } from "@/lib/audit";
import { getEnv } from "@/lib/env";
import { CONSENT_VERSION } from "@/lib/consent";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const MESSAGES = {
  es: {
    confirmationWord: "BORRAR",
    shortPassword: "La contraseña nueva debe tener al menos 10 caracteres",
    mismatch: "Las contraseñas nuevas no coinciden",
    wrongCurrent: "Contraseña actual incorrecta",
    changeFailed: "Error al cambiar contraseña",
    changed: "Contraseña actualizada",
    confirmDelete: "Debes escribir BORRAR para confirmar",
    passwordRequired: "Debes introducir tu contraseña",
    invalidSession: "Sesión inválida. Vuelve a iniciar sesión",
    wrongPassword: "Contraseña incorrecta",
    validationFailed: "No se pudo validar la contraseña",
    prepareDeleteFailed: "No se pudo preparar el borrado de datos",
    deleteFailed: "No se pudo eliminar la cuenta",
    deleteError: "Error al eliminar la cuenta",
  },
  de: {
    confirmationWord: "LÖSCHEN",
    shortPassword: "Das neue Passwort muss mindestens 10 Zeichen lang sein",
    mismatch: "Die neuen Passwörter stimmen nicht überein",
    wrongCurrent: "Das aktuelle Passwort ist falsch",
    changeFailed: "Das Passwort konnte nicht geändert werden",
    changed: "Passwort aktualisiert",
    confirmDelete: "Gib zum Bestätigen LÖSCHEN ein",
    passwordRequired: "Du musst dein Passwort eingeben",
    invalidSession: "Ungültige Sitzung. Bitte melde dich erneut an",
    wrongPassword: "Das Passwort ist falsch",
    validationFailed: "Das Passwort konnte nicht geprüft werden",
    prepareDeleteFailed: "Die Datenlöschung konnte nicht vorbereitet werden",
    deleteFailed: "Das Konto konnte nicht gelöscht werden",
    deleteError: "Fehler beim Löschen des Kontos",
  },
} as const;

export async function changePasswordAction(formData: FormData) {
  const locale = await getLocale();
  const t = localize(locale, MESSAGES);
  const userId = await requireUserId();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const newPasswordRepeat = String(formData.get("new_password_repeat") ?? "");

  if (newPassword.length < 10) {
    redirect(`/settings?error=${encodeURIComponent(t.shortPassword)}`);
  }
  if (newPassword !== newPasswordRepeat) {
    redirect(`/settings?error=${encodeURIComponent(t.mismatch)}`);
  }

  try {
    await getAuth().api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (err) {
    const msg = err instanceof APIError ? t.wrongCurrent : t.changeFailed;
    redirect(`/settings?error=${encodeURIComponent(msg)}`);
  }

  await logAuditEventSafe({
    actor: userId,
    action: "auth.login", // reusing as 'password.changed' sería más limpio (futuro enum)
    subjectId: userId,
    payloadSum: "password_changed",
  });

  redirect(`/settings?success=${encodeURIComponent(t.changed)}`);
}

/**
 * Borrado total de la cuenta y su memoria.
 *
 * Orden importante:
 *   1. Verificar BORRAR + contraseña antes de tocar el filesystem.
 *   2. Registrar consentimiento revocado y purga en audit_event (append-only,
 *      sobrevive al borrado).
 *   3. Mover data/users/<id>/ a cuarentena recuperable.
 *   4. Eliminar al usuario en BetterAuth.
 *   5. Borrar la cuarentena y redirigir a /.
 */
export async function deleteAccountAction(formData: FormData) {
  const locale = await getLocale();
  const t = localize(locale, MESSAGES);
  const userId = await requireUserId();
  const session = await getSession();
  const confirm = String(formData.get("confirm") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (confirm !== t.confirmationWord) {
    redirect(`/settings?error=${encodeURIComponent(t.confirmDelete)}`);
  }
  if (!password) {
    redirect(`/settings?error=${encodeURIComponent(t.passwordRequired)}`);
  }
  if (!session?.user?.email) {
    redirect(`/settings?error=${encodeURIComponent(t.invalidSession)}`);
  }

  // Validar contraseña antes de cualquier operación destructiva.
  try {
    await getAuth().api.signInEmail({
      body: { email: session.user.email, password },
      headers: await headers(),
      asResponse: false,
    });
  } catch (err) {
    const msg =
      err instanceof APIError ? t.wrongPassword : t.validationFailed;
    redirect(`/settings?error=${encodeURIComponent(msg)}`);
  }

  // Auditoría crítica: si falla, no se ejecuta la purga.
  await logAuditEvent({
    actor: userId,
    action: "auth.consent.revoked",
    subjectId: userId,
    payloadSum: `version=${CONSENT_VERSION}`,
  });
  await logAuditEvent({
    actor: userId,
    action: "user.purge",
    subjectId: userId,
    payloadSum: "start",
  });

  // Mover a cuarentena antes de borrar la cuenta permite restaurar si
  // BetterAuth falla tras haber autorizado la operación.
  const userRoot = path.join(getEnv().DATA_ROOT, "users", userId);
  const quarantineRoot = path.join(getEnv().DATA_ROOT, "users", ".purged");
  const quarantinedUserRoot = path.join(
    quarantineRoot,
    `${userId}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  let quarantined = false;

  try {
    await fs.mkdir(quarantineRoot, { recursive: true });
    await fs.rename(userRoot, quarantinedUserRoot);
    quarantined = true;
  } catch (err) {
    if (!isNotFoundError(err)) {
      await logAuditEvent({
        actor: userId,
        action: "user.purge",
        subjectId: userId,
        payloadSum: "filesystem_quarantine_failed",
      });
      redirect(`/settings?error=${encodeURIComponent(t.prepareDeleteFailed)}`);
    }
  }

  try {
    await getAuth().api.deleteUser({
      body: { password },
      headers: await headers(),
    });
  } catch (err) {
    if (quarantined) {
      await fs.rename(quarantinedUserRoot, userRoot).catch(async () => {
        await logAuditEvent({
          actor: userId,
          action: "user.purge",
          subjectId: userId,
          payloadSum: "restore_from_quarantine_failed",
        });
      });
    }
    await logAuditEvent({
      actor: userId,
      action: "user.purge",
      subjectId: userId,
      payloadSum: "auth_delete_failed",
    });
    const msg =
      err instanceof APIError ? t.deleteFailed : t.deleteError;
    redirect(`/settings?error=${encodeURIComponent(msg)}`);
  }

  if (quarantined) {
    try {
      await fs.rm(quarantinedUserRoot, { recursive: true, force: true });
    } catch (err) {
      await logAuditEvent({
        actor: userId,
        action: "user.purge",
        subjectId: userId,
        payloadSum: "filesystem_delete_failed",
      });
      throw err;
    }
  }

  await logAuditEvent({
    actor: userId,
    action: "user.purge",
    subjectId: userId,
    payloadSum: "complete",
  });

  redirect("/");
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "ENOENT"
  );
}
