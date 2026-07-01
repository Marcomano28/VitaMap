"use client";

import { useTheme } from "@/components/theme-provider";

interface ThemeToggleProps {
  intent?: "tone" | "palette";
}

export function ThemeToggle({ intent = "tone" }: ThemeToggleProps) {
  const { mode, resolvedTheme, palette, togglePalette, toggleTone } = useTheme();
  const paletteLabel = palette === "warm" ? "cálido" : "frío";
  const nextTone = resolvedTheme === "dark" ? "día" : "noche";
  const titleByMode = {
    "cool-dark": "Noche fría",
    "warm-dark": "Noche cálida",
    "warm-light": "Día cálido",
    "cool-light": "Día frío",
  } as const;
  const ariaLabel =
    intent === "palette"
      ? palette === "warm"
        ? "Cambiar a marca fría"
        : "Cambiar a marca cálida"
      : `Cambiar a ${nextTone} ${paletteLabel}`;
  const title =
    intent === "palette"
      ? palette === "warm"
        ? "Marca cálida"
        : "Marca fría"
      : titleByMode[mode];

  return (
    <button
      type="button"
      onClick={intent === "palette" ? togglePalette : toggleTone}
      aria-label={ariaLabel}
      title={title}
      className="theme-toggle"
      data-mode={mode}
      data-intent={intent}
      data-theme={resolvedTheme}
      data-palette={palette}
    >
      <span className="theme-toggle-track">
        {intent === "palette" ? (
          <>
            <span className="theme-toggle-mark" data-mark="cool" />
            <span className="theme-toggle-mark" data-mark="warm" />
          </>
        ) : (
          <>
            <span className="theme-toggle-mark" data-mark="night" />
            <span className="theme-toggle-mark" data-mark="day" />
          </>
        )}
        <span
          className="theme-toggle-thumb"
          data-theme={resolvedTheme}
          data-palette={palette}
        >
          {intent === "palette" ? (
            <span className="theme-toggle-palette-icon" aria-hidden="true" />
          ) : resolvedTheme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
}
