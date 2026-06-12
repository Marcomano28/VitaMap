import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { resendVerificationAction } from "./actions";

const TEXT = {
  es: {
    title: "Verifica tu email",
    sent:
      "Te hemos enviado un enlace de verificación. Caduca en una hora. Revisa también la carpeta de spam.",
    intro:
      "Debes confirmar tu dirección antes de acceder. Si necesitas otro enlace, introduce el mismo email de tu cuenta.",
    resend: "Reenviar enlace",
    login: "Volver al acceso",
  },
  de: {
    title: "E-Mail-Adresse bestätigen",
    sent:
      "Wir haben dir einen Bestätigungslink gesendet. Er ist eine Stunde gültig. Prüfe auch deinen Spam-Ordner.",
    intro:
      "Bestätige deine Adresse, bevor du dich anmeldest. Für einen neuen Link gib dieselbe E-Mail-Adresse erneut ein.",
    resend: "Link erneut senden",
    login: "Zurück zur Anmeldung",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

interface PageProps {
  searchParams: Promise<{ sent?: string; resent?: string; error?: string }>;
}

export default async function VerifyEmailPendingPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t.intro}</p>
      </header>

      {(sp.sent || sp.resent) && (
        <p className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          {t.sent}
        </p>
      )}

      <form action={resendVerificationAction} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {t.resend}
        </button>
      </form>

      <p className="text-sm">
        <Link href="/login" className="underline">
          {t.login}
        </Link>
      </p>
    </div>
  );
}
