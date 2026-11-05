import { useTheme } from "@/theme/ThemeProvider";
import { spacing, textScaleCaps, touch, typography } from "@/theme/tokens";
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
      maxFontSizeMultiplier={textScaleCaps[variant]}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primaryGraphic}
      cursorColor={colors.primaryGraphic}
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
          borderBottomColor: focused
            ? colors.primaryGraphic
            : colors.inputBorder,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    minHeight: touch.minTarget,
  },
});
