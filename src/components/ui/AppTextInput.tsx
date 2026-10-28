import { useTheme } from "@/theme/ThemeProvider";
import { spacing, typography } from "@/theme/tokens";
import { useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import type { TextVariant } from "./AppText";

type Props = TextInputProps & { variant?: TextVariant };

export function AppTextInput({
  variant = "body",
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      maxFontSizeMultiplier={1.4}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      cursorColor={colors.primary}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        typography[variant],
        styles.input,
        {
          color: colors.text,
          borderBottomColor: focused ? colors.primary : colors.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: { paddingVertical: spacing.md, borderBottomWidth: 2 },
});
