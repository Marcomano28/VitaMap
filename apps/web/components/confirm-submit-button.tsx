"use client";

import { useFormStatus } from "react-dom";
import type { Locale } from "@/lib/i18n";

const TEXT = {
  es: {
    idle: "Confirmar y añadir a la memoria",
    pending: "Confirmando...",
  },
  de: {
    idle: "Bestätigen und zum Speicher hinzufügen",
    pending: "Wird bestätigt...",
  },
} as const;

export function ConfirmSubmitButton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  const t = TEXT[locale];

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="rounded-md bg-[var(--color-foreground)] text-[var(--color-background)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? t.pending : t.idle}
    </button>
  );
}
