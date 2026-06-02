import Link from "next/link";
import { CONSENT_TEXT_ES, CONSENT_VERSION } from "@/lib/consent";
import { registerAction } from "./actions";

export const metadata = { title: "Solicitar acceso" };

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Solicitar acceso al piloto</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Lee atentamente el documento de consentimiento. Marca ambos
          reconocimientos para crear tu cuenta. ¿Ya tienes una?{" "}
          <Link href="/login" className="underline">
            Acceder
          </Link>
          .
        </p>
      </header>

      {sp.error && (
        <p className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {sp.error}
        </p>
      )}

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 max-h-72 overflow-auto text-sm whitespace-pre-wrap">
        {CONSENT_TEXT_ES}
        {"\n\nVersión: " + CONSENT_VERSION}
      </section>

      <form action={registerAction} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={inputCls}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Contraseña (mín. 10)">
            <input
              type="password"
              name="password"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
          <Field label="Repite la contraseña">
            <input
              type="password"
              name="password_repeat"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
        </div>

        <fieldset className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
          <legend className="px-1 text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Reconocimientos obligatorios
          </legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="ack_educational" className="mt-1" required />
            <span>
              Confirmo que VitaMap es una herramienta educativa, no un
              dispositivo médico, y que sus respuestas no constituyen
              consejo clínico.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="ack_consent" className="mt-1" required />
            <span>
              Doy mi consentimiento explícito al tratamiento de mis datos
              de salud conforme al Art. 9.2.a RGPD, en los términos
              descritos arriba (versión {CONSENT_VERSION}).
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Crear cuenta y entrar
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
