import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { signInAction } from "./actions";

const TEXT = {
  es: {
    title: "Acceder",
    intro: "Introduce tu email y contraseña.",
    noAccount: "¿Sin cuenta?",
    requestAccess: "Solicita acceso al piloto",
    password: "Contraseña",
    submit: "Entrar",
    forgot: "¿Olvidaste tu contraseña?",
    resetDone: "Contraseña actualizada. Ya puedes acceder con la nueva.",
  },
  de: {
    title: "Anmelden",
    intro: "Gib deine E-Mail-Adresse und dein Passwort ein.",
    noAccount: "Noch kein Konto?",
    requestAccess: "Zugang zum Piloten anfragen",
    password: "Passwort",
    submit: "Anmelden",
    forgot: "Passwort vergessen?",
    resetDone: "Passwort aktualisiert. Du kannst dich jetzt damit anmelden.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.intro} {t.noAccount}{" "}
          <Link href="/register" className="underline">
            {t.requestAccess}
          </Link>
          .
        </p>
      </header>

      {sp.error && (
        <p className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {sp.error}
        </p>
      )}

      {sp.reset && (
        <p className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-800 dark:text-green-200">
          {t.resetDone}
        </p>
      )}

      <form action={signInAction} className="space-y-4">
        <input type="hidden" name="next" value={sp.next ?? "/memory"} />

        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={inputCls}
          />
        </Field>

        <Field label={t.password}>
          <input
            type="password"
            name="password"
            required
            minLength={10}
            autoComplete="current-password"
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {t.submit}
        </button>

        <p className="text-sm text-center">
          <Link href="/forgot-password" className="underline text-[var(--color-muted)]">
            {t.forgot}
          </Link>
        </p>
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
