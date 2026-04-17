export type ThemeName = "indigo" | "rose-gold" | "forest" | "celestial-gold";

export type ColorPalette = {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  morning: string;
  afternoon: string;
  evening: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  success: string;
  successForeground: string;
};

export const palettes: Record<ThemeName, ColorPalette> = {
  indigo: {
    text: "#F0EDF8",
    tint: "#A78BFA",
    background: "#0D0B1A",
    foreground: "#F0EDF8",
    card: "#1A1530",
    cardForeground: "#F0EDF8",
    primary: "#A78BFA",
    primaryForeground: "#0D0B1A",
    secondary: "#221C40",
    secondaryForeground: "#C4B5FD",
    muted: "#1A1530",
    mutedForeground: "#7C6FA0",
    accent: "#7C3AED",
    accentForeground: "#F0EDF8",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#2D2550",
    input: "#2D2550",
    morning: "#F9C74F",
    afternoon: "#A78BFA",
    evening: "#7B61FF",
    gradientStart: "#0D0B1A",
    gradientMid: "#1A1242",
    gradientEnd: "#0D1F3C",
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  "rose-gold": {
    text: "#F0E8E0",
    tint: "#F4A7B9",
    background: "#1A0F0F",
    foreground: "#F0E8E0",
    card: "#2A1A1A",
    cardForeground: "#F0E8E0",
    primary: "#F4A7B9",
    primaryForeground: "#1A0F0F",
    secondary: "#3A1F1F",
    secondaryForeground: "#F4C5C5",
    muted: "#2A1A1A",
    mutedForeground: "#A07070",
    accent: "#C9956C",
    accentForeground: "#F0E8E0",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#4A2A2A",
    input: "#4A2A2A",
    morning: "#F9C74F",
    afternoon: "#F4A7B9",
    evening: "#C9956C",
    gradientStart: "#1A0F0F",
    gradientMid: "#2D1515",
    gradientEnd: "#1F1010",
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  forest: {
    text: "#E8F5EC",
    tint: "#4ADE80",
    background: "#0A1A0F",
    foreground: "#E8F5EC",
    card: "#0F2A18",
    cardForeground: "#E8F5EC",
    primary: "#4ADE80",
    primaryForeground: "#0A1A0F",
    secondary: "#163522",
    secondaryForeground: "#86EFAC",
    muted: "#0F2A18",
    mutedForeground: "#527A60",
    accent: "#166534",
    accentForeground: "#E8F5EC",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#1F4A2A",
    input: "#1F4A2A",
    morning: "#FDE68A",
    afternoon: "#4ADE80",
    evening: "#059669",
    gradientStart: "#0A1A0F",
    gradientMid: "#0F2215",
    gradientEnd: "#081A0D",
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  "celestial-gold": {
    text: "#FFF8E7",
    tint: "#F59E0B",
    background: "#0F0B00",
    foreground: "#FFF8E7",
    card: "#1F1800",
    cardForeground: "#FFF8E7",
    primary: "#F59E0B",
    primaryForeground: "#0F0B00",
    secondary: "#2D2200",
    secondaryForeground: "#FCD34D",
    muted: "#1F1800",
    mutedForeground: "#8A7040",
    accent: "#D97706",
    accentForeground: "#FFF8E7",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#3D2F00",
    input: "#3D2F00",
    morning: "#F59E0B",
    afternoon: "#FBBF24",
    evening: "#D97706",
    gradientStart: "#0F0B00",
    gradientMid: "#1A1400",
    gradientEnd: "#0D0A00",
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },
};

export const THEME_META: Record<ThemeName, { label: string; swatch: string }> = {
  indigo:           { label: "Indigo",         swatch: "#A78BFA" },
  "rose-gold":      { label: "Rose Gold",      swatch: "#F4A7B9" },
  forest:           { label: "Forest",         swatch: "#4ADE80" },
  "celestial-gold": { label: "Celestial Gold", swatch: "#F59E0B" },
};

const colors = {
  light: palettes.indigo,
  radius: 16,
};

export default colors;
