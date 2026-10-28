import { AppText } from "@/components/ui/AppText";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { TimeWheelSheet } from "../../../components/ui/TimeWheelSheet";
import { StepFrame } from "../components/StepFrame";
import {
  useOnboardingStore,
  type ReminderField,
  type TimeField,
} from "../store";

type RowProps = {
  title: string;
  subtitle: string;
  time: string;
  onPressTime: () => void;
  reminder?: { value: boolean; onChange: (value: boolean) => void };
};

function RoutineRow({
  title,
  subtitle,
  time,
  onPressTime,
  reminder,
}: RowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.rowTop}>
        <View style={styles.rowText}>
          <AppText variant="titleM">{title}</AppText>
          <AppText variant="bodySmall" tone="secondary">
            {subtitle}
          </AppText>
        </View>
        <Pressable
          onPress={onPressTime}
          accessibilityRole="button"
          accessibilityLabel={`${title} time, ${formatTime12(time)}. Tap to change.`}
          style={[styles.chip, { backgroundColor: colors.surfaceSunken }]}
        >
          <AppText variant="label" tone="accent">
            {formatTime12(time)}
          </AppText>
        </Pressable>
      </View>
      {reminder ? (
        <View style={styles.switchRow}>
          <AppText variant="bodySmall">Remind me</AppText>
          <Switch
            value={reminder.value}
            onValueChange={reminder.onChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            accessibilityLabel={`Remind me for ${title}`}
          />
        </View>
      ) : null}
    </View>
  );
}

const SHEET_TITLES: Record<TimeField, string> = {
  wakeTime: "Wake up time",
  planningTime: "Daily planning time",
  reflectionTime: "Evening reflection time",
};

export function RoutineStep() {
  const wakeTime = useOnboardingStore((s) => s.wakeTime);
  const planningTime = useOnboardingStore((s) => s.planningTime);
  const reflectionTime = useOnboardingStore((s) => s.reflectionTime);
  const planningReminder = useOnboardingStore((s) => s.planningReminder);
  const reflectionReminder = useOnboardingStore((s) => s.reflectionReminder);
  const setTime = useOnboardingStore((s) => s.setTime);
  const setReminder = useOnboardingStore((s) => s.setReminder);
  const [editing, setEditing] = useState<TimeField | null>(null);

  const values: Record<TimeField, string> = {
    wakeTime,
    planningTime,
    reflectionTime,
  };
  const reminderToggle = (field: ReminderField, value: boolean) => ({
    value,
    onChange: (next: boolean) => setReminder(field, next),
  });

  return (
    <StepFrame
      title="Shape your day."
      subtitle="These are suggestions. Adjust them to fit your life, or skip and set them later."
    >
      <RoutineRow
        title="Wake up"
        subtitle="When your day usually starts"
        time={wakeTime}
        onPressTime={() => setEditing("wakeTime")}
      />
      <RoutineRow
        title="Daily planning"
        subtitle="A few minutes to decide what matters"
        time={planningTime}
        onPressTime={() => setEditing("planningTime")}
        reminder={reminderToggle("planningReminder", planningReminder)}
      />
      <RoutineRow
        title="Evening reflection"
        subtitle="Look back on how the day went"
        time={reflectionTime}
        onPressTime={() => setEditing("reflectionTime")}
        reminder={reminderToggle("reflectionReminder", reflectionReminder)}
      />

      <TimeWheelSheet
        visible={editing !== null}
        title={editing ? SHEET_TITLES[editing] : ""}
        value={editing ? values[editing] : "06:30"}
        onClose={() => setEditing(null)}
        onConfirm={(next) => {
          if (editing) setTime(editing, next);
          setEditing(null);
        }}
      />
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  chip: {
    minHeight: touch.minTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
