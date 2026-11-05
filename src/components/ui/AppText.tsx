import { useTheme } from "@/theme/ThemeProvider";
import {
  FIXED_TEXT_SCALE_CAP,
  textScaleCaps,
  typography,
  type ColorTokens,
} from "@/theme/tokens";
import { Text, type TextProps } from "react-native";

export type TextVariant = keyof typeof typography;
export type TextTone =
  | "default"
  | "secondary"
  | "muted"
  | "accent"
  | "onPrimary"
  | "success"
  | "error";

const toneKey: Record<TextTone, keyof ColorTokens> = {
  default: "text",
  secondary: "textSecondary",
  muted: "textMuted",
  accent: "primaryText",
  onPrimary: "onPrimary",
  success: "success",
  error: "error",
};

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  /** Cap growth at 1.3x. For text inside a fixed shape that cannot get taller. */
  fixed?: boolean;
  /** Announced as a heading by screen readers. */
  heading?: boolean;
};

/** The only place fonts are applied. Screens never set fontFamily themselves. */
export function AppText({
  variant = "body",
  tone = "default",
  fixed = false,
  heading = false,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={
        fixed ? FIXED_TEXT_SCALE_CAP : textScaleCaps[variant]
      }
      accessibilityRole={heading ? "header" : undefined}
      style={[typography[variant], { color: colors[toneKey[tone]] }, style]}
      {...rest}
    />
  );
}
