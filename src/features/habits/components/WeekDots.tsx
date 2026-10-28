import { addDays } from "@/lib/dates";
import { isScheduledOn } from "@/lib/habitDays";
import { useTheme } from "@/theme/ThemeProvider";
import type { HabitItem } from "@/types/habits";
import { StyleSheet, View } from "react-native";

type Props = { habit: HabitItem; today: string };

/** The last 7 days, today on the right. Filled is done, a ring is scheduled, a speck is not scheduled. */
export function WeekDots({ habit, today }: Props) {
  const { colors } = useTheme();
  const byDate = new Map(habit.completions.map((c) => [c.date, c.level]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  let scheduled = 0;
  let done = 0;
  const dots = days.map((key) => {
    const isScheduled = isScheduledOn(habit, key);
    const level = byDate.get(key);
    if (isScheduled) scheduled += 1;
    if (level) done += 1;
    return { key, isScheduled, level, isToday: key === today };
  });

  return (
    <View
      accessible
      accessibilityLabel={`Last 7 days: ${done} done out of ${scheduled} scheduled`}
      style={styles.row}
    >
      {dots.map((d) => {
        if (d.level === "target") {
          return (
            <View
              key={d.key}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            />
          );
        }
        if (d.level === "minimum") {
          return (
            <View
              key={d.key}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
            />
          );
        }
        if (d.isScheduled) {
          return (
            <View
              key={d.key}
              style={[
                styles.dot,
                {
                  borderColor: d.isToday ? colors.primary : colors.textMuted,
                  borderWidth: d.isToday ? 2 : 1.5,
                },
              ]}
            />
          );
        }
        return (
          <View key={d.key} style={styles.speckSlot}>
            <View style={[styles.speck, { backgroundColor: colors.border }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  speckSlot: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  speck: { width: 5, height: 5, borderRadius: 3 },
});
