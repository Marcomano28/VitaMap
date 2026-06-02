import Link from "next/link";
import { signInAction } from "./actions";

export const metadata = { title: "Acceder" };

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Acceder</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Introduce tu email y contraseña. ¿Sin cuenta?{" "}
          <Link href="/register" className="underline">
            Solicita acceso al piloto
          </Link>
          .
        </p>
      </header>

      {sp.error && (
        <p className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {sp.error}
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

        <Field label="Contraseña">
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
          Entrar
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
