import { AppText } from "@/components/ui/AppText";
import { CountUp } from "@/components/ui/CountUp";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

type Props = {
  done: number;
  total: number;
  allDone: boolean;
  line: string;
};

// One segment per task up to this count, then a single continuous bar.
const MAX_SEGMENTS = 12;

function Fill({
  value,
  color,
  track,
}: {
  value: number;
  color: string;
  track: string;
}) {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.value = withTiming(value, { duration: 320 });
  }, [value, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { backgroundColor: track }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color }, fillStyle]}
      />
    </View>
  );
}

export function DayProgress({ done, total, allDone, line }: Props) {
  const { colors } = useTheme();
  const color = allDone ? colors.success : colors.primary;
  const track = colors.surfaceSunken;
  const segmented = total <= MAX_SEGMENTS;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} of ${total} done`}
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <View style={styles.countRow}>
        <CountUp value={done} tone={allDone ? "success" : "default"} />
        <AppText variant="bodySmall" tone="muted" style={styles.countLabel}>
          {`of ${total} done`}
        </AppText>
      </View>

      <View style={styles.bar}>
        {segmented ? (
          Array.from({ length: total }, (_, i) => (
            <View key={i} style={styles.segment}>
              <Fill value={i < done ? 1 : 0} color={color} track={track} />
            </View>
          ))
        ) : (
          <Fill
            value={total > 0 ? done / total : 0}
            color={color}
            track={track}
          />
        )}
      </View>

      <AppText
        variant="titleM"
        tone={allDone ? "success" : "secondary"}
        accessibilityLiveRegion="polite"
      >
        {line}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  countRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  countLabel: { paddingBottom: 8 },
  bar: { flexDirection: "row", gap: spacing.xs },
  segment: { flex: 1 },
  track: { height: 8, borderRadius: 4, overflow: "hidden", width: "100%" },
  fill: { height: "100%", borderRadius: 4 },
});
