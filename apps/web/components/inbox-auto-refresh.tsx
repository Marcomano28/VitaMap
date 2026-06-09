"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

interface Props {
  enabled: boolean;
  locale: Locale;
  startedAt?: string;
}

const TEXT = {
  es: {
    title: "Procesamiento en curso",
    body: "El OCR y la extracción pueden tardar varios minutos. La página se actualiza automáticamente; no vuelvas a subir el archivo ni pulses de nuevo.",
    elapsed: "Tiempo transcurrido",
  },
  de: {
    title: "Verarbeitung läuft",
    body: "OCR und Extraktion können mehrere Minuten dauern. Die Seite wird automatisch aktualisiert; lade die Datei nicht erneut hoch und starte den Vorgang nicht noch einmal.",
    elapsed: "Verstrichene Zeit",
  },
} as const;

export function InboxAutoRefresh({ enabled, locale, startedAt }: Props) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const refreshId = window.setInterval(() => {
      router.refresh();
    }, 3000);
    return () => window.clearInterval(refreshId);
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled || !startedAt) return;
    const started = new Date(startedAt).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    updateElapsed();
    const elapsedId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(elapsedId);
  }, [enabled, startedAt]);

  if (!enabled) return null;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  const t = TEXT[locale];

  return (
    <section
      className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100"
      aria-live="polite"
    >
      <span
        className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-blue-600 animate-pulse dark:bg-blue-400"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-medium">{t.title}</p>
        <p>{t.body}</p>
        {startedAt && (
          <p className="text-xs opacity-75">
            {t.elapsed}: {minutes}:{seconds}
          </p>
        )}
      </div>
    </section>
  );
}
