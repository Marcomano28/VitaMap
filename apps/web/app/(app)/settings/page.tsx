import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { changePasswordAction, deleteAccountAction } from "./actions";
import { signOutAction } from "@/app/(auth)/login/actions";

export const metadata = { title: "Ajustes" };

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Sesión iniciada como{" "}
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
        <h2 className="font-medium">Cambiar contraseña</h2>
        <form action={changePasswordAction} className="space-y-3 max-w-md">
          <Field label="Contraseña actual">
            <input
              type="password"
              name="current_password"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </Field>
          <Field label="Nueva contraseña (mín. 10)">
            <input
              type="password"
              name="new_password"
              required
              minLength={10}
              autoComplete="new-password"
              className={inputCls}
            />
          </Field>
          <Field label="Repite la nueva">
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
            Actualizar contraseña
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Exportar mi memoria (Art. 20 RGPD)</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Descarga un ZIP con todos tus markdown y los originales cifrados.
          Tu memoria es portable: puedes inspeccionarla con cualquier
          editor de texto.
        </p>
        <a
          href="/api/export"
          className="inline-block rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
        >
          Descargar export ZIP
        </a>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Doble factor (TOTP)</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Aún no disponible. Se activará en Fase 2 mediante plugin de
          BetterAuth. Para el piloto cerrado, contraseña + sesión por
          cookie httpOnly es suficiente según el análisis de riesgos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Cerrar sesión</h2>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-card)]"
          >
            Cerrar esta sesión
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-md border border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/40 p-4">
        <div className="space-y-1">
          <h2 className="font-medium text-red-800 dark:text-red-200">
            Borrar mi cuenta y toda mi memoria
          </h2>
          <p className="text-sm text-red-800/80 dark:text-red-200/80">
            Esto elimina de forma irreversible tu memoria, tus documentos
            cifrados y tu cuenta. Los eventos de auditoría asociados al
            borrado se conservan únicamente con tu identificador
            pseudonimizado para acreditar el cumplimiento del derecho al
            olvido. <strong>No se puede deshacer.</strong>
          </p>
        </div>
        <form action={deleteAccountAction} className="space-y-3 max-w-md">
          <Field label="Tu contraseña">
            <input
              type="password"
              name="password"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Escribe BORRAR para confirmar">
            <input
              type="text"
              name="confirm"
              required
              pattern="BORRAR"
              autoComplete="off"
              className={inputCls}
            />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-red-700 text-white px-4 py-2 text-sm font-medium hover:bg-red-800"
          >
            Borrar mi cuenta y mi memoria
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
