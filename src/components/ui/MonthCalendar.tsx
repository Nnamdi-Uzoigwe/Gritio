import { daysInMonth, fromDateKey, monthLabel, toDateKey } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  value: string | null;
  minDate: string;
  onSelect: (date: string) => void;
};

export function MonthCalendar({ value, minDate, onSelect }: Props) {
  const { colors } = useTheme();
  const today = toDateKey();
  const anchor = fromDateKey(value ?? minDate);
  const minAnchor = fromDateKey(minDate);
  const [view, setView] = useState({
    year: anchor.getFullYear(),
    month: anchor.getMonth(),
  });

  const canGoBack =
    view.year > minAnchor.getFullYear() ||
    (view.year === minAnchor.getFullYear() &&
      view.month > minAnchor.getMonth());

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
          onPress={() => shift(1)}
          style={styles.nav}
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
            const disabled = key < minDate;
            const selected = key === value;
            const isToday = key === today;
            return (
              <Pressable
                key={di}
                accessibilityRole="button"
                accessibilityLabel={key}
                accessibilityState={{ disabled, selected }}
                disabled={disabled}
                onPress={() => onSelect(key)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.day,
                    selected && { backgroundColor: colors.primary },
                    !selected &&
                      isToday && {
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      },
                  ]}
                >
                  <AppText
                    variant="body"
                    tone={
                      selected ? "onPrimary" : disabled ? "muted" : "default"
                    }
                    style={disabled ? styles.disabledText : undefined}
                  >
                    {day}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
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
  cell: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledText: { opacity: 0.45 },
});
