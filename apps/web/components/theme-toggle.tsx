"use client";

import { useTheme } from "@/components/theme-provider";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

interface ThemeToggleProps {
  intent?: "tone" | "palette";
  locale?: Locale;
}

/** Keep the existing stored theme IDs, palette toggle and day/night behavior. */
export function ThemeToggle({ intent = "tone", locale = DEFAULT_LOCALE }: ThemeToggleProps) {
  const { mode, resolvedTheme, palette, togglePalette, toggleTone } = useTheme();
  const de = locale === "de";
  // Nombres de paleta localizados: en alemán, Umbral = Schwelle y Nácar = Perlmutt.
  const umbral = de ? "Schwelle" : "Umbral";
  const nacar = de ? "Perlmutt" : "Nácar";
  const name = palette === "warm" ? umbral : nacar;
  const nextName = palette === "warm" ? nacar : umbral;
  const dark = resolvedTheme === "dark";
  const tone = dark ? (de ? "Nacht" : "Noche") : (de ? "Tag" : "Día");
  const nextTone = dark ? (de ? "Tag" : "día") : (de ? "Nacht" : "noche");
  const label = intent === "palette"
    ? (de ? `Palette zu ${nextName} wechseln` : `Cambiar paleta a ${nextName}`)
    : (de ? `Zu ${nextTone} wechseln` : `Cambiar a ${nextTone}`);
  return (
    <button type="button" onClick={intent === "palette" ? togglePalette : toggleTone}
      aria-label={label} title={label} className="theme-toggle"
      data-mode={mode} data-intent={intent} data-theme={resolvedTheme} data-palette={palette}>
      <span className={intent === "palette" ? "theme-swatch" : "theme-tone-icon"} aria-hidden="true">{intent === "tone" ? (dark ? "◐" : "☼") : null}</span>
      <span>{intent === "palette" ? name : tone}</span>
    </button>
  );
}
