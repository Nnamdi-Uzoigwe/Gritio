// import type { FocusAreaId } from "@/types/domain";
// import type { TextStyle } from "react-native";

// export type ColorTokens = {
//   background: string;
//   surface: string;
//   surfaceSunken: string;
//   border: string; // decorative dividers and card edges
//   inputBorder: string; // input underlines, strong enough to see (3:1)
//   text: string;
//   textSecondary: string;
//   textMuted: string;
//   primary: string; // button fills and icons on dark text
//   onPrimary: string; // text on top of primary
//   primaryText: string; // gold used as text
//   primaryGraphic: string; // gold used for rings, bars and charts (3:1 on surfaces)
//   primarySoft: string;
//   success: string;
//   onSuccess: string;
//   successSoft: string;
//   warning: string;
//   warningSoft: string;
//   error: string;
//   errorSoft: string;
//   overlay: string;
// };

// export const lightColors: ColorTokens = {
//   background: "#F7F6F2",
//   surface: "#FFFFFF",
//   surfaceSunken: "#F0EEE8",
//   border: "#E5E5E0",
//   inputBorder: "#8A867E",
//   text: "#222222",
//   textSecondary: "#5F5B54",
//   textMuted: "#6B675F",
//   primary: "#C49A45",
//   onPrimary: "#222222",
//   primaryText: "#7A5C18",
//   primaryGraphic: "#A47B26",
//   primarySoft: "#F3E8D0",
//   success: "#347A57",
//   onSuccess: "#FFFFFF",
//   successSoft: "#E8F5EC",
//   warning: "#A84F06",
//   warningSoft: "#FBEBDD",
//   error: "#B83A3A",
//   errorSoft: "#FBE9E9",
//   overlay: "rgba(34, 34, 34, 0.45)",
// };

// export const darkColors: ColorTokens = {
//   background: "#141414",
//   surface: "#1E1E1E",
//   surfaceSunken: "#262626",
//   border: "#333333",
//   inputBorder: "#6F6B64",
//   text: "#F3F1EC",
//   textSecondary: "#B8B3A9",
//   textMuted: "#9A958B",
//   primary: "#D4AA55",
//   onPrimary: "#1A1A1A",
//   primaryText: "#D4AA55",
//   primaryGraphic: "#D4AA55",
//   primarySoft: "#2E2616",
//   success: "#4CAF7D",
//   onSuccess: "#0F1F17",
//   successSoft: "#1B2E24",
//   warning: "#E08A3C",
//   warningSoft: "#33261A",
//   error: "#E06B6B",
//   errorSoft: "#3A2020",
//   overlay: "rgba(0, 0, 0, 0.6)",
// };

// export const spacing = {
//   xs: 4,
//   sm: 8,
//   md: 12,
//   lg: 16,
//   xl: 24,
//   xxl: 32,
//   xxxl: 48,
// } as const;
// export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;
// /** minTarget is the comfortable size, minInteractive is the smallest anything tappable may be. */
// export const touch = { minTarget: 48, minInteractive: 44 } as const;

// export const fonts = {
//   display: "Fraunces_600SemiBold",
//   displayBold: "Fraunces_700Bold",
//   body: "Inter_400Regular",
//   bodyMedium: "Inter_500Medium",
//   bodySemiBold: "Inter_600SemiBold",
// } as const;

// export const typography = {
//   displayXL: {
//     fontFamily: fonts.displayBold,
//     fontSize: 40,
//     lineHeight: 46,
//     letterSpacing: -0.6,
//   },
//   displayL: {
//     fontFamily: fonts.displayBold,
//     fontSize: 32,
//     lineHeight: 38,
//     letterSpacing: -0.4,
//   },
//   displayM: {
//     fontFamily: fonts.display,
//     fontSize: 26,
//     lineHeight: 32,
//     letterSpacing: -0.2,
//   },
//   titleL: { fontFamily: fonts.bodySemiBold, fontSize: 20, lineHeight: 26 },
//   titleM: { fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 24 },
//   body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
//   bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
//   label: {
//     fontFamily: fonts.bodySemiBold,
//     fontSize: 14,
//     lineHeight: 18,
//     letterSpacing: 0.2,
//   },
//   caption: {
//     fontFamily: fonts.bodyMedium,
//     fontSize: 12,
//     lineHeight: 16,
//     letterSpacing: 0.3,
//   },
// } as const satisfies Record<string, TextStyle>;

// /**
//  * How far each kind of text may grow with the phone's text size setting.
//  * Reading text grows up to 2x and wraps. Very large display text is already big, so it stops sooner.
//  */
// export const textScaleCaps: Record<keyof typeof typography, number> = {
//   displayXL: 1.3,
//   displayL: 1.5,
//   displayM: 1.5,
//   titleL: 2,
//   titleM: 2,
//   body: 2,
//   bodySmall: 2,
//   label: 2,
//   caption: 1.6,
// };

// /** For text that sits inside a fixed shape: tab labels, static chips, wheel rows and chart labels. */
// export const FIXED_TEXT_SCALE_CAP = 1.3;

// export const motion = {
//   spring: {
//     gentle: { damping: 18, stiffness: 180, mass: 1 },
//     snappy: { damping: 14, stiffness: 320, mass: 0.8 },
//   },
//   duration: { fast: 120, base: 220, slow: 420 },
// } as const;

// /** Muted tints for small chips, icons and card edges on light surfaces. Use with alpha, e.g. `${tint}22`. */
// export const focusAreaTints: Record<FocusAreaId, string> = {
//   discipline: "#7B6F5E",
//   health: "#3F8F6B",
//   learning: "#4A7FB0",
//   career: "#7A5FA8",
//   productivity: "#B0691E",
//   reading: "#A5566B",
//   finance: "#3F7F86",
//   routines: "#8A8F3E",
//   other: "#77736B",
// };

// /** The same areas, lighter, so icons keep their contrast on dark surfaces. */
// export const focusAreaTintsDark: Record<FocusAreaId, string> = {
//   discipline: "#B5A78F",
//   health: "#5FBF8F",
//   learning: "#6FA8DC",
//   career: "#A68BD8",
//   productivity: "#E0A050",
//   reading: "#D98AA0",
//   finance: "#5FB5BD",
//   routines: "#B5BA5C",
//   other: "#9A958B",
// };

// export function focusTint(id: FocusAreaId, isDark: boolean): string {
//   return isDark ? focusAreaTintsDark[id] : focusAreaTints[id];
// }

import type { FocusAreaId } from "@/types/domain";
import type { TextStyle } from "react-native";

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceSunken: string;
  border: string;
  inputBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primaryText: string;
  primaryGraphic: string;
  primarySoft: string;
  success: string;
  onSuccess: string;
  successSoft: string;
  warning: string;
  onWarning: string;
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
  inputBorder: "#8A867E",
  text: "#222222",
  textSecondary: "#5F5B54",
  textMuted: "#6B675F",
  primary: "#C49A45",
  onPrimary: "#222222",
  primaryText: "#7A5C18",
  primaryGraphic: "#A47B26",
  primarySoft: "#F3E8D0",
  success: "#347A57",
  onSuccess: "#FFFFFF",
  successSoft: "#E8F5EC",
  warning: "#A84F06",
  onWarning: "#FFFFFF",
  warningSoft: "#FBEBDD",
  error: "#B83A3A",
  errorSoft: "#FBE9E9",
  overlay: "rgba(34, 34, 34, 0.45)",
};

export const darkColors: ColorTokens = {
  background: "#141414",
  surface: "#1E1E1E",
  surfaceSunken: "#262626",
  border: "#333333",
  inputBorder: "#6F6B64",
  text: "#F3F1EC",
  textSecondary: "#B8B3A9",
  textMuted: "#9A958B",
  primary: "#D4AA55",
  onPrimary: "#1A1A1A",
  primaryText: "#D4AA55",
  primaryGraphic: "#D4AA55",
  primarySoft: "#2E2616",
  success: "#4CAF7D",
  onSuccess: "#0F1F17",
  successSoft: "#1B2E24",
  warning: "#E08A3C",
  onWarning: "#1A1A1A",
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

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** minTarget is the comfortable size, minInteractive is the smallest anything tappable may be. */
export const touch = {
  minTarget: 48,
  minInteractive: 44,
} as const;

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
  titleL: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  titleM: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
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

/**
 * How far each kind of text may grow with the phone's text size setting.
 * Reading text grows up to 2x and wraps. Very large display text is already big, so it stops sooner.
 */
export const textScaleCaps: Record<keyof typeof typography, number> = {
  displayXL: 1.3,
  displayL: 1.5,
  displayM: 1.5,
  titleL: 2,
  titleM: 2,
  body: 2,
  bodySmall: 2,
  label: 2,
  caption: 1.6,
};

/** For text that sits inside a fixed shape: tab labels, static chips, wheel rows and chart labels. */
export const FIXED_TEXT_SCALE_CAP = 1.3;

export const motion = {
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    snappy: { damping: 14, stiffness: 320, mass: 0.8 },
  },
  duration: { fast: 120, base: 220, slow: 420 },
} as const;

/** Muted tints for small chips, icons and card edges on light surfaces. Use with alpha, e.g. `${tint}22`. */
export const focusAreaTints: Record<FocusAreaId, string> = {
  discipline: "#7B6F5E",
  health: "#3F8F6B",
  learning: "#4A7FB0",
  career: "#7A5FA8",
  productivity: "#B0691E",
  reading: "#A5566B",
  finance: "#3F7F86",
  routines: "#8A8F3E",
  other: "#77736B",
};

/** The same areas, lighter, so icons keep their contrast on dark surfaces. */
export const focusAreaTintsDark: Record<FocusAreaId, string> = {
  discipline: "#B5A78F",
  health: "#5FBF8F",
  learning: "#6FA8DC",
  career: "#A68BD8",
  productivity: "#E0A050",
  reading: "#D98AA0",
  finance: "#5FB5BD",
  routines: "#B5BA5C",
  other: "#9A958B",
};

export function focusTint(id: FocusAreaId, isDark: boolean): string {
  return isDark ? focusAreaTintsDark[id] : focusAreaTints[id];
}
