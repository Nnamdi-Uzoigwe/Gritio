import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DatePickerPanel } from "@/components/ui/DatePickerPanel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { TimeWheelBody } from "@/components/ui/TimeWheelSheet";
import { getFocusAreaIds } from "@/db/repositories/focusAreas";
import { ReminderToggleRow } from "@/features/notifications/components/ReminderToggleRow";
import { addDays, describeDate, toDateKey } from "@/lib/dates";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { ALL_DAYS } from "@/lib/habitDays";
import { formatTime12 } from "@/lib/time";
import { LimitError, ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing, touch } from "@/theme/tokens";
import type { FocusAreaId } from "@/types/domain";
import type { HabitInput } from "@/types/habits";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { HABIT_SUGGESTIONS } from "../suggestions";
import { DaySelector } from "./DaySelector";

type Props = {
  mode: "create" | "edit";
  initial?: HabitInput;
  onSubmit: (values: HabitInput) => Promise<void>;
  children?: React.ReactNode;
};

function PickerRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: "calendar-outline" | "time-outline";
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}. Tap to change.`}
      onPress={onPress}
      style={[styles.pickerRow, { backgroundColor: colors.surfaceSunken }]}
    >
      <Ionicons name={icon} size={20} color={colors.primaryText} />
      <View style={styles.pickerText}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="label">{value}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export function HabitForm({ mode, initial, onSubmit, children }: Props) {
  const { colors } = useTheme();
  const today = toDateKey();
  const editing = mode === "edit";

  const [name, setName] = useState(initial?.name ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(
    initial?.weekdays ?? ALL_DAYS,
  );
  const [more, setMore] = useState(editing);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<FocusAreaId | null>(
    initial?.category ?? null,
  );
  const [timeOfDay, setTimeOfDay] = useState<string | null>(
    initial?.timeOfDay ?? null,
  );
  const [reminders, setReminders] = useState(
    initial?.remindersEnabled ?? false,
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [minimumLabel, setMinimumLabel] = useState(initial?.minimumLabel ?? "");
  const [targetLabel, setTargetLabel] = useState(initial?.targetLabel ?? "");
  const [sheet, setSheet] = useState<"start" | "time" | null>(null);
  const [userAreas, setUserAreas] = useState<FocusAreaId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFocusAreaIds()
      .then(setUserAreas)
      .catch((e) => console.warn("Could not load focus areas", e));
  }, []);

  const orderedAreas = useMemo(
    () =>
      [...FOCUS_AREAS].sort(
        (a, b) =>
          Number(!userAreas.includes(a.id)) - Number(!userAreas.includes(b.id)),
      ),
    [userAreas],
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name,
        description,
        category,
        weekdays,
        startDate,
        timeOfDay,
        remindersEnabled: reminders && timeOfDay !== null,
        minimumLabel,
        targetLabel,
      });
    } catch (e) {
      if (e instanceof ValidationError || e instanceof LimitError)
        setError(e.message);
      else {
        console.warn("Could not save habit", e);
        setError("Could not save. Please try again.");
      }
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={editing ? "Edit habit" : "New habit"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <AppTextInput
              variant="titleL"
              value={name}
              onChangeText={setName}
              placeholder="What do you want to do regularly?"
              maxLength={60}
              autoFocus={!editing}
              accessibilityLabel="Habit name"
            />
            {!editing && name.trim().length === 0 ? (
              <View style={styles.suggestions}>
                {HABIT_SUGGESTIONS.map((s) => (
                  <Chip key={s} label={s} onPress={() => setName(s)} />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.field}>
            <AppText variant="caption" tone="muted">
              REPEATS
            </AppText>
            <DaySelector value={weekdays} onChange={setWeekdays} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: more }}
            accessibilityLabel="More options"
            onPress={() => setMore((v) => !v)}
            style={styles.moreToggle}
          >
            <AppText variant="label" tone="accent">
              {more ? "Fewer options" : "More options"}
            </AppText>
            <Ionicons
              name={more ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primaryText}
            />
          </Pressable>

          {more ? (
            <>
              <View style={styles.field}>
                <AppText variant="caption" tone="muted">
                  MINIMUM AND TARGET (OPTIONAL)
                </AppText>
                <AppTextInput
                  value={targetLabel}
                  onChangeText={setTargetLabel}
                  placeholder="Target version, e.g. Read 20 pages"
                  maxLength={80}
                  accessibilityLabel="Target version"
                />
                <AppTextInput
                  value={minimumLabel}
                  onChangeText={setMinimumLabel}
                  placeholder="Minimum version, e.g. Read 2 pages"
                  maxLength={80}
                  accessibilityLabel="Minimum version"
                />
                <AppText variant="bodySmall" tone="muted">
                  On a hard day, the minimum still counts as showing up.
                </AppText>
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="muted">
                  WHEN
                </AppText>
                <PickerRow
                  icon="time-outline"
                  label="Time of day"
                  value={timeOfDay ? formatTime12(timeOfDay) : "Any time"}
                  onPress={() => setSheet("time")}
                />
                {timeOfDay !== null ? (
                  <ReminderToggleRow
                    value={reminders}
                    onChange={setReminders}
                    category="habit"
                    subtitle="Get a reminder at this time on each scheduled day."
                  />
                ) : null}
                <PickerRow
                  icon="calendar-outline"
                  label="Start date"
                  value={describeDate(startDate, today)}
                  onPress={() => setSheet("start")}
                />
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="muted">
                  ABOUT
                </AppText>
                <AppTextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Why does it matter? (optional)"
                  multiline
                  maxLength={300}
                  style={styles.multiline}
                  accessibilityLabel="Habit description"
                />
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="muted">
                  CATEGORY
                </AppText>
                <View style={styles.chips}>
                  {orderedAreas.map((area) => (
                    <Chip
                      key={area.id}
                      label={area.label}
                      icon={area.icon}
                      tint={focusAreaTints[area.id]}
                      selected={category === area.id}
                      onPress={() =>
                        setCategory(category === area.id ? null : area.id)
                      }
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {children}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {error ? (
            <AppText variant="bodySmall" tone="error" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <Button
            label={editing ? "Save changes" : "Create habit"}
            onPress={submit}
            loading={saving}
            disabled={name.trim().length === 0 || weekdays.length === 0}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={sheet === "start"}
        onClose={() => setSheet(null)}
        title="Start date"
      >
        <DatePickerPanel
          value={startDate}
          today={today}
          minDate={addDays(today, -365)}
          shortcuts={[
            { label: "Today", date: today },
            { label: "Yesterday", date: addDays(today, -1) },
            { label: "Tomorrow", date: addDays(today, 1) },
          ]}
          onSelect={(next) => {
            setStartDate(next);
            setSheet(null);
          }}
        />
      </BottomSheet>

      <BottomSheet
        visible={sheet === "time"}
        onClose={() => setSheet(null)}
        title="Time of day"
      >
        <View style={styles.sheetBody}>
          <TimeWheelBody
            value={timeOfDay ?? "07:00"}
            onConfirm={(next) => {
              setTimeOfDay(next);
              setSheet(null);
            }}
          />
          <Button
            label="Any time"
            variant="ghost"
            onPress={() => {
              setTimeOfDay(null);
              setReminders(false);
              setSheet(null);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  field: { gap: spacing.sm },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  moreToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touch.minTarget,
  },
  multiline: { minHeight: 56, maxHeight: 130 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.minTarget + 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  pickerText: { flex: 1, gap: 2 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  sheetBody: { gap: spacing.md },
});
