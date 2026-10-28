import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { HabitLevel } from "@/types/domain";
import type { HabitLevels } from "@/types/today";
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  habitName: string;
  levels: HabitLevels | null;
  onClose: () => void;
  onPick: (level: HabitLevel) => void;
};

export function HabitLevelSheet({
  visible,
  habitName,
  levels,
  onClose,
  onPick,
}: Props) {
  const { colors } = useTheme();
  const last = useRef<HabitLevels | null>(levels);
  if (levels) last.current = levels;
  const shown = levels ?? last.current;

  const pick = (level: HabitLevel) => {
    Haptics.selectionAsync().catch(() => {});
    onPick(level);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="What did you do?">
      <View style={styles.body}>
        <AppText tone="secondary">{habitName}</AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Target: ${shown?.target ?? "the full habit"}`}
          onPress={() => pick("target")}
          style={[
            styles.option,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
            },
          ]}
        >
          <AppText variant="caption" tone="accent">
            TARGET
          </AppText>
          <AppText variant="titleM">
            {shown?.target ?? "The full habit"}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Minimum: ${shown?.minimum ?? ""}`}
          onPress={() => pick("minimum")}
          style={[
            styles.option,
            {
              backgroundColor: colors.surfaceSunken,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText variant="caption" tone="muted">
            MINIMUM
          </AppText>
          <AppText variant="titleM">{shown?.minimum ?? ""}</AppText>
          <AppText variant="bodySmall" tone="secondary">
            On a hard day, this still counts. Showing up is what matters.
          </AppText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  option: {
    minHeight: touch.minTarget + 16,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
});
