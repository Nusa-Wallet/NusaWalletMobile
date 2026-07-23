// Palette derived from the Figma "BI Design" mockups (navy primary + blue accent).
// Semantic layer inspired by Rainbow's token system (label, fill, surface, etc.)

export const palette = {
  navy50: "#0E2148",
  navy40: "#1A3366",
  navy30: "#2A4A8A",
  blue50: "#2563EB",
  blue40: "#3B82F6",
  blue30: "#60A5FA",
  blue10: "#DBEAFE",
  green50: "#16A34A",
  green40: "#22C55E",
  green10: "#DCFCE7",
  red50: "#DC2626",
  red40: "#EF4444",
  red10: "#FEE2E2",
  amber50: "#D97706",
  amber40: "#F59E0B",
  amber10: "#FEF3C7",
  slate900: "#0F172A",
  slate800: "#1E293B",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// Semantic tokens — inspired by Rainbow pattern: label, surface, fill, separator
export const colors = {
  primary: palette.navy50,
  accent: palette.blue50,
  background: palette.slate100,
  card: palette.white,

  textPrimary: palette.slate900,
  textSecondary: palette.slate500,
  textTertiary: palette.slate400,

  border: palette.slate200,
  separator: palette.slate200,

  success: palette.green50,
  danger: palette.red50,
  warning: palette.amber50,

  surfacePrimary: palette.white,
  surfaceSecondary: palette.slate50,
  fill: palette.slate100,
  fillStrong: palette.slate200,

  label: palette.slate900,
  labelSecondary: palette.slate500,
  labelTertiary: palette.slate400,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 44,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
