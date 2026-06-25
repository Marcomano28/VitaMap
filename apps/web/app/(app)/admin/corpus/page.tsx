import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin";
import {
  RIGHTS_STATUSES,
  SOURCE_KINDS,
  listCorpusDrafts,
  listPublishedCorpus,
  type CorpusDocument,
} from "@/lib/corpus-admin";
import { getLocale } from "@/lib/locale";
import { localeTag, localize } from "@/lib/i18n";
import { queryKB, type RetrievedChunk } from "@/lib/qmd";
import { SubmitButton } from "./submit-button";
import {
  deleteCorpusDraftAction,
  publishCorpusDraftAction,
  retireCorpusDocumentAction,
  saveCorpusDraftAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TEXT = {
  es: {
    metadata: "Administrar corpus",
    title: "Corpus de evidencia",
    intro:
      "Prepara fuentes fuera del índice, revísalas y publícalas de forma explícita. Añadir una URL no descarga su contenido.",
    newCandidate: "Nuevo candidato",
    editCandidate: "Editar borrador",
    titleField: "Título",
    sourceUrl: "URL de la fuente",
    doi: "DOI",
    pmid: "PMID",
    publicationDate: "Fecha de publicación",
    publicationDateHint: "AAAA, AAAA-MM o AAAA-MM-DD",
    sourceKind: "Función de la fuente",
    sourceType: "Tipo documental",
    sourceTypeHint: "Ej. guía clínica, revisión sistemática, ficha institucional",
    rightsStatus: "Derechos de uso",
    limitations: "Limitaciones, una por línea",
    markdownFile: "Markdown opcional",
    markdownHint:
      "Si contiene frontmatter, se importan título, fuente, fecha, clasificación, derechos, limitaciones, facetas y evidencia. Los campos escritos en el formulario tienen prioridad.",
    selectOrImport: "Seleccionar o importar del Markdown",
    body: "Contenido revisado que recuperará el RAG",
    bodyHint:
      "Pega únicamente contenido cuya incorporación al corpus esté permitida. Resume cuando no debas reproducir el original.",
    save: "Guardar borrador",
    processing: "Procesando…",
    clearForm: "Limpiar",
    cancelEdit: "Cancelar edición",
    drafts: "Borradores",
    published: "Publicados",
    none: "No hay documentos.",
    edit: "Editar",
    publish: "Publicar e indexar",
    delete: "Eliminar borrador",
    retire: "Retirar del índice",
    blockedRights:
      "Solo se puede publicar texto con derechos «permitted» o «licensed».",
    retrievalTest: "Probar recuperación",
    retrievalHint:
      "La consulta se ejecuta exclusivamente contra el corpus compartido, no contra la memoria de ningún usuario.",
    query: "Consulta",
    search: "Buscar en el RAG",
    noResults: "No se recuperaron fragmentos.",
    searchFailed: "No fue posible consultar el índice.",
    saved: "Borrador guardado.",
    deleted: "Borrador eliminado.",
    publishedOk: "Documento publicado e indexado.",
    retired: "Documento retirado del índice.",
    operationFailed:
      "La operación no se completó. Revisa los campos, los derechos y el estado del índice.",
  },
  de: {
    metadata: "Korpus verwalten",
    title: "Evidenzkorpus",
    intro:
      "Quellen außerhalb des Index vorbereiten, prüfen und ausdrücklich veröffentlichen. Eine URL wird nicht automatisch abgerufen.",
    newCandidate: "Neue Quelle",
    editCandidate: "Entwurf bearbeiten",
    titleField: "Titel",
    sourceUrl: "Quell-URL",
    doi: "DOI",
    pmid: "PMID",
    publicationDate: "Veröffentlichungsdatum",
    publicationDateHint: "JJJJ, JJJJ-MM oder JJJJ-MM-TT",
    sourceKind: "Funktion der Quelle",
    sourceType: "Dokumenttyp",
    sourceTypeHint: "Z. B. Leitlinie, systematische Übersicht, Institutionsseite",
    rightsStatus: "Nutzungsrechte",
    limitations: "Einschränkungen, eine pro Zeile",
    markdownFile: "Optionales Markdown",
    markdownHint:
      "Frontmatter importiert Titel, Quelle, Datum, Klassifikation, Rechte, Einschränkungen, Facetten und Evidenz. Im Formular eingegebene Werte haben Vorrang.",
    selectOrImport: "Auswählen oder aus Markdown importieren",
    body: "Geprüfter Inhalt für den RAG-Abruf",
    bodyHint:
      "Nur Inhalte einfügen, deren Aufnahme zulässig ist. Zusammenfassen, wenn der Originaltext nicht übernommen werden darf.",
    save: "Entwurf speichern",
    processing: "Wird verarbeitet…",
    clearForm: "Zurücksetzen",
    cancelEdit: "Bearbeitung abbrechen",
    drafts: "Entwürfe",
    published: "Veröffentlicht",
    none: "Keine Dokumente vorhanden.",
    edit: "Bearbeiten",
    publish: "Veröffentlichen und indexieren",
    delete: "Entwurf löschen",
    retire: "Aus Index entfernen",
    blockedRights:
      "Text kann nur mit den Rechten „permitted“ oder „licensed“ veröffentlicht werden.",
    retrievalTest: "Abruf testen",
    retrievalHint:
      "Die Abfrage läuft nur gegen den gemeinsamen Korpus, nicht gegen den Speicher eines Nutzers.",
    query: "Abfrage",
    search: "Im RAG suchen",
    noResults: "Keine Abschnitte gefunden.",
    searchFailed: "Der Index konnte nicht abgefragt werden.",
    saved: "Entwurf gespeichert.",
    deleted: "Entwurf gelöscht.",
    publishedOk: "Dokument veröffentlicht und indexiert.",
    retired: "Dokument aus dem Index entfernt.",
    operationFailed:
      "Der Vorgang ist fehlgeschlagen. Felder, Nutzungsrechte und Indexstatus prüfen.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    edit?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function CorpusAdminPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const locale = await getLocale();
  const t = localize(locale, TEXT);
  const params = await searchParams;
  const [drafts, published] = await Promise.all([
    listCorpusDrafts(),
    listPublishedCorpus(),
  ]);
  const editing = drafts.find((document) => document.id === params.edit);
  const query = params.q?.trim() ?? "";
  let results: RetrievedChunk[] = [];
  let searchFailed = false;
  if (query) {
    try {
      results = await queryKB(query, { limit: 6 });
    } catch (error) {
      console.error("[corpus] retrieval test failed", error);
      searchFailed = true;
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{t.title}</h1>
        <p className="max-w-3xl text-sm text-[var(--color-muted)]">{t.intro}</p>
      </header>

      {params.success && (
        <Notice tone="success">
          {params.success === "draft_saved"
            ? t.saved
            : params.success === "draft_deleted"
              ? t.deleted
              : params.success === "published"
                ? t.publishedOk
                : t.retired}
        </Notice>
      )}
      {params.error && <Notice tone="error">{t.operationFailed}</Notice>}

      <section id="candidate" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-medium">
            {editing ? t.editCandidate : t.newCandidate}
          </h2>
          {editing && (
            <Link href="/admin/corpus#candidate" className="text-sm underline">
              {t.cancelEdit}
            </Link>
          )}
        </div>

        <form action={saveCorpusDraftAction} className="space-y-4">
          {editing && <input type="hidden" name="draft_id" value={editing.id} />}
          <Field label={t.titleField}>
            <input
              className={inputCls}
              name="title"
              maxLength={240}
              defaultValue={editing?.title}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.sourceUrl}>
              <input
                className={inputCls}
                name="source_url"
                type="url"
                defaultValue={editing?.sourceUrl}
              />
            </Field>
            <Field label={t.doi}>
              <input className={inputCls} name="doi" defaultValue={editing?.doi} />
            </Field>
            <Field label={t.pmid}>
              <input
                className={inputCls}
                name="pmid"
                inputMode="numeric"
                defaultValue={editing?.pmid}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.publicationDate}>
              <input
                className={inputCls}
                name="publication_date"
                type="text"
                placeholder={t.publicationDateHint}
                pattern="\d{4}(-\d{2}(-\d{2})?)?"
                defaultValue={editing?.publicationDate}
              />
            </Field>
            <Field label={t.sourceType}>
              <input
                className={inputCls}
                name="source_type"
                maxLength={100}
                placeholder={t.sourceTypeHint}
                defaultValue={editing?.sourceType}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.sourceKind}>
              <select
                className={inputCls}
                name="source_kind"
                defaultValue={editing?.sourceKind ?? ""}
              >
                <option value="">{t.selectOrImport}</option>
                {SOURCE_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.rightsStatus}>
              <select
                className={inputCls}
                name="rights_status"
                defaultValue={editing?.rightsStatus ?? ""}
              >
                <option value="">{t.selectOrImport}</option>
                {RIGHTS_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t.limitations}>
            <textarea
              className={inputCls}
              name="limitations"
              rows={3}
              defaultValue={editing?.limitations.join("\n")}
            />
          </Field>
          <Field label={t.markdownFile}>
            <input
              className={inputCls}
              name="markdown_file"
              type="file"
              accept=".md,text/markdown,text/plain"
            />
            <span className="block text-xs text-[var(--color-muted)]">
              {t.markdownHint}
            </span>
          </Field>
          <Field label={t.body}>
            <textarea
              className={inputCls}
              name="body"
              rows={14}
              defaultValue={editing?.body}
            />
            <span className="block text-xs text-[var(--color-muted)]">
              {t.bodyHint}
            </span>
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton className={primaryButtonCls} pendingLabel={t.processing}>
              {t.save}
            </SubmitButton>
            <button type="reset" className={secondaryButtonCls}>
              {t.clearForm}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">{t.drafts} ({drafts.length})</h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t.none}</p>
        ) : (
          <div className="space-y-3">
            {drafts.map((document) => (
              <DocumentCard key={document.id} document={document} locale={locale}>
                <Link
                  href={`/admin/corpus?edit=${encodeURIComponent(document.id)}#candidate`}
                  className={secondaryButtonCls}
                >
                  {t.edit}
                </Link>
                <form action={publishCorpusDraftAction}>
                  <input type="hidden" name="id" value={document.id} />
                  <SubmitButton
                    className={primaryButtonCls}
                    pendingLabel={t.processing}
                    disabled={
                      document.rightsStatus !== "permitted" &&
                      document.rightsStatus !== "licensed"
                    }
                  >
                    {t.publish}
                  </SubmitButton>
                </form>
                <form action={deleteCorpusDraftAction}>
                  <input type="hidden" name="id" value={document.id} />
                  <SubmitButton className={dangerButtonCls} pendingLabel={t.processing}>
                    {t.delete}
                  </SubmitButton>
                </form>
                {document.rightsStatus !== "permitted" &&
                  document.rightsStatus !== "licensed" && (
                    <p className="basis-full text-xs text-amber-700 dark:text-amber-300">
                      {t.blockedRights}
                    </p>
                  )}
              </DocumentCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">
          {t.published} ({published.length})
        </h2>
        {published.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t.none}</p>
        ) : (
          <div className="space-y-3">
            {published.map((document) => (
              <DocumentCard
                key={document.relativePath}
                document={document}
                locale={locale}
              >
                <form action={retireCorpusDocumentAction}>
                  <input
                    type="hidden"
                    name="relative_path"
                    value={document.relativePath}
                  />
                  <SubmitButton className={dangerButtonCls} pendingLabel={t.processing}>
                    {t.retire}
                  </SubmitButton>
                </form>
              </DocumentCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-medium">{t.retrievalTest}</h2>
          <p className="text-sm text-[var(--color-muted)]">{t.retrievalHint}</p>
        </div>
        <form method="get" className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            name="q"
            required
            defaultValue={query}
            aria-label={t.query}
          />
          <button type="submit" className={primaryButtonCls}>
            {t.search}
          </button>
        </form>
        {searchFailed ? (
          <Notice tone="error">{t.searchFailed}</Notice>
        ) : query && results.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t.noResults}</p>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <article
                key={`${result.path}-${result.score}`}
                className="rounded-md border border-[var(--color-border)] p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                  <strong className="break-words text-[var(--color-foreground)]">
                    {result.title}
                  </strong>
                  <span>{result.sourceKind ?? "unknown"}</span>
                  <span>{result.score.toFixed(3)}</span>
                  {result.sourceUrl && (
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all underline"
                    >
                      {result.sourceUrl}
                    </a>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{result.snippet}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DocumentCard({
  document,
  locale,
  children,
}: {
  document: CorpusDocument;
  locale: "es" | "de";
  children: React.ReactNode;
}) {
  const date = document.publishedAt ?? document.createdAt;
  return (
    <article className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="break-words font-medium">{document.title}</h3>
          <p className="break-words text-xs text-[var(--color-muted)]">
            {document.sourceKind} · {document.sourceType} · {document.rightsStatus}
            {date
              ? ` · ${new Date(date).toLocaleDateString(localeTag(locale))}`
              : ""}
          </p>
          <p className="break-all text-xs text-[var(--color-muted)]">
            {document.sourceUrl ?? document.doi ?? document.pmid ?? document.relativePath}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">{children}</div>
      </div>
    </article>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const colors =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200";
  return <p className={`rounded-md border p-3 text-sm ${colors}`}>{children}</p>;
}

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

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]";
const primaryButtonCls =
  "w-full whitespace-nowrap rounded-md bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto";
const secondaryButtonCls =
  "w-full whitespace-nowrap rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-background)] sm:w-auto";
const dangerButtonCls =
  "w-full whitespace-nowrap rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 sm:w-auto";
