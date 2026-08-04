import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInboxItem } from "@/lib/inbox";
import { InboxAutoRefresh } from "@/components/inbox-auto-refresh";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  commitInboxItemAction,
  discardInboxItemAction,
  retryInboxExtractionAction,
} from "./actions";
import { requireDataSubject } from "@/lib/data-access-guards";
import { getLocale } from "@/lib/locale";
import { localeTag, localize } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TEXT = {
  es: {
    metadata: "Revisar documento",
    review: "Revisar",
    uploaded: "Subido",
    status: "estado",
    error: "Error",
    pending: "El documento está en cola para OCR y extracción.",
    extracting:
      "El documento se está procesando. Puede tardar varios minutos y esta página se actualizará automáticamente.",
    extractionFailed: "No se pudo completar el OCR o la extracción.",
    commitFailed:
      "No se pudo añadir el documento a la memoria. El original sigue protegido en el buzón y puedes volver a intentarlo.",
    retry: "Reintentar extracción",
    wrongCategory:
      'La revisión estructurada solo se aplica a analíticas (categoría "lab"). Para otros documentos, descarta y vuelve a subir eligiendo la categoría correcta.',
    date: "Fecha (YYYY-MM-DD)",
    laboratory: "Laboratorio",
    markers: "Marcadores",
    editHint: "Edita cualquier valor. Vacía el nombre de una fila para descartarla.",
    marker: "Marcador",
    value: "Valor",
    unit: "Unidad",
    range: "Rango ref.",
    flag: "Indicador",
    unknown: "desconocido",
    low: "bajo",
    normal: "normal",
    high: "alto",
    notes: "Notas (opcional)",
    confirm: "Confirmar y añadir a la memoria",
    noData: "Aún no hay datos extraídos.",
    ocr: "Texto OCR (referencia)",
    unavailable: "(no disponible)",
    discard: "Descartar este documento (borra cifrado y extracción)",
  },
  de: {
    metadata: "Dokument prüfen",
    review: "Prüfen",
    uploaded: "Hochgeladen",
    status: "Status",
    error: "Fehler",
    pending: "Das Dokument wartet auf OCR und Extraktion.",
    extracting:
      "Das Dokument wird verarbeitet. Dies kann mehrere Minuten dauern; die Seite wird automatisch aktualisiert.",
    extractionFailed: "OCR oder Extraktion konnten nicht abgeschlossen werden.",
    commitFailed:
      "Das Dokument konnte nicht zum Speicher hinzugefügt werden. Das Original bleibt geschützt im Eingang und du kannst es erneut versuchen.",
    retry: "Extraktion erneut versuchen",
    wrongCategory:
      'Die strukturierte Prüfung ist nur für Laborbefunde der Kategorie "lab" verfügbar. Verwirf andere Dokumente und lade sie mit der richtigen Kategorie erneut hoch.',
    date: "Datum (JJJJ-MM-TT)",
    laboratory: "Labor",
    markers: "Messwerte",
    editHint: "Bearbeite die Werte. Leere den Namen einer Zeile, um sie zu verwerfen.",
    marker: "Messwert",
    value: "Wert",
    unit: "Einheit",
    range: "Referenzbereich",
    flag: "Bewertung",
    unknown: "unbekannt",
    low: "niedrig",
    normal: "normal",
    high: "hoch",
    notes: "Notizen (optional)",
    confirm: "Bestätigen und zum Speicher hinzufügen",
    noData: "Es wurden noch keine Daten extrahiert.",
    ocr: "OCR-Text (Referenz)",
    unavailable: "(nicht verfügbar)",
    discard: "Dokument verwerfen (verschlüsselte Datei und Extraktion löschen)",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function InboxItemPage({ params, searchParams }: PageProps) {
  const { subject: userId } = await requireDataSubject("read");
  const { id } = await params;
  const { error } = await searchParams;
  const item = await getInboxItem(userId, id);
  if (!item) notFound();
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  const ex = item.extracted;
  const isLab = item.meta.category === "lab";
  const isActive = item.meta.status === "pending" || item.meta.status === "extracting";

  return (
    <div className="space-y-8">
      <InboxAutoRefresh
        enabled={isActive}
        locale={locale}
        startedAt={item.meta.processingStartedAt ?? item.meta.uploadedAt}
      />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.review}: {item.meta.originalName}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.uploaded} {new Date(item.meta.uploadedAt).toLocaleString(localeTag(locale))} ·{" "}
          {(item.meta.size / 1024).toFixed(0)} KB · {t.status} {item.meta.status}
        </p>
        {item.meta.error && (
          <p className="text-sm text-red-700 dark:text-red-400">
            {t.error}: {item.meta.error}
          </p>
        )}
        {error === "commit_failed" && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            {t.commitFailed}
          </p>
        )}
      </header>

      {isActive ? (
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)]">
          {item.meta.status === "pending"
            ? t.pending
            : t.extracting}
        </section>
      ) : item.meta.status === "failed" ? (
        <section className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          <p>{t.extractionFailed}</p>
          <form action={retryInboxExtractionAction}>
            <input type="hidden" name="id" value={item.meta.id} />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-3 py-1 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40"
            >
              {t.retry}
            </button>
          </form>
        </section>
      ) : !isLab ? (
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)]">
          {t.wrongCategory}
        </section>
      ) : ex ? (
        <form action={commitInboxItemAction} className="space-y-6">
          <input type="hidden" name="id" value={item.meta.id} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t.date}>
              <input
                type="date"
                name="observed_at"
                defaultValue={ex.observed_at.slice(0, 10)}
                required
                className={inputCls}
              />
            </Field>
            <Field label={t.laboratory}>
              <input
                type="text"
                name="lab_name"
                defaultValue={ex.lab_name ?? ""}
                className={inputCls}
              />
            </Field>
          </div>

          <section className="space-y-2">
            <h2 className="font-medium">{t.markers} ({ex.markers.length})</h2>
            <p className="text-xs text-[var(--color-muted)]">
              {t.editHint}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase text-[var(--color-muted)]">
                    <th className="p-2">{t.marker}</th>
                    <th className="p-2">{t.value}</th>
                    <th className="p-2">{t.unit}</th>
                    <th className="p-2">{t.range}</th>
                    <th className="p-2">{t.flag}</th>
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
                          <option value="unknown">{t.unknown}</option>
                          <option value="low">{t.low}</option>
                          <option value="normal">{t.normal}</option>
                          <option value="high">{t.high}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Field label={t.notes}>
            <textarea
              name="notes"
              defaultValue={ex.notes ?? ""}
              rows={3}
              className={inputCls}
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <ConfirmSubmitButton locale={locale} />
          </div>
        </form>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          {t.noData}
        </p>
      )}

      <section className="space-y-2 border-t border-[var(--color-border)] pt-6">
        <h2 className="font-medium text-sm">{t.ocr}</h2>
        <pre className="text-xs whitespace-pre-wrap rounded bg-[var(--color-card)] p-3 max-h-64 overflow-auto">
          {item.rawText?.slice(0, 4000) ?? t.unavailable}
        </pre>
      </section>

      <form action={discardInboxItemAction}>
        <input type="hidden" name="id" value={item.meta.id} />
        <button
          type="submit"
          className="text-sm text-red-700 dark:text-red-400 hover:underline"
        >
          {t.discard}
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
