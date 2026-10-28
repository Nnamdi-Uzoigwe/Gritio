import { AppText } from "@/components/ui/AppText";
import { CheckCircle } from "@/components/ui/CheckCircle";
import { Chip } from "@/components/ui/Chip";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { describeDate } from "@/lib/dates";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { StepItem } from "@/types/steps";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  step: StepItem;
  today: string;
  editable: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onSchedule: () => void;
};

export function StepRow({
  step,
  today,
  editable,
  onToggle,
  onOpen,
  onSchedule,
}: Props) {
  const { colors } = useTheme();
  const done = step.completedAt !== null;

  const scheduledLabel = step.scheduledDate
    ? `On ${describeDate(step.scheduledDate, today)}${step.scheduledTime ? `, ${formatTime12(step.scheduledTime)}` : ""}`
    : null;
  const dueLabel = step.dueDate
    ? `Due ${describeDate(step.dueDate, today)}`
    : null;

  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${step.title}. ${done ? "Done" : "Not done"}.${scheduledLabel ? ` ${scheduledLabel}.` : ""}${dueLabel ? ` ${dueLabel}.` : ""}${editable ? " Open details." : ""}`}
      disabled={!editable}
      onPress={onOpen}
      style={styles.row}
    >
      <CheckCircle
        checked={done}
        disabled={!editable}
        label={
          done ? `Mark ${step.title} as not done` : `Mark ${step.title} as done`
        }
        onPress={onToggle}
      />
      <View style={styles.text}>
        <AppText
          variant="titleM"
          tone={done ? "muted" : "default"}
          numberOfLines={3}
          style={done ? styles.struck : undefined}
        >
          {step.title}
        </AppText>
        {scheduledLabel || dueLabel ? (
          <View style={styles.meta}>
            {scheduledLabel ? (
              <Chip label={scheduledLabel} icon="calendar-outline" />
            ) : null}
            {dueLabel ? <Chip label={dueLabel} icon="flag-outline" /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  if (!editable) {
    return (
      <View
        style={[
          styles.static,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <SwipeableRow
      completeLabel={done ? "Undo" : "Done"}
      onComplete={onToggle}
      postponeLabel="Schedule"
      postponeIcon="calendar-outline"
      postponeTone="primary"
      onPostpone={onSchedule}
    >
      {content}
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    paddingRight: spacing.lg,
  },
  static: { borderRadius: radii.lg, borderWidth: 1 },
  text: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  struck: { textDecorationLine: "line-through" },
});
