import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { formatLongDate } from "@/lib/dates";
import { isScheduledOn } from "@/lib/habitDays";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { HabitLevel } from "@/types/domain";
import type { HabitItem } from "@/types/habits";
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  date: string | null;
  habit: HabitItem;
  onClose: () => void;
  onPick: (date: string, level: HabitLevel | null) => void;
};

type Option = {
  key: string;
  level: HabitLevel | null;
  title: string;
  text: string;
};

export function DayEditSheet({ visible, date, habit, onClose, onPick }: Props) {
  const { colors } = useTheme();
  const last = useRef<string | null>(date);
  if (date) last.current = date;
  const shown = date ?? last.current;
  if (!shown) return null;

  const current =
    habit.completions.find((c) => c.date === shown)?.level ?? null;
  const scheduled = isScheduledOn(habit, shown);

  const options: Option[] = [
    {
      key: "target",
      level: "target",
      title: habit.minimumLabel ? "Target" : "Done",
      text: habit.targetLabel ?? "I did it",
    },
    ...(habit.minimumLabel
      ? [
          {
            key: "minimum",
            level: "minimum" as const,
            title: "Minimum",
            text: habit.minimumLabel,
          },
        ]
      : []),
    {
      key: "none",
      level: null,
      title: "Not done",
      text: "No completion recorded for this day",
    },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={formatLongDate(shown)}
    >
      <View style={styles.body}>
        <AppText variant="bodySmall" tone="secondary">
          {scheduled
            ? "A scheduled day."
            : "Not a scheduled day. You can still record it."}
        </AppText>
        {options.map((option) => {
          const selected = option.level === current;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.title}: ${option.text}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onPick(shown, option.level);
              }}
              style={[
                styles.option,
                {
                  backgroundColor: selected
                    ? colors.primarySoft
                    : colors.surfaceSunken,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText variant="caption" tone={selected ? "accent" : "muted"}>
                {option.title.toUpperCase()}
              </AppText>
              <AppText variant="titleM">{option.text}</AppText>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  option: {
    minHeight: touch.minTarget + 8,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: 2,
  },
});
