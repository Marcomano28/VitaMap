import Link from "next/link";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: copy[locale].guide.title };
}

export default async function GuidePage() {
  const locale = await getLocale();
  const t = copy[locale].guide;

  return (
    <div className="space-y-10 max-w-2xl">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-[var(--color-muted)]">{t.intro}</p>
      </header>

      {t.blocks.map((block, i) => (
        <section key={i} className="space-y-4">
          <h2 className="text-lg font-medium">{block.heading}</h2>
          {block.body && (
            <p className="text-sm text-[var(--color-muted)]">{block.body}</p>
          )}
          <ul className="space-y-2">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3 text-sm">
                <span
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-muted)]"
                  aria-hidden="true"
                >
                  {j + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {block.note && (
            <p className="text-xs text-[var(--color-muted)] border-l-2 border-[var(--color-border)] pl-3 italic">
              {block.note}
            </p>
          )}
        </section>
      ))}

      <div className="pt-2">
        <Link
          href="/upload"
          className="inline-block rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-5 py-2 text-sm font-medium hover:opacity-90"
        >
          {t.uploadCta}
        </Link>
      </div>
    </div>
  );
}
