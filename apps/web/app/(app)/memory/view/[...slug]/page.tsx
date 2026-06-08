import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { readMemoryItem } from "@/lib/memory-reader";
import { MarkdownView } from "@/components/markdown-view";
import { deleteMemoryItemAction } from "./actions";
import { getLocale } from "@/lib/locale";
import { localize } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TEXT = {
  es: {
    metadata: "Entrada de memoria",
    back: "← Volver a la línea de tiempo",
    imageInfo:
      "Imagen descifrada en el servidor solo para esta vista. El archivo en disco sigue cifrado.",
    frontmatter: "Ver frontmatter en bruto",
    delete: "Borrar esta entrada (también borra del índice QMD)",
  },
  de: {
    metadata: "Speichereintrag",
    back: "← Zurück zur Zeitlinie",
    imageInfo:
      "Das Bild wird nur für diese Ansicht auf dem Server entschlüsselt. Die Datei auf dem Datenträger bleibt verschlüsselt.",
    frontmatter: "Rohes Frontmatter anzeigen",
    delete: "Diesen Eintrag löschen (auch aus dem QMD-Index)",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: localize(locale, TEXT).metadata };
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function MemoryViewPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { slug } = await params;
  const relPath = slug.map(decodeURIComponent).join("/");
  const item = await readMemoryItem(userId, relPath);
  if (!item) notFound();
  const locale = await getLocale();
  const t = localize(locale, TEXT);

  const fm = item.frontmatter;
  const type = typeof fm.type === "string" ? fm.type : "unknown";
  const observedAt = typeof fm.observed_at === "string" ? fm.observed_at : undefined;
  const title = typeof fm.title === "string" ? fm.title : item.relPath;
  const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
  const encryptedImage = typeof fm.encrypted_image === "string" ? fm.encrypted_image : null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/memory/timeline" className="text-xs text-[var(--color-muted)] hover:underline">
          {t.back}
        </Link>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="rounded bg-[var(--color-card)] border border-[var(--color-border)] px-2 py-0.5 uppercase tracking-wide">
            {type}
          </span>
          {observedAt && <span>{observedAt.slice(0, 10)}</span>}
          <span className="font-mono text-[10px] opacity-60">{item.relPath}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((t) => (
              <span key={t} className="rounded bg-[var(--color-card)] border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {encryptedImage && (
        <section className="rounded-md border border-[var(--color-border)] overflow-hidden">
          <img
            src={`/api/image/${encodeURIComponent(encryptedImage)}`}
            alt={title}
            className="block w-full max-h-[70vh] object-contain bg-[var(--color-card)]"
          />
          <p className="text-xs text-[var(--color-muted)] p-2 border-t border-[var(--color-border)]">
            {t.imageInfo}
          </p>
        </section>
      )}

      <article className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <MarkdownView content={item.body} />
      </article>

      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--color-muted)] hover:underline">
          {t.frontmatter}
        </summary>
        <pre className="mt-2 rounded bg-[var(--color-card)] p-3 overflow-x-auto">
{JSON.stringify(fm, null, 2)}
        </pre>
      </details>

      <form action={deleteMemoryItemAction} className="border-t border-[var(--color-border)] pt-4">
        <input type="hidden" name="relPath" value={item.relPath} />
        <button
          type="submit"
          className="text-sm text-red-700 dark:text-red-400 hover:underline"
        >
          {t.delete}
        </button>
      </form>
    </div>
  );
}
