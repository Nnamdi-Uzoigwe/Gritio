import { AppText } from "@/components/ui/AppText";
import { addDays, describeDate } from "@/lib/dates";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { GoalPlanView, StepItem } from "@/types/steps";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  plan: GoalPlanView;
  today: string;
  onOpenStep: (step: StepItem) => void;
};

/** Steps from this goal that are scheduled for today and the next 7 days. */
export function OnYourPlan({ plan, today, onOpenStep }: Props) {
  const { colors } = useTheme();
  const end = addDays(today, 7);
  const all = [...plan.milestones.flatMap((m) => m.steps), ...plan.looseSteps];
  const upcoming = all
    .filter(
      (s) =>
        s.scheduledDate !== null &&
        s.scheduledDate >= today &&
        s.scheduledDate <= end,
    )
    .sort(
      (a, b) =>
        (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? "") ||
        (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99"),
    );

  if (upcoming.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" tone="muted">
        ON YOUR PLAN, NEXT 7 DAYS
      </AppText>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {upcoming.map((step, i) => {
          const done = step.completedAt !== null;
          return (
            <Pressable
              key={step.id}
              accessibilityRole="button"
              accessibilityLabel={`${step.title}. ${describeDate(step.scheduledDate ?? today, today)}. ${done ? "Done" : "Not done"}.`}
              onPress={() => onOpenStep(step)}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Ionicons
                name={done ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={done ? colors.success : colors.textMuted}
              />
              <AppText
                variant="body"
                tone={done ? "muted" : "default"}
                numberOfLines={2}
                style={styles.title}
              >
                {step.title}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {`${describeDate(step.scheduledDate ?? today, today)}${step.scheduledTime ? `, ${formatTime12(step.scheduledTime)}` : ""}`}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  title: { flex: 1 },
});
