import Link from "next/link";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { requireViewSubject } from "@/lib/data-access-guards";
import { DemoBanner } from "@/components/demo-notice";
import { assessmentsEnabled } from "@/lib/flags";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: copy[locale].memory.title };
}

export default async function MemoryPage() {
  const { anonymous } = await requireViewSubject("read");
  const locale = await getLocale();
  const t = copy[locale].memory;
  const entries = assessmentsEnabled()
    ? t.entries
    : t.entries.filter((e) => e.href !== "/assess");

  return (
    <div className="space-y-8">
      {anonymous ? <DemoBanner locale={locale} /> : null}
      <header className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-semibold vital-reveal-text leading-tight">
          {t.title}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t.body}
        </p>
        <p className="text-sm">
          <Link href="/memory/timeline" className="underline">
            {t.timeline} →
          </Link>
        </p>
        <p className="text-sm">
          <Link href="/memory/map" className="underline">
            {locale === "de" ? "Meine Gesundheitskarte" : "Ver mi mapa de salud"} →
          </Link>
        </p>
      </header>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-[var(--color-muted)] mb-3">
          {t.addEntries}
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {entries.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                className="block rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-accent)] transition"
              >
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-[var(--color-muted)] mt-1">{e.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
