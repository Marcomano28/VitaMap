import { notFound } from "next/navigation";
import { getInboxItem } from "@/lib/inbox";
import { commitInboxItemAction, discardInboxItemAction } from "./actions";
import { requireUserId } from "@/lib/session";

export const metadata = { title: "Revisar documento" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InboxItemPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { id } = await params;
  const item = await getInboxItem(userId, id);
  if (!item) notFound();

  const ex = item.extracted;
  const isLab = item.meta.category === "lab";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Revisar: {item.meta.originalName}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Subido {new Date(item.meta.uploadedAt).toLocaleString()} ·{" "}
          {(item.meta.size / 1024).toFixed(0)} KB · estado {item.meta.status}
        </p>
        {item.meta.error && (
          <p className="text-sm text-red-700 dark:text-red-400">
            Error: {item.meta.error}
          </p>
        )}
      </header>

      {!isLab ? (
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)]">
          La revisión estructurada solo se aplica a analíticas (categoría
          &quot;lab&quot;). Para otros documentos, descarta y vuelve a subir
          eligiendo la categoría correcta.
        </section>
      ) : ex ? (
        <form action={commitInboxItemAction} className="space-y-6">
          <input type="hidden" name="id" value={item.meta.id} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Fecha (YYYY-MM-DD)">
              <input
                type="date"
                name="observed_at"
                defaultValue={ex.observed_at.slice(0, 10)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Laboratorio">
              <input
                type="text"
                name="lab_name"
                defaultValue={ex.lab_name ?? ""}
                className={inputCls}
              />
            </Field>
          </div>

          <section className="space-y-2">
            <h2 className="font-medium">Marcadores ({ex.markers.length})</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Edita cualquier valor. Vacía el nombre de una fila para
              descartarla.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase text-[var(--color-muted)]">
                    <th className="p-2">Marcador</th>
                    <th className="p-2">Valor</th>
                    <th className="p-2">Unidad</th>
                    <th className="p-2">Rango ref.</th>
                    <th className="p-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {ex.markers.map((m, i) => (
                    <tr key={i} className="border-t border-[var(--color-border)]">
                      <td className="p-1">
                        <input
                          type="text"
                          name={`marker_name_${i}`}
                          defaultValue={m.name}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          name={`marker_value_${i}`}
                          defaultValue={m.value ?? ""}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          name={`marker_unit_${i}`}
                          defaultValue={m.unit ?? ""}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          name={`marker_range_${i}`}
                          defaultValue={m.reference_range ?? ""}
                          className={inputCls}
                        />
                      </td>
                      <td className="p-1">
                        <select
                          name={`marker_flag_${i}`}
                          defaultValue={m.flag}
                          className={inputCls}
                        >
                          <option value="unknown">desconocido</option>
                          <option value="low">bajo</option>
                          <option value="normal">normal</option>
                          <option value="high">alto</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Field label="Notas (opcional)">
            <textarea
              name="notes"
              defaultValue={ex.notes ?? ""}
              rows={3}
              className={inputCls}
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Confirmar y añadir a la memoria
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          Aún no hay datos extraídos.
        </p>
      )}

      <section className="space-y-2 border-t border-[var(--color-border)] pt-6">
        <h2 className="font-medium text-sm">Texto OCR (referencia)</h2>
        <pre className="text-xs whitespace-pre-wrap rounded bg-[var(--color-card)] p-3 max-h-64 overflow-auto">
          {item.rawText?.slice(0, 4000) ?? "(no disponible)"}
        </pre>
      </section>

      <form action={discardInboxItemAction}>
        <input type="hidden" name="id" value={item.meta.id} />
        <button
          type="submit"
          className="text-sm text-red-700 dark:text-red-400 hover:underline"
        >
          Descartar este documento (borra cifrado + extracción)
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm focus:outline-none focus:border-[var(--color-accent)]";

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
