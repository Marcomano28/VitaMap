import { copy, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/**
 * Aviso legal obligatorio. Se inyecta en TODA respuesta del modelo y en el
 * pie de página global. NUNCA se confía al LLM su inclusión: aquí lo mete
 * el código.
 */
export function Disclaimer({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = copy[locale].disclaimer;

  return (
    <footer className="vitamap-disclaimer">
      <div className="mx-auto max-w-4xl px-4 py-4 text-xs leading-relaxed">
        <p>
          <strong>{t.label}</strong> {t.text}
        </p>
      </div>
    </footer>
  );
}

/**
 * Versión inline para inyectar en cada respuesta del chat. Usar SIEMPRE
 * desde el código de renderizado de mensajes del modelo, nunca delegar
 * en el prompt.
 */
export function InlineDisclaimer({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = copy[locale].disclaimer;

  return (
    <p className="mt-3 text-xs text-[var(--color-muted)] italic border-l-2 border-[var(--color-border)] pl-3">
      {t.inline}
    </p>
  );
}
