import type { FocusAreaId } from "@/types/domain";
import type { TextStyle } from "react-native";

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceSunken: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string; // fills, rings, icons
  onPrimary: string; // text on top of primary
  primaryText: string; // gold used as text on background
  primarySoft: string;
  success: string;
  onSuccess: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: "#F7F6F2",
  surface: "#FFFFFF",
  surfaceSunken: "#F0EEE8",
  border: "#E5E5E0",
  text: "#222222",
  textSecondary: "#5F5B54",
  textMuted: "#77736B",
  primary: "#C49A45",
  onPrimary: "#222222",
  primaryText: "#8A6A1F",
  primarySoft: "#F3E8D0",
  success: "#347A57",
  onSuccess: "#FFFFFF",
  successSoft: "#E8F5EC",
  warning: "#B4570A",
  warningSoft: "#FBEBDD",
  error: "#C24141",
  errorSoft: "#FBE9E9",
  overlay: "rgba(34, 34, 34, 0.45)",
};

export const darkColors: ColorTokens = {
  background: "#141414",
  surface: "#1E1E1E",
  surfaceSunken: "#262626",
  border: "#333333",
  text: "#F3F1EC",
  textSecondary: "#B8B3A9",
  textMuted: "#8C877E",
  primary: "#D4AA55",
  onPrimary: "#1A1A1A",
  primaryText: "#D4AA55",
  primarySoft: "#2E2616",
  success: "#4CAF7D",
  onSuccess: "#0F1F17",
  successSoft: "#1B2E24",
  warning: "#E08A3C",
  warningSoft: "#33261A",
  error: "#E06B6B",
  errorSoft: "#3A2020",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const touch = { minTarget: 48 } as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
} as const;

export const typography = {
  displayXL: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  displayL: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  displayM: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  titleL: { fontFamily: fonts.bodySemiBold, fontSize: 20, lineHeight: 26 },
  titleM: { fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
} as const satisfies Record<string, TextStyle>;

export const motion = {
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    snappy: { damping: 14, stiffness: 320, mass: 0.8 },
  },
  duration: { fast: 120, base: 220, slow: 420 },
} as const;

/** Muted tints for small chips, icons and card edges. Use with alpha, e.g. `${tint}22`. */
export const focusAreaTints: Record<FocusAreaId, string> = {
  discipline: "#7B6F5E",
  health: "#3F8F6B",
  learning: "#4A7FB0",
  career: "#7A5FA8",
  productivity: "#C07A2C",
  reading: "#A5566B",
  finance: "#3F7F86",
  routines: "#8A8F3E",
  other: "#77736B",
};
