import { AppText } from "@/components/ui/AppText";
import { formatShortDate, fromDateKey } from "@/lib/dates";
import { WEEKDAY_LETTER } from "@/lib/habitDays";
import type { DayStat, PeriodKind } from "@/lib/progressStats";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const MAX_HEIGHT = 112;

type BarProps = {
  stat: DayStat;
  isToday: boolean;
  selected: boolean;
  label: string;
  compact: boolean;
  onPress: () => void;
};

function Bar({ stat, isToday, selected, label, compact, onPress }: BarProps) {
  const { colors } = useTheme();
  const fraction = stat.total > 0 ? stat.done / stat.total : 0;
  const target =
    stat.isFuture || stat.total === 0 ? 0 : Math.max(6, fraction * MAX_HEIGHT);
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(target, { duration: 450 });
  }, [target, height]);

  const barStyle = useAnimatedStyle(() => ({ height: height.value }));
  const color =
    stat.total > 0 && stat.done === stat.total
      ? colors.success
      : stat.done > 0
        ? colors.primary
        : colors.border;
  const a11y = stat.isFuture
    ? `${formatShortDate(stat.date)}. Not here yet.`
    : stat.total === 0
      ? `${formatShortDate(stat.date)}. Nothing scheduled.`
      : `${formatShortDate(stat.date)}. ${stat.done} of ${stat.total} done.`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={stat.isFuture}
      onPress={onPress}
      style={styles.col}
    >
      <View style={styles.barArea}>
        {stat.total === 0 && !stat.isFuture ? (
          <View style={[styles.speck, { backgroundColor: colors.border }]} />
        ) : null}
        <Animated.View
          style={[
            styles.bar,
            compact && styles.barCompact,
            { backgroundColor: color },
            selected && { borderWidth: 2, borderColor: colors.text },
            barStyle,
          ]}
        />
      </View>
      <AppText
        variant="caption"
        tone={isToday ? "accent" : "muted"}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

type Props = {
  days: DayStat[];
  today: string;
  kind: PeriodKind;
  selected: string | null;
  onSelect: (date: string | null) => void;
};

/** One bar per day, drawn with plain views. Tap a bar to see that day's numbers. */
export function DayBars({ days, today, kind, selected, onSelect }: Props) {
  const compact = kind === "month";

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {days.map((stat) => {
        const d = fromDateKey(stat.date);
        const label = compact
          ? d.getDate() === 1 || d.getDate() % 5 === 0
            ? String(d.getDate())
            : ""
          : WEEKDAY_LETTER[d.getDay()];
        return (
          <Bar
            key={stat.date}
            stat={stat}
            isToday={stat.date === today}
            selected={selected === stat.date}
            label={label}
            compact={compact}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelect(selected === stat.date ? null : stat.date);
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  rowCompact: { gap: 2 },
  col: { flex: 1, alignItems: "center", gap: spacing.xs },
  barArea: {
    height: MAX_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: { width: "70%", maxWidth: 30, minWidth: 4, borderRadius: 8 },
  barCompact: { width: "80%", borderRadius: 3 },
  speck: {
    position: "absolute",
    bottom: 0,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
