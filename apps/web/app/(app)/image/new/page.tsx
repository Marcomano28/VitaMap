import { createImageObservationAction } from "./actions";

export const metadata = { title: "Nueva imagen" };

const CATEGORIES = [
  { value: "iridology", label: "Iridología" },
  { value: "tongue-tcm", label: "Lengua (MTC)" },
  { value: "skin", label: "Piel" },
  { value: "wound", label: "Herida / lesión" },
  { value: "other", label: "Otro" },
];

export default function NewImagePage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Nueva imagen</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Cifrada al subirse. No se aplica análisis automático — solo se
          almacena y queda asociada a tu descripción.
        </p>
      </header>

      <form
        action={createImageObservationAction}
        encType="multipart/form-data"
        className="space-y-4"
      >
        <Field label="Archivo (PNG / JPG / WEBP, máx. 10 MB)">
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="text-sm"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Fecha">
            <input
              type="date"
              name="observed_at"
              defaultValue={today}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Categoría">
            <select name="category" defaultValue="iridology" className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Descripción">
          <textarea
            name="description"
            rows={6}
            required
            placeholder="Lo que ves o lo que motivó la foto. Sé concreto."
            className={inputCls}
          />
        </Field>

        <Field label="Etiquetas (separadas por comas)">
          <input type="text" name="tags" className={inputCls} />
        </Field>

        <button
          type="submit"
          className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Guardar imagen
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
