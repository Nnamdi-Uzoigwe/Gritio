import { useTheme } from "@/theme/ThemeProvider";
import { typography, type ColorTokens } from "@/theme/tokens";
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

type AppTextProps = TextProps & { variant?: TextVariant; tone?: TextTone };

/** The only place fonts are applied. Screens never set fontFamily themselves. */
export function AppText({
  variant = "body",
  tone = "default",
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      style={[typography[variant], { color: colors[toneKey[tone]] }, style]}
      {...rest}
    />
  );
}
