"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState<Locale | null>(null);

  async function setLocale(next: Locale) {
    if (next === locale || pending) return;
    setPending(next);
    try {
      await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      className="inline-flex shrink-0 rounded-md border border-[var(--color-border)] overflow-hidden text-xs"
      aria-label={locale === "de" ? "Sprache" : "Idioma"}
    >
      {(["es", "de"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          disabled={!!pending}
          className={[
            "whitespace-nowrap px-2 py-1 transition",
            locale === l
              ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
              : "text-[var(--color-muted)] hover:bg-[var(--color-card)]",
          ].join(" ")}
          aria-pressed={locale === l}
          title={l === "de" ? "Deutsch" : "Español"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
