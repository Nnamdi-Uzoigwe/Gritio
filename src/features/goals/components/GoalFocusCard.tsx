import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { computeProgress } from "@/lib/progress";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { goalTiming } from "../goalText";

type Props = { goal: GoalListItem; today: string; onPress: () => void };

export function GoalFocusCard({ goal, today, onPress }: Props) {
  const { colors } = useTheme();
  const progress = computeProgress(goal);
  const tint = goal.category ? focusAreaTints[goal.category] : colors.primary;
  const area = goal.category
    ? FOCUS_AREAS.find((a) => a.id === goal.category)
    : undefined;
  const timing = goalTiming(goal, today);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}. ${progress.label}. ${timing}. Open goal.`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.edge, { backgroundColor: tint }]} />
      <View style={styles.body}>
        <View style={styles.text}>
          <AppText variant="caption" tone="accent">
            FOCUS GOAL
          </AppText>
          <AppText variant="displayM" numberOfLines={3}>
            {goal.title}
          </AppText>
          {area ? (
            <Chip label={area.label} icon={area.icon} tint={tint} />
          ) : null}
          <View style={styles.lines}>
            <AppText variant="bodySmall" tone="secondary">
              {progress.label}
            </AppText>
            <AppText variant="bodySmall" tone="muted">
              {timing}
            </AppText>
          </View>
        </View>
        <ProgressRing
          progress={progress.fraction ?? 0}
          size={92}
          strokeWidth={9}
          color={colors.primary}
          trackColor={colors.surfaceSunken}
        >
          {progress.percent === null ? (
            <Ionicons name="flag-outline" size={26} color={colors.textMuted} />
          ) : (
            <AppText variant="titleL">{`${progress.percent}%`}</AppText>
          )}
        </ProgressRing>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, overflow: "hidden" },
  edge: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6 },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    paddingLeft: spacing.xl + 6,
  },
  text: { flex: 1, gap: spacing.sm },
  lines: { gap: 2 },
});
