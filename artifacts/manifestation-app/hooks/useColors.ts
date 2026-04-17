import { useContext } from "react";

import { AppContext } from "@/context/AppContext";
import { palettes, ThemeName } from "@/constants/colors";

/**
 * Returns the colour palette for the currently selected theme.
 * Falls back to "indigo" when AppContext is not yet available or no
 * theme has been persisted (first launch, loading state).
 */
export function useColors() {
  const ctx = useContext(AppContext);
  const theme: ThemeName = ctx?.selectedTheme ?? "indigo";
  const palette = palettes[theme] ?? palettes.indigo;
  return { ...palette, radius: 16 };
}
