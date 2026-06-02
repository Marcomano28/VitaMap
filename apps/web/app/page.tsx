import Link from "next/link";
import { copy } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = copy[locale].home;

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-wider text-[var(--color-muted)]">
          {t.eyebrow}
        </p>
        <h1 className="vital-reveal-text text-4xl sm:text-5xl font-semibold leading-tight">
          {t.title}
        </h1>
        <p className="text-lg text-[var(--color-muted)] max-w-2xl">
          {t.body}
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/register"
            className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            {t.primary}
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-card)] transition"
          >
            {t.secondary}
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {t.features.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            body={feature.body}
          />
        ))}
      </section>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-2">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
