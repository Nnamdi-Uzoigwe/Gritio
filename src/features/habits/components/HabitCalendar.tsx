import { AppText } from "@/components/ui/AppText";
import {
    daysInMonth,
    formatLongDate,
    fromDateKey,
    monthLabel,
    toDateKey,
} from "@/lib/dates";
import { isScheduledOn } from "@/lib/habitDays";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import type { HabitItem } from "@/types/habits";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  habit: HabitItem;
  today: string;
  editable: boolean;
  onSelectDay: (date: string) => void;
};

function LegendItem({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      {children}
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

/**
 * Month view of the habit's history. Done days are gold, minimum days a lighter gold,
 * scheduled days without a completion are a quiet ring (never red), other days are plain.
 */
export function HabitCalendar({ habit, today, editable, onSelectDay }: Props) {
  const { colors } = useTheme();
  const todayDate = fromDateKey(today);
  const startDate = fromDateKey(habit.startDate);
  const [view, setView] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
  });
  const byDate = useMemo(
    () => new Map(habit.completions.map((c) => [c.date, c.level])),
    [habit.completions],
  );

  const atCurrentMonth =
    view.year === todayDate.getFullYear() &&
    view.month === todayDate.getMonth();
  const canGoBack =
    view.year > startDate.getFullYear() ||
    (view.year === startDate.getFullYear() &&
      view.month > startDate.getMonth());

  const shift = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const count = daysInMonth(view.year, view.month);
  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // Monday first
  const cells: Array<number | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={!canGoBack}
          onPress={() => shift(-1)}
          style={[styles.nav, !canGoBack && styles.navDisabled]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <AppText variant="titleM">{monthLabel(view.year, view.month)}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={atCurrentMonth}
          onPress={() => shift(1)}
          style={[styles.nav, atCurrentMonth && styles.navDisabled]}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEK_LABELS.map((label, i) => (
          <View key={i} style={styles.cell}>
            <AppText variant="caption" tone="muted">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cell} />;
            const key = toDateKey(new Date(view.year, view.month, day));
            const level = byDate.get(key);
            const inRange = key >= habit.startDate && key <= today;
            const scheduled = isScheduledOn(habit, key);
            const isToday = key === today;
            const tappable = editable && inRange;

            const state =
              level === "target"
                ? "done"
                : level === "minimum"
                  ? "done, minimum version"
                  : scheduled && inRange
                    ? "scheduled, not done"
                    : "not scheduled";

            let circleStyle: object = {};
            let tone: "default" | "muted" | "onPrimary" = inRange
              ? "default"
              : "muted";
            if (level === "target") {
              circleStyle = { backgroundColor: colors.primary };
              tone = "onPrimary";
            } else if (level === "minimum") {
              circleStyle = {
                backgroundColor: colors.primarySoft,
                borderWidth: 1.5,
                borderColor: colors.primary,
              };
            } else if (scheduled && inRange) {
              circleStyle = {
                borderWidth: isToday ? 2 : 1.5,
                borderColor: isToday ? colors.primary : colors.textMuted,
              };
            } else if (isToday) {
              circleStyle = { borderWidth: 1.5, borderColor: colors.border };
            }

            return (
              <Pressable
                key={di}
                accessibilityRole="button"
                accessibilityLabel={`${formatLongDate(key)}. ${state}.${tappable ? " Tap to edit." : ""}`}
                accessibilityState={{ disabled: !tappable }}
                disabled={!tappable}
                onPress={() => onSelectDay(key)}
                style={[styles.cell, !inRange && !level && styles.faded]}
              >
                <View style={[styles.day, circleStyle]}>
                  <AppText variant="body" tone={tone}>
                    {day}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <LegendItem label="Done">
          <View style={[styles.swatch, { backgroundColor: colors.primary }]} />
        </LegendItem>
        {habit.minimumLabel ? (
          <LegendItem label="Minimum">
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: colors.primarySoft,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                },
              ]}
            />
          </LegendItem>
        ) : null}
        <LegendItem label="Scheduled">
          <View
            style={[
              styles.swatch,
              { borderWidth: 1.5, borderColor: colors.textMuted },
            ]}
          />
        </LegendItem>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  nav: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navDisabled: { opacity: 0.3 },
  row: { flexDirection: "row" },
  cell: { flex: 1, height: 46, alignItems: "center", justifyContent: "center" },
  faded: { opacity: 0.45 },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  legend: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  swatch: { width: 14, height: 14, borderRadius: 7 },
});
