import { createObservationAction } from "./actions";

export const metadata = { title: "Nueva observación" };

export default function NewObservationPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Nueva observación</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Síntomas, sueño, energía, una sesión de acupuntura, notas
          libres. Se guarda como markdown en tu memoria.
        </p>
      </header>

      <form action={createObservationAction} className="space-y-4">
        <Field label="Fecha">
          <input
            type="date"
            name="observed_at"
            defaultValue={today}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Título">
          <input
            type="text"
            name="title"
            required
            maxLength={200}
            placeholder="Ej. Dolor de cabeza al despertar"
            className={inputCls}
          />
        </Field>

        <Field label="Contenido">
          <textarea
            name="body"
            rows={8}
            required
            placeholder="Describe lo que has observado: intensidad, duración, contexto, lo que estabas haciendo..."
            className={inputCls}
          />
        </Field>

        <Field label="Etiquetas (separadas por comas)">
          <input
            type="text"
            name="tags"
            placeholder="dolor, sueño, mañana"
            className={inputCls}
          />
        </Field>

        <button
          type="submit"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Guardar
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
