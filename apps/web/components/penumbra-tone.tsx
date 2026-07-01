"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

/**
 * VitaWende is always penumbra. While the landing is mounted we pin the tone to
 * dark, so leaving VitaWende always enters VitaMap in noche (a soft contrast
 * jump from the dim landing). The palette is preserved — the user can switch to
 * día once inside VitaMap; that choice is reset to noche on the next entry.
 */
export function PenumbraTone() {
  const { resolvedTheme, palette, setTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme === "light") {
      setTheme(palette === "warm" ? "warm-dark" : "dark");
    }
  }, [resolvedTheme, palette, setTheme]);

  return null;
}
