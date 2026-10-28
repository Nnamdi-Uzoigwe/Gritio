import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { DatePickerPanel } from "@/components/ui/DatePickerPanel";
import { addDays, formatShortDate, nextMonday } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { StepItem } from "@/types/steps";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  step: StepItem | null;
  today: string;
  onClose: () => void;
  onPick: (date: string | null) => void;
};

export function ScheduleStepSheet({
  visible,
  step,
  today,
  onClose,
  onPick,
}: Props) {
  const { colors } = useTheme();
  const [calendar, setCalendar] = useState(false);

  useEffect(() => {
    if (visible) setCalendar(false);
  }, [visible]);

  const options = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next Monday", date: nextMonday(today) },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Show on my day">
      {calendar ? (
        <DatePickerPanel
          value={step?.scheduledDate ?? null}
          today={today}
          onSelect={onPick}
        />
      ) : (
        <View style={styles.body}>
          {options.map((option) => (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={`${option.label}, ${formatShortDate(option.date)}`}
              onPress={() => onPick(option.date)}
              style={[styles.option, { backgroundColor: colors.surfaceSunken }]}
            >
              <AppText variant="titleM">{option.label}</AppText>
              <AppText variant="bodySmall" tone="muted">
                {formatShortDate(option.date)}
              </AppText>
            </Pressable>
          ))}
          <Button
            label="Pick a date"
            variant="secondary"
            onPress={() => setCalendar(true)}
          />
          {step?.scheduledDate ? (
            <Button
              label="Remove from my day"
              variant="ghost"
              onPress={() => onPick(null)}
            />
          ) : null}
          <View style={styles.hint}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textMuted}
            />
            <AppText variant="caption" tone="muted" style={styles.hintText}>
              Scheduled steps appear on that day in Today, and finishing them
              there updates this goal.
            </AppText>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  option: {
    minHeight: touch.minTarget + 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  hintText: { flex: 1 },
});
