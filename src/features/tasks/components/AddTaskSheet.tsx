import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { DatePickerPanel } from "@/components/ui/DatePickerPanel";
import { TimeWheelBody } from "@/components/ui/TimeWheelSheet";
import { createTask, updateTask } from "@/db/repositories/tasks";
import { describeDate } from "@/lib/dates";
import { formatTime12 } from "@/lib/time";
import { ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export type EditableTask = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
};

type Props = {
  visible: boolean;
  today: string;
  initial?: EditableTask | null;
  onClose: () => void;
  onSaved: () => void;
};

type View_ = "form" | "date" | "time";

export function AddTaskSheet({
  visible,
  today,
  initial,
  onClose,
  onSaved,
}: Props) {
  const { colors } = useTheme();
  const [view, setView] = useState<View_>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setView("form");
    setError(null);
    setSaving(false);
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setDate(initial?.date ?? today);
    setTime(initial?.time ?? null);
  }, [visible, initial, today]);

  const editing = Boolean(initial);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const input = { title, description, date, time };
      if (initial) await updateTask(initial.id, input);
      else await createTask(input);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      onSaved();
      onClose();
    } catch (e) {
      if (e instanceof ValidationError) {
        setError(e.message);
      } else {
        console.warn("Could not save task", e);
        setError("Could not save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const subHeader = (label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to task"
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
      title={view === "form" ? (editing ? "Edit task" : "New task") : undefined}
    >
      {view === "form" ? (
        <View style={styles.form}>
          <AppTextInput
            variant="titleL"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs doing?"
            autoFocus={!editing}
            maxLength={120}
            returnKeyType="next"
            accessibilityLabel="Task title"
          />
          <AppTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add details (optional)"
            multiline
            maxLength={500}
            style={styles.notes}
            accessibilityLabel="Task details"
          />
          <View style={styles.pickers}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Date, ${describeDate(date, today)}. Tap to change.`}
              onPress={() => setView("date")}
              style={[styles.picker, { backgroundColor: colors.surfaceSunken }]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.primaryText}
              />
              <AppText variant="label">{describeDate(date, today)}</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Time, ${time ? formatTime12(time) : "anytime"}. Tap to change.`}
              onPress={() => setView("time")}
              style={[styles.picker, { backgroundColor: colors.surfaceSunken }]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.primaryText}
              />
              <AppText variant="label">
                {time ? formatTime12(time) : "Anytime"}
              </AppText>
            </Pressable>
          </View>
          {error ? (
            <AppText variant="bodySmall" tone="error" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <Button
            label={editing ? "Save changes" : "Add task"}
            onPress={save}
            loading={saving}
            disabled={title.trim().length === 0}
          />
        </View>
      ) : null}

      {view === "date" ? (
        <View style={styles.form}>
          {subHeader("Pick a date")}
          <DatePickerPanel
            value={date}
            today={today}
            onSelect={(next) => {
              setDate(next);
              setView("form");
            }}
          />
        </View>
      ) : null}

      {view === "time" ? (
        <View style={styles.form}>
          {subHeader("Set a time")}
          <TimeWheelBody
            value={time ?? "09:00"}
            onConfirm={(next) => {
              setTime(next);
              setView("form");
            }}
          />
          <Button
            label="Anytime"
            variant="ghost"
            onPress={() => {
              setTime(null);
              setView("form");
            }}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  notes: { minHeight: 56, maxHeight: 120 },
  pickers: { flexDirection: "row", gap: spacing.sm },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touch.minTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touch.minTarget,
  },
});
