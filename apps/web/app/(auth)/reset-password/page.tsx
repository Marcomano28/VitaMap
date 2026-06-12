import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { resetPasswordAction } from "./actions";

const TEXT = {
  es: {
    title: "Nueva contraseña",
    intro: "Elige una contraseña nueva para tu cuenta (mínimo 10 caracteres).",
    password: "Nueva contraseña",
    confirm: "Repite la contraseña",
    submit: "Guardar contraseña",
    missingToken:
      "Falta el código del enlace. Abre el enlace completo del email o solicita uno nuevo.",
    requestNew: "Solicitar un enlace nuevo",
  },
  de: {
    title: "Neues Passwort",
    intro: "Wähle ein neues Passwort für dein Konto (mindestens 10 Zeichen).",
    password: "Neues Passwort",
    confirm: "Passwort wiederholen",
    submit: "Passwort speichern",
    missingToken:
      "Der Code aus dem Link fehlt. Öffne den vollständigen Link aus der E-Mail oder fordere einen neuen an.",
    requestNew: "Neuen Link anfordern",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  if (!sp.token) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {t.missingToken}
        </p>
        <p className="text-sm">
          <Link href="/forgot-password" className="underline">
            {t.requestNew}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t.intro}</p>
      </header>

      {sp.error && (
        <p className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {sp.error}
        </p>
      )}

      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="token" value={sp.token} />

        <Field label={t.password}>
          <input
            type="password"
            name="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>

        <Field label={t.confirm}>
          <input
            type="password"
            name="confirm"
            required
            minLength={10}
            autoComplete="new-password"
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
