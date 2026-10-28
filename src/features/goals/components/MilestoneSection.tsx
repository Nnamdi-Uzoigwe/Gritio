import { AppText } from "@/components/ui/AppText";
import { CheckCircle } from "@/components/ui/CheckCircle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { MilestoneItem, StepItem } from "@/types/steps";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { StepQuickAdd } from "./StepQuickAdd";
import { StepRow } from "./StepRow";

type Props = {
  index: number;
  milestone: MilestoneItem;
  today: string;
  editable: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onToggleBare: () => void;
  onEdit: () => void;
  onToggleStep: (step: StepItem) => void;
  onOpenStep: (step: StepItem) => void;
  onScheduleStep: (step: StepItem) => void;
  onAddStep: (title: string) => Promise<void>;
};

export function MilestoneSection({
  index,
  milestone,
  today,
  editable,
  collapsed,
  onToggleCollapsed,
  onToggleBare,
  onEdit,
  onToggleStep,
  onOpenStep,
  onScheduleStep,
  onAddStep,
}: Props) {
  const { colors } = useTheme();
  const total = milestone.steps.length;
  const done = milestone.steps.filter((s) => s.completedAt !== null).length;
  const bare = total === 0;
  const complete = bare ? milestone.completedAt !== null : done === total;
  const fraction = bare ? (complete ? 1 : 0) : done / total;
  const subtitle = bare
    ? complete
      ? "Done"
      : "No steps yet"
    : `${done} of ${total} ${total === 1 ? "step" : "steps"}`;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={`Milestone ${index + 1}, ${milestone.title}. ${subtitle}. ${collapsed ? "Collapsed" : "Expanded"}.`}
        onPress={onToggleCollapsed}
        style={styles.header}
      >
        <View
          style={[
            styles.badge,
            { backgroundColor: complete ? colors.success : colors.primarySoft },
          ]}
        >
          {complete ? (
            <Ionicons name="checkmark" size={18} color={colors.onSuccess} />
          ) : (
            <AppText variant="label" tone="accent">
              {index + 1}
            </AppText>
          )}
        </View>
        <View style={styles.headerText}>
          <AppText variant="titleL" numberOfLines={2}>
            {milestone.title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        </View>
        {editable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit milestone ${milestone.title}`}
            hitSlop={8}
            onPress={onEdit}
            style={styles.iconButton}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
        <Ionicons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      <ProgressBar
        progress={fraction}
        color={complete ? colors.success : colors.primary}
        trackColor={colors.surfaceSunken}
        height={4}
      />

      {!collapsed ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.body}>
          {bare ? (
            <View
              style={[
                styles.bareRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <CheckCircle
                checked={complete}
                disabled={!editable}
                label={
                  complete
                    ? "Mark this milestone as not done"
                    : "Mark this milestone as done"
                }
                onPress={onToggleBare}
              />
              <AppText
                variant="bodySmall"
                tone="secondary"
                style={styles.bareText}
              >
                {editable
                  ? "Add steps below, or tick this milestone yourself when it is done."
                  : "This milestone has no steps."}
              </AppText>
            </View>
          ) : null}

          {milestone.steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              today={today}
              editable={editable}
              onToggle={() => onToggleStep(step)}
              onOpen={() => onOpenStep(step)}
              onSchedule={() => onScheduleStep(step)}
            />
          ))}

          {editable ? <StepQuickAdd onAdd={onAddStep} /> : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.minTarget,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 2 },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { gap: spacing.sm, paddingTop: spacing.xs },
  bareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  bareText: { flex: 1 },
});
