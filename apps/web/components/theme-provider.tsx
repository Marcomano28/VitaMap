"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "warm-light" | "warm-dark" | "system";
type ResolvedTheme = "light" | "dark";
type Palette = "cool" | "warm";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  palette: Palette;
  mode: "cool-light" | "cool-dark" | "warm-light" | "warm-dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  togglePalette: () => void;
  toggleTone: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "vitamap-theme";
const DEFAULT_THEME: Theme = "warm-dark";

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  if (theme === "warm-light") return "light";
  if (theme === "warm-dark") return "dark";
  return theme;
}

function resolvePalette(theme: Theme): Palette {
  return theme === "warm-light" || theme === "warm-dark" ? "warm" : "cool";
}

function resolveMode(theme: Theme) {
  const resolved = resolveTheme(theme);
  const palette = resolvePalette(theme);
  return `${palette}-${resolved}` as ThemeContextValue["mode"];
}

function themeFrom(palette: Palette, resolved: ResolvedTheme): Theme {
  if (palette === "warm") {
    return resolved === "dark" ? "warm-dark" : "warm-light";
  }
  return resolved;
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const palette = resolvePalette(theme);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-palette", palette);
  root.setAttribute("data-theme-mode", resolveMode(theme));
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [palette, setPalette] = useState<Palette>("warm");
  const [mounted, setMounted] = useState(false);
  const mode = `${palette}-${resolvedTheme}` as ThemeContextValue["mode"];

  // Inicialización: lee el tema guardado y aplica antes del primer render.
  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || DEFAULT_THEME;
    setThemeState(saved);
    applyTheme(saved);
    setResolvedTheme(resolveTheme(saved));
    setPalette(resolvePalette(saved));
  }, []);

  // Aplica y persiste cada vez que el tema cambia.
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    setResolvedTheme(resolveTheme(theme));
    setPalette(resolvePalette(theme));
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  // Escucha cambios del sistema cuando el tema es "system".
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const listener = (e: MediaQueryListEvent) => {
      applyTheme("system");
      setResolvedTheme(e.matches ? "dark" : "light");
      setPalette("cool");
    };

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [theme, mounted]);

  const setTheme = (next: Theme) => setThemeState(next);

  const togglePalette = () => {
    setThemeState((prev) => {
      const currentPalette = resolvePalette(prev);
      const currentTone = resolveTheme(prev);
      return themeFrom(currentPalette === "warm" ? "cool" : "warm", currentTone);
    });
  };

  const toggleTone = () => {
    setThemeState((prev) => {
      const currentPalette = resolvePalette(prev);
      const currentTone = resolveTheme(prev);
      return themeFrom(currentPalette, currentTone === "dark" ? "light" : "dark");
    });
  };

  const toggleTheme = toggleTone;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        palette,
        mode,
        setTheme,
        toggleTheme,
        togglePalette,
        toggleTone,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
