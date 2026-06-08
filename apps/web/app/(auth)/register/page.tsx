import Link from "next/link";
import type { Metadata } from "next";
import { CONSENT_VERSION, getConsentText } from "@/lib/consent";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";
import { registerAction } from "./actions";

const TEXT = {
  es: {
    title: "Solicitar acceso al piloto",
    intro:
      "El piloto es cerrado. Necesitas una invitación personal y vigente. Lee el consentimiento y marca ambos reconocimientos para crear tu cuenta.",
    existing: "¿Ya tienes una?",
    login: "Acceder",
    version: "Versión",
    invitation: "Código de invitación",
    password: "Contraseña (mín. 10)",
    repeatPassword: "Repite la contraseña",
    acknowledgements: "Reconocimientos obligatorios",
    educational:
      "Confirmo que VitaMap es una herramienta educativa, no un dispositivo médico, y que sus respuestas no constituyen consejo clínico.",
    consent:
      "Doy mi consentimiento explícito al tratamiento de mis datos de salud conforme al Art. 9.2.a RGPD, en los términos descritos arriba",
    submit: "Validar invitación y crear cuenta",
  },
  de: {
    title: "Zugang zum Piloten anfragen",
    intro:
      "Der Pilot ist geschlossen. Du benötigst eine persönliche, noch gültige Einladung. Lies die Einwilligung und bestätige beide Punkte, um dein Konto anzulegen.",
    existing: "Du hast bereits ein Konto?",
    login: "Anmelden",
    version: "Version",
    invitation: "Einladungscode",
    password: "Passwort (mind. 10 Zeichen)",
    repeatPassword: "Passwort wiederholen",
    acknowledgements: "Erforderliche Bestätigungen",
    educational:
      "Ich bestätige, dass VitaMap ein pädagogisches Werkzeug und kein Medizinprodukt ist und dass seine Antworten keine medizinische Beratung darstellen.",
    consent:
      "Ich willige gemäß Art. 9 Abs. 2 lit. a DSGVO ausdrücklich in die Verarbeitung meiner Gesundheitsdaten zu den oben beschriebenen Bedingungen ein",
    submit: "Einladung prüfen und Konto anlegen",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.intro} {t.existing}{" "}
          <Link href="/login" className="underline">
            {t.login}
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
        {getConsentText(locale)}
        {"\n\n" + t.version + ": " + CONSENT_VERSION}
      </section>

      <form action={registerAction} className="space-y-4">
        <Field label={t.invitation}>
          <input
            type="text"
            name="invitation_code"
            required
            autoComplete="off"
            spellCheck={false}
            className={inputCls}
          />
        </Field>

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
          <Field label={t.repeatPassword}>
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
            {t.acknowledgements}
          </legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="ack_educational" className="mt-1" required />
            <span>
              {t.educational}
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="ack_consent" className="mt-1" required />
            <span>
              {t.consent} ({t.version.toLowerCase()} {CONSENT_VERSION}).
            </span>
          </label>
        </fieldset>

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
