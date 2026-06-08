import Link from "next/link";
import type { Metadata } from "next";
import { listInbox } from "@/lib/inbox";
import { UploadDropzone } from "@/components/upload-dropzone";
import { InboxAutoRefresh } from "@/components/inbox-auto-refresh";
import { discardInboxItemAction, retryInboxExtractionAction } from "./actions";
import { requireUserId } from "@/lib/session";
import { getLocale } from "@/lib/locale";
import { localeTag, localize } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TEXT = {
  es: {
    title: "Subir documentos",
    intro:
      "Sube analíticas, informes o imágenes. El archivo se cifra al recibirse. Tras OCR y extracción, podrás revisar los valores antes de añadirlos a tu memoria.",
    inbox: "Buzón",
    empty: "Aún no hay documentos pendientes.",
    help: "¿No sabes qué subir?",
    statuses: {
      pending: "En cola",
      extracting: "Extrayendo",
      extracted: "Listo para revisar",
      failed: "Error",
    },
    review: "Revisar",
    retry: "Reintentar",
    discard: "Descartar",
  },
  de: {
    title: "Dokumente hochladen",
    intro:
      "Lade Laborbefunde, Berichte oder Bilder hoch. Die Datei wird beim Eingang verschlüsselt. Nach OCR und Extraktion kannst du die Werte prüfen, bevor sie in deinen Speicher übernommen werden.",
    inbox: "Eingang",
    empty: "Es sind noch keine Dokumente in Bearbeitung.",
    help: "Du weißt nicht, was du hochladen sollst?",
    statuses: {
      pending: "In Warteschlange",
      extracting: "Wird extrahiert",
      extracted: "Bereit zur Prüfung",
      failed: "Fehler",
    },
    review: "Prüfen",
    retry: "Erneut versuchen",
    discard: "Verwerfen",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).title };
}

export default async function UploadPage() {
  const userId = await requireUserId();
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const inbox = await listInbox(userId);
  const hasActiveJobs = inbox.some((it) => it.status === "pending" || it.status === "extracting");

  return (
    <div className="space-y-8">
      <InboxAutoRefresh enabled={hasActiveJobs} />
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.intro}
        </p>
      </header>

      <section>
        <UploadDropzone defaultCategory="lab" locale={locale} />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">{t.inbox} ({inbox.length})</h2>
        {inbox.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t.empty}{" "}
            <Link href="/guide" className="underline hover:text-[var(--color-foreground)]">
              {t.help}
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {inbox.map((it) => (
              <li key={it.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">
                    {it.originalName}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {it.category} · {new Date(it.uploadedAt).toLocaleString(localeTag(locale))} ·{" "}
                    {(it.size / 1024).toFixed(0)} KB
                    {it.error ? ` · ${it.error.slice(0, 80)}` : ""}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    it.status === "extracted"
                      ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
                      : it.status === "failed"
                        ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200"
                        : it.status === "extracting"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                          : "bg-[var(--color-card)] text-[var(--color-muted)]"
                  }`}
                >
                  {t.statuses[it.status as keyof typeof t.statuses] ?? it.status}
                </span>
                {it.status === "extracted" && (
                  <Link
                    href={`/inbox/${it.id}`}
                    className="text-sm rounded-md border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-card)]"
                  >
                    {t.review}
                  </Link>
                )}
                {it.status === "failed" && (
                  <form action={retryInboxExtractionAction}>
                    <input type="hidden" name="id" value={it.id} />
                    <button
                      type="submit"
                      className="text-sm rounded-md border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-card)]"
                    >
                      {t.retry}
                    </button>
                  </form>
                )}
                <form action={discardInboxItemAction}>
                  <input type="hidden" name="id" value={it.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-700 dark:text-red-400 hover:underline"
                    aria-label={t.discard}
                  >
                    {t.discard}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
