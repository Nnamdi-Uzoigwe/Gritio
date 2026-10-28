import { AppText } from "@/components/ui/AppText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { FOCUS_AREAS, type IconName } from "@/lib/focusAreas";
import { computeProgress } from "@/lib/progress";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { goalTiming } from "../goalText";

type Props = {
  goal: GoalListItem;
  today: string;
  swipeLabel: string;
  swipeIcon: IconName;
  onSwipe: () => void;
  onPress: () => void;
};

export function GoalRow({
  goal,
  today,
  swipeLabel,
  swipeIcon,
  onSwipe,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const progress = computeProgress(goal);
  const tint = goal.category ? focusAreaTints[goal.category] : colors.textMuted;
  const area = goal.category
    ? FOCUS_AREAS.find((a) => a.id === goal.category)
    : undefined;
  const timing = goalTiming(goal, today);

  return (
    <SwipeableRow
      postponeLabel={swipeLabel}
      postponeIcon={swipeIcon}
      postponeTone="primary"
      onPostpone={onSwipe}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${goal.title}. ${progress.label}. ${timing}. Open goal.`}
        accessibilityHint={`Swipe left to ${swipeLabel.toLowerCase()}`}
        onPress={onPress}
        style={styles.row}
      >
        <View style={[styles.icon, { backgroundColor: `${tint}22` }]}>
          <Ionicons
            name={area?.icon ?? "flag-outline"}
            size={22}
            color={tint}
          />
        </View>
        <View style={styles.text}>
          <AppText variant="titleM" numberOfLines={2}>
            {goal.title}
          </AppText>
          <ProgressBar
            progress={progress.fraction ?? 0}
            color={colors.primary}
            trackColor={colors.surfaceSunken}
          />
          <View style={styles.meta}>
            <AppText variant="caption" tone="secondary">
              {progress.label}
            </AppText>
            <AppText variant="caption" tone="muted">
              {timing}
            </AppText>
          </View>
        </View>
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
  text: { flex: 1, gap: spacing.sm },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
