import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { requestPasswordResetAction } from "./actions";

const TEXT = {
  es: {
    title: "Recuperar contraseña",
    intro:
      "Escribe el email de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.",
    sent: "Si existe una cuenta con ese email, recibirás un enlace de recuperación en unos minutos. Revisa también la carpeta de spam.",
    submit: "Enviar enlace",
    backToLogin: "Volver a acceder",
  },
  de: {
    title: "Passwort zurücksetzen",
    intro:
      "Gib die E-Mail-Adresse deines Kontos ein und wir senden dir einen Link, um ein neues Passwort zu erstellen.",
    sent: "Falls ein Konto mit dieser E-Mail-Adresse existiert, erhältst du in wenigen Minuten einen Link. Prüfe auch deinen Spam-Ordner.",
    submit: "Link senden",
    backToLogin: "Zurück zur Anmeldung",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

interface PageProps {
  searchParams: Promise<{ sent?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t.intro}</p>
      </header>

      {sp.sent ? (
        <p className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          {t.sent}
        </p>
      ) : (
        <form action={requestPasswordResetAction} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            {t.submit}
          </button>
        </form>
      )}

      <p className="text-sm">
        <Link href="/login" className="underline">
          {t.backToLogin}
        </Link>
      </p>
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
