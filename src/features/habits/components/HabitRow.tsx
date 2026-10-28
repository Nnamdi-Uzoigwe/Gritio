import { AppText } from "@/components/ui/AppText";
import { CheckCircle } from "@/components/ui/CheckCircle";
import { Chip } from "@/components/ui/Chip";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { FOCUS_AREAS, type IconName } from "@/lib/focusAreas";
import { isScheduledOn, summarizeSchedule } from "@/lib/habitDays";
import { computeHabitStats } from "@/lib/habitStats";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing } from "@/theme/tokens";
import type { HabitItem } from "@/types/habits";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { WeekDots } from "./WeekDots";

type Props = {
  habit: HabitItem;
  today: string;
  swipeLabel: string;
  swipeIcon: IconName;
  onSwipe: () => void;
  onOpen: () => void;
  onToggleToday: () => void;
};

export function HabitRow({
  habit,
  today,
  swipeLabel,
  swipeIcon,
  onSwipe,
  onOpen,
  onToggleToday,
}: Props) {
  const { colors } = useTheme();
  const active = habit.status === "active";
  const area = habit.category
    ? FOCUS_AREAS.find((a) => a.id === habit.category)
    : undefined;
  const tint = habit.category
    ? focusAreaTints[habit.category]
    : colors.textMuted;
  const scheduledToday = active && isScheduledOn(habit, today);
  const doneToday = habit.completions.some((c) => c.date === today);

  const stats = useMemo(
    () =>
      computeHabitStats({
        weekdays: habit.weekdays,
        startDate: habit.startDate,
        completionDates: habit.completions.map((c) => c.date),
        today,
      }),
    [habit.weekdays, habit.startDate, habit.completions, today],
  );

  const schedule = `${summarizeSchedule(habit.weekdays)}${habit.timeOfDay ? `, ${formatTime12(habit.timeOfDay)}` : ""}`;

  return (
    <SwipeableRow
      postponeLabel={swipeLabel}
      postponeIcon={swipeIcon}
      postponeTone="primary"
      onPostpone={onSwipe}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}. ${schedule}. Open habit.`}
        accessibilityHint={`Swipe left to ${swipeLabel.toLowerCase()}`}
        onPress={onOpen}
        style={styles.row}
      >
        <View style={[styles.icon, { backgroundColor: `${tint}22` }]}>
          <Ionicons
            name={area?.icon ?? "repeat-outline"}
            size={22}
            color={tint}
          />
        </View>

        <View style={styles.text}>
          <AppText variant="titleM" numberOfLines={2}>
            {habit.name}
          </AppText>
          <AppText variant="caption" tone="muted">
            {schedule}
          </AppText>
          <View style={styles.dotsRow}>
            <WeekDots habit={habit} today={today} />
            {active && stats.currentStreak >= 2 ? (
              <Chip
                label={`${stats.currentStreak} in a row`}
                icon="flame-outline"
              />
            ) : null}
          </View>
        </View>

        {scheduledToday ? (
          <CheckCircle
            checked={doneToday}
            label={
              doneToday
                ? `Mark ${habit.name} as not done today`
                : `Mark ${habit.name} as done today`
            }
            onPress={onToggleToday}
          />
        ) : null}
      </Pressable>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: spacing.xs },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
    marginTop: 2,
  },
});
