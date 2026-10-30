import { AppText } from "@/components/ui/AppText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeProgress } from "@/lib/progress";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  goals: GoalListItem[];
  /** Optional extra line per goal, for example steps completed this week. */
  note?: (goal: GoalListItem) => string | null;
  onOpen: (goal: GoalListItem) => void;
};

export function GoalsProgress({ goals, note, onOpen }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {goals.map((goal, i) => {
        const progress = computeProgress(goal);
        const extra = note?.(goal) ?? null;
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            accessibilityLabel={`${goal.title}. ${progress.label}. Open goal.`}
            onPress={() => onOpen(goal)}
            style={[
              styles.row,
              i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
            ]}
          >
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
              {extra ? (
                <AppText variant="caption" tone="muted">
                  {extra}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  row: { padding: spacing.lg, gap: spacing.sm },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
