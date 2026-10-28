import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

type Props = {
  label: string;
  icon?: IconName;
  tint?: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Static when no onPress is given (a label), pressable otherwise (an option). */
export function Chip({
  label,
  icon,
  tint,
  selected = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const accent = tint ?? colors.textSecondary;
  const interactive = onPress !== undefined;

  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={interactive ? 16 : 13}
          color={selected ? colors.onPrimary : accent}
        />
      ) : null}
      <AppText
        variant="caption"
        tone={selected ? "onPrimary" : "secondary"}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </AppText>
    </>
  );

  const base = [
    styles.base,
    interactive ? styles.interactive : styles.static,
    {
      backgroundColor: selected
        ? colors.primary
        : interactive
          ? colors.surfaceSunken
          : `${accent}1A`,
    },
  ];

  if (!interactive) return <View style={base}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={base}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  static: { paddingHorizontal: spacing.sm, height: 24, maxWidth: 200 },
  interactive: { paddingHorizontal: spacing.lg, height: 40 },
  label: { flexShrink: 1 },
});
