export type ThemeName =
  | "indigo"
  | "rose-gold"
  | "forest"
  | "celestial-gold"
  | "silver"
  | "white"
  | "black"
  | "blue";

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
  crystalGradient: [string, string, string, string];
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
    crystalGradient: ["#3B1F6E", "#6D28D9", "#A78BFA", "#C4B5FD"],
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
    crystalGradient: ["#6E1530", "#9D174D", "#F4A7B9", "#FDE8EF"],
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
    crystalGradient: ["#052E16", "#14532D", "#22C55E", "#86EFAC"],
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  "celestial-gold": {
    text: "#FFF5E0",
    tint: "#C9A84C",
    background: "#100C00",
    foreground: "#FFF5E0",
    card: "#1E1700",
    cardForeground: "#FFF5E0",
    primary: "#C9A84C",
    primaryForeground: "#100C00",
    secondary: "#2A2000",
    secondaryForeground: "#E0C880",
    muted: "#1E1700",
    mutedForeground: "#857040",
    accent: "#9A7020",
    accentForeground: "#FFF5E0",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#382A00",
    input: "#382A00",
    morning: "#C9A84C",
    afternoon: "#D4B86A",
    evening: "#9A7020",
    gradientStart: "#100C00",
    gradientMid: "#1C1500",
    gradientEnd: "#0D0A00",
    crystalGradient: ["#2A1800", "#7A4A00", "#C9A84C", "#E8CC88"],
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  silver: {
    text: "#E8EEF4",
    tint: "#C8D4DE",
    background: "#0D1118",
    foreground: "#E8EEF4",
    card: "#161F2B",
    cardForeground: "#E8EEF4",
    primary: "#C8D4DE",
    primaryForeground: "#0D1118",
    secondary: "#1E2D3E",
    secondaryForeground: "#A8B8C8",
    muted: "#161F2B",
    mutedForeground: "#6A7A8A",
    accent: "#8A9AB0",
    accentForeground: "#E8EEF4",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#253545",
    input: "#253545",
    morning: "#FDE68A",
    afternoon: "#C8D4DE",
    evening: "#8A9AB0",
    gradientStart: "#0D1118",
    gradientMid: "#101820",
    gradientEnd: "#0B0F18",
    crystalGradient: ["#1A2030", "#3D4F6A", "#C8D4DE", "#E8EEF4"],
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  white: {
    text: "#FAFAF8",
    tint: "#E0E0D8",
    background: "#11100D",
    foreground: "#FAFAF8",
    card: "#1D1C18",
    cardForeground: "#FAFAF8",
    primary: "#E0E0D8",
    primaryForeground: "#11100D",
    secondary: "#262520",
    secondaryForeground: "#D0CFC8",
    muted: "#1D1C18",
    mutedForeground: "#7A7870",
    accent: "#B8B8B0",
    accentForeground: "#FAFAF8",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#302E28",
    input: "#302E28",
    morning: "#FDE68A",
    afternoon: "#E0E0D8",
    evening: "#B8B8B0",
    gradientStart: "#11100D",
    gradientMid: "#191815",
    gradientEnd: "#0D0C0A",
    crystalGradient: ["#1A1A18", "#3A3A36", "#C0C0BC", "#F0F0EC"],
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  black: {
    text: "#E0E0E0",
    tint: "#808080",
    background: "#000000",
    foreground: "#E0E0E0",
    card: "#0F0F0F",
    cardForeground: "#E0E0E0",
    primary: "#909090",
    primaryForeground: "#000000",
    secondary: "#181818",
    secondaryForeground: "#C0C0C0",
    muted: "#0F0F0F",
    mutedForeground: "#555555",
    accent: "#606060",
    accentForeground: "#E0E0E0",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#1F1F1F",
    input: "#1F1F1F",
    morning: "#B8B8B8",
    afternoon: "#909090",
    evening: "#606060",
    gradientStart: "#000000",
    gradientMid: "#050505",
    gradientEnd: "#020202",
    crystalGradient: ["#0F0F0F", "#282828", "#6A6A6A", "#B0B0B0"],
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },

  blue: {
    text: "#E8F2FF",
    tint: "#60A5FA",
    background: "#030B18",
    foreground: "#E8F2FF",
    card: "#071828",
    cardForeground: "#E8F2FF",
    primary: "#60A5FA",
    primaryForeground: "#030B18",
    secondary: "#0D2040",
    secondaryForeground: "#93C5FD",
    muted: "#071828",
    mutedForeground: "#4A7A9E",
    accent: "#2563EB",
    accentForeground: "#E8F2FF",
    destructive: "#F87171",
    destructiveForeground: "#ffffff",
    border: "#0F2A48",
    input: "#0F2A48",
    morning: "#FDE68A",
    afternoon: "#60A5FA",
    evening: "#2563EB",
    gradientStart: "#030B18",
    gradientMid: "#051428",
    gradientEnd: "#020910",
    crystalGradient: ["#030B18", "#0D2A5A", "#3B82F6", "#93C5FD"],
    success: "#6EE7B7",
    successForeground: "#064E3B",
  },
};

export const THEME_META: Record<ThemeName, { label: string; swatch: string }> = {
  indigo:           { label: "Indigo",         swatch: "#A78BFA" },
  "rose-gold":      { label: "Rose Gold",      swatch: "#F4A7B9" },
  forest:           { label: "Forest",         swatch: "#4ADE80" },
  "celestial-gold": { label: "Celestial Gold", swatch: "#C9A84C" },
  silver:           { label: "Silver",         swatch: "#C8D4DE" },
  white:            { label: "White",          swatch: "#D8D8D0" },
  black:            { label: "Black",          swatch: "#404040" },
  blue:             { label: "Blue",           swatch: "#60A5FA" },
};

const colors = {
  light: palettes.indigo,
  radius: 16,
};

export default colors;
