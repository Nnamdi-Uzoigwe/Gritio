import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { DatePickerPanel } from "@/components/ui/DatePickerPanel";
import { TimeWheelBody } from "@/components/ui/TimeWheelSheet";
import { updateStep } from "@/db/repositories/steps";
import { ReminderToggleRow } from "@/features/notifications/components/ReminderToggleRow";
import { describeDate } from "@/lib/dates";
import { formatTime12 } from "@/lib/time";
import { ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { StepItem } from "@/types/steps";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  step: StepItem | null;
  today: string;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (step: StepItem) => void;
};

type SheetView = "form" | "due" | "schedule" | "time";

export function StepSheet({
  visible,
  step,
  today,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const { colors } = useTheme();
  // Keep the last step so content does not vanish while the sheet slides away.
  const last = useRef<StepItem | null>(step);
  if (step) last.current = step;
  const shown = step ?? last.current;

  const [view, setView] = useState<SheetView>("form");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [reminder, setReminder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !step) return;
    setView("form");
    setError(null);
    setSaving(false);
    setTitle(step.title);
    setNotes(step.notes ?? "");
    setDueDate(step.dueDate);
    setScheduledDate(step.scheduledDate);
    setScheduledTime(step.scheduledTime);
    setReminder(step.reminderEnabled);
  }, [visible, step?.id]);

  if (!shown) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateStep(shown.id, {
        title,
        notes,
        dueDate,
        scheduledDate,
        scheduledTime,
        reminderEnabled:
          reminder && scheduledDate !== null && scheduledTime !== null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      onSaved();
      onClose();
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else {
        console.warn("Could not save step", e);
        setError("Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete this step?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(shown) },
    ]);
  };

  const picker = (
    icon: "flag-outline" | "calendar-outline" | "time-outline",
    label: string,
    a11y: string,
    target: SheetView,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={() => setView(target)}
      style={[styles.picker, { backgroundColor: colors.surfaceSunken }]}
    >
      <Ionicons name={icon} size={20} color={colors.primaryText} />
      <AppText variant="label" style={styles.pickerText}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );

  const subHeader = (label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to step"
      onPress={() => setView("form")}
      style={styles.subHeader}
    >
      <Ionicons name="chevron-back" size={22} color={colors.text} />
      <AppText variant="titleM">{label}</AppText>
    </Pressable>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={view === "form" ? "Edit step" : undefined}
    >
      {view === "form" ? (
        <View style={styles.form}>
          <AppTextInput
            variant="titleL"
            value={title}
            onChangeText={setTitle}
            placeholder="What is the step?"
            maxLength={120}
            accessibilityLabel="Step title"
          />
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            multiline
            maxLength={500}
            style={styles.notes}
            accessibilityLabel="Step notes"
          />
          {picker(
            "flag-outline",
            dueDate ? `Due ${describeDate(dueDate, today)}` : "No due date",
            `Due date, ${dueDate ? describeDate(dueDate, today) : "none"}. Tap to change.`,
            "due",
          )}
          {picker(
            "calendar-outline",
            scheduledDate
              ? `On my day: ${describeDate(scheduledDate, today)}`
              : "Not on my day yet",
            `Show on my day, ${scheduledDate ? describeDate(scheduledDate, today) : "not scheduled"}. Tap to change.`,
            "schedule",
          )}
          {scheduledDate
            ? picker(
                "time-outline",
                scheduledTime
                  ? formatTime12(scheduledTime)
                  : "Any time that day",
                `Time, ${scheduledTime ? formatTime12(scheduledTime) : "any time"}. Tap to change.`,
                "time",
              )
            : null}

          {scheduledDate !== null && scheduledTime !== null ? (
            <ReminderToggleRow
              value={reminder}
              onChange={setReminder}
              category="task"
              subtitle="Get a reminder at this time."
            />
          ) : null}

          {error ? (
            <AppText variant="bodySmall" tone="error" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <Button
            label="Save changes"
            onPress={save}
            loading={saving}
            disabled={title.trim().length === 0}
          />
          <Button label="Delete step" variant="ghost" onPress={confirmDelete} />
        </View>
      ) : null}

      {view === "due" ? (
        <View style={styles.form}>
          {subHeader("Due date")}
          <DatePickerPanel
            value={dueDate}
            today={today}
            onSelect={(next) => {
              setDueDate(next);
              setView("form");
            }}
          />
          {dueDate ? (
            <Button
              label="No due date"
              variant="ghost"
              onPress={() => {
                setDueDate(null);
                setView("form");
              }}
            />
          ) : null}
        </View>
      ) : null}

      {view === "schedule" ? (
        <View style={styles.form}>
          {subHeader("Show on my day")}
          <DatePickerPanel
            value={scheduledDate}
            today={today}
            onSelect={(next) => {
              setScheduledDate(next);
              setView("form");
            }}
          />
          {scheduledDate ? (
            <Button
              label="Remove from my day"
              variant="ghost"
              onPress={() => {
                setScheduledDate(null);
                setScheduledTime(null);
                setReminder(false);
                setView("form");
              }}
            />
          ) : null}
        </View>
      ) : null}

      {view === "time" ? (
        <View style={styles.form}>
          {subHeader("Set a time")}
          <TimeWheelBody
            value={scheduledTime ?? "09:00"}
            onConfirm={(next) => {
              setScheduledTime(next);
              setView("form");
            }}
          />
          <Button
            label="Any time that day"
            variant="ghost"
            onPress={() => {
              setScheduledTime(null);
              setReminder(false);
              setView("form");
            }}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  notes: { minHeight: 56, maxHeight: 120 },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.minTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  pickerText: { flex: 1 },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touch.minTarget,
  },
});
