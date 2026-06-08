import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { changePasswordAction, deleteAccountAction } from "./actions";
import { signOutAction } from "@/app/(auth)/login/actions";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

const TEXT = {
  es: {
    title: "Ajustes",
    signedIn: "Sesión iniciada como",
    changePassword: "Cambiar contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña (mín. 10)",
    repeatPassword: "Repite la nueva",
    updatePassword: "Actualizar contraseña",
    subscription: "Suscripción",
    subscriptionBody: "Gestiona tu suscripción mensual y método de pago.",
    viewSubscription: "Ver suscripción →",
    exportTitle: "Exportar mi memoria (Art. 20 RGPD)",
    exportBody:
      "Descarga un ZIP con todos tus markdown y los originales cifrados. Tu memoria es portable: puedes inspeccionarla con cualquier editor de texto.",
    exportButton: "Descargar export ZIP",
    mfaTitle: "Doble factor (TOTP)",
    mfaBody:
      "Aún no disponible. Se activará mediante el plugin de BetterAuth antes de abrir el piloto real.",
    logoutTitle: "Cerrar sesión",
    logoutButton: "Cerrar esta sesión",
    deleteTitle: "Borrar mi cuenta y toda mi memoria",
    deleteBody:
      "Esto elimina de forma irreversible tu memoria, tus documentos cifrados y tu cuenta. Los eventos de auditoría asociados al borrado se conservan únicamente con tu identificador pseudonimizado para acreditar el cumplimiento del derecho al olvido.",
    irreversible: "No se puede deshacer.",
    yourPassword: "Tu contraseña",
    confirm: "Escribe BORRAR para confirmar",
    confirmationWord: "BORRAR",
    deleteButton: "Borrar mi cuenta y mi memoria",
  },
  de: {
    title: "Einstellungen",
    signedIn: "Angemeldet als",
    changePassword: "Passwort ändern",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort (mind. 10 Zeichen)",
    repeatPassword: "Neues Passwort wiederholen",
    updatePassword: "Passwort aktualisieren",
    subscription: "Abonnement",
    subscriptionBody: "Verwalte dein monatliches Abonnement und deine Zahlungsmethode.",
    viewSubscription: "Abonnement anzeigen →",
    exportTitle: "Meinen Speicher exportieren (Art. 20 DSGVO)",
    exportBody:
      "Lade eine ZIP-Datei mit allen Markdown-Dateien und den verschlüsselten Originalen herunter. Dein Speicher ist portabel und kann mit jedem Texteditor geprüft werden.",
    exportButton: "ZIP-Export herunterladen",
    mfaTitle: "Zwei-Faktor-Authentifizierung (TOTP)",
    mfaBody:
      "Noch nicht verfügbar. Sie wird vor dem Start des realen Piloten über das BetterAuth-Plugin aktiviert.",
    logoutTitle: "Abmelden",
    logoutButton: "Diese Sitzung beenden",
    deleteTitle: "Mein Konto und meinen gesamten Speicher löschen",
    deleteBody:
      "Dadurch werden dein Speicher, deine verschlüsselten Dokumente und dein Konto unwiderruflich gelöscht. Audit-Ereignisse zur Löschung bleiben ausschließlich mit einer pseudonymisierten Kennung erhalten, um die Erfüllung des Löschanspruchs nachzuweisen.",
    irreversible: "Dieser Vorgang kann nicht rückgängig gemacht werden.",
    yourPassword: "Dein Passwort",
    confirm: "Zum Bestätigen LÖSCHEN eingeben",
    confirmationWord: "LÖSCHEN",
    deleteButton: "Konto und Speicher löschen",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.signedIn}{" "}
          <code className="font-mono">{session.user.email}</code>.
        </p>
      </header>

      {sp.success && (
        <p className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          {sp.success}
        </p>
      )}
      {sp.error && (
        <p className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {sp.error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">{t.changePassword}</h2>
        <form action={changePasswordAction} className="space-y-3 max-w-md">
          <Field label={t.currentPassword}>
            <input
              type="password"
              name="current_password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </Field>
          <Field label={t.newPassword}>
            <input
              type="password"
              name="new_password"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
          <Field label={t.repeatPassword}>
            <input
              type="password"
              name="new_password_repeat"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            {t.updatePassword}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">{t.subscription}</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t.subscriptionBody}
        </p>
        <a
          href="/settings/billing"
          className="inline-block rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
        >
          {t.viewSubscription}
        </a>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">{t.exportTitle}</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t.exportBody}
        </p>
        <a
          href="/api/export"
          className="inline-block rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
        >
          {t.exportButton}
        </a>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">{t.mfaTitle}</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t.mfaBody}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">{t.logoutTitle}</h2>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
          >
            {t.logoutButton}
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-md border border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/40 p-4">
        <div className="space-y-1">
          <h2 className="font-medium text-red-800 dark:text-red-200">
            {t.deleteTitle}
          </h2>
          <p className="text-sm text-red-800/80 dark:text-red-200/80">
            {t.deleteBody} <strong>{t.irreversible}</strong>
          </p>
        </div>
        <form action={deleteAccountAction} className="space-y-3 max-w-md">
          <Field label={t.yourPassword}>
            <input
              type="password"
              name="password"
              required
              className={inputCls}
            />
          </Field>
          <Field label={t.confirm}>
            <input
              type="text"
              name="confirm"
              required
              pattern={t.confirmationWord}
              autoComplete="off"
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-red-700 text-white px-4 py-2 text-sm font-medium hover:bg-red-800"
          >
            {t.deleteButton}
          </button>
        </form>
      </section>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
