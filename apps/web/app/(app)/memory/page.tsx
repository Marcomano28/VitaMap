import Link from "next/link";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { requireViewSubject } from "@/lib/data-access-guards";
import { DemoBanner } from "@/components/demo-notice";
import { assessmentsEnabled } from "@/lib/flags";
import { OrganicMark } from "@/components/organic-mark";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: copy[locale].memory.title };
}

export default async function MemoryPage() {
  const { anonymous } = await requireViewSubject("read");
  const locale = await getLocale();
  const t = copy[locale].memory;
  const de = locale === "de";
  const entries = assessmentsEnabled()
    ? t.entries
    : t.entries.filter((e) => e.href !== "/assess");

  return (
    <div className="memory-home space-y-8">
      {anonymous ? <DemoBanner locale={locale} /> : null}
      <header className="memory-hero">
        <div>
          <p className="design-eyebrow">VitaMap / {de ? "Persönlicher Speicher" : "Memoria personal"}</p>
          <h1>{t.title}</h1>
          <p className="memory-intro">{t.body}</p>
        </div>
        <OrganicMark />
      </header>
      <nav className="memory-paths" aria-label={de ? "Deinen Speicher erkunden" : "Explorar tu memoria"}>
        <Link href="/memory/timeline"><span className="design-eyebrow">01 / {de ? "Verlauf" : "Historia"}</span><span className="memory-path-title">{t.timeline}<span aria-hidden="true">↗</span></span></Link>
        <Link href="/memory/map"><span className="design-eyebrow">02 / {de ? "Entdecken" : "Explorar"}</span><span className="memory-path-title">{de ? "Meine Gesundheitskarte" : "Ver mi mapa de salud"}<span aria-hidden="true">↗</span></span></Link>
      </nav>
      <section>
        <h2 className="memory-section-title">{t.addEntries}</h2>
        <ul className="memory-entry-grid">
          {entries.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="memory-entry">
                <span className="memory-entry-arrow" aria-hidden="true">↗</span>
                <p className="memory-entry-title">{e.title}</p>
                <p className="memory-entry-body">{e.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
