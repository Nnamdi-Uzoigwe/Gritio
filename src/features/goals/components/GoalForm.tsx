import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DatePickerPanel } from "@/components/ui/DatePickerPanel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getFocusAreaIds } from "@/db/repositories/focusAreas";
import { describeDate, toDateKey } from "@/lib/dates";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { addMonths, endOfYear } from "@/lib/goalDates";
import { GOAL_TYPE_OPTIONS } from "@/lib/goalMeta";
import { LimitError, ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing, touch } from "@/theme/tokens";
import type { FocusAreaId } from "@/types/domain";
import type { GoalInput, GoalPlan, GoalType } from "@/types/goals";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import type { GoalTemplate } from "../templates";
import { templateStepCount } from "../templates";
import { TemplatePicker } from "./TemplatePicker";

type Props = {
  mode: "create" | "edit";
  initial?: GoalInput;
  onSubmit: (values: GoalInput, plan: GoalPlan | null) => Promise<void>;
};

function DateRow({
  label,
  value,
  onPress,
}: {
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
      style={[styles.dateRow, { backgroundColor: colors.surfaceSunken }]}
    >
      <Ionicons name="calendar-outline" size={20} color={colors.primaryText} />
      <View style={styles.dateText}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="label">{value}</AppText>
      </View>
    </Pressable>
  );
}

export function GoalForm({ mode, initial, onSubmit }: Props) {
  const { colors } = useTheme();
  const today = toDateKey();
  const editing = mode === "edit";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<FocusAreaId | null>(
    initial?.category ?? null,
  );
  const [goalType, setGoalType] = useState<GoalType | null>(
    initial?.goalType ?? null,
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [targetDate, setTargetDate] = useState<string | null>(
    initial?.targetDate ?? null,
  );
  const [criteria, setCriteria] = useState(initial?.completionCriteria ?? "");
  const [template, setTemplate] = useState<GoalTemplate | null>(null);
  const [dateSheet, setDateSheet] = useState<"start" | "target" | null>(null);
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

  const applyTemplate = (next: GoalTemplate) => {
    if (template?.id === next.id) {
      setTemplate(null);
      return;
    }
    setTemplate(next);
    setTitle(next.title);
    setDescription(next.description);
    setCategory(next.category);
    setGoalType(next.goalType);
    setCriteria(next.completionCriteria);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const plan: GoalPlan | null = template
        ? { milestones: template.milestones, looseSteps: [] }
        : null;
      await onSubmit(
        {
          title,
          description,
          category,
          goalType,
          startDate,
          targetDate,
          completionCriteria: criteria,
        },
        plan,
      );
    } catch (e) {
      if (e instanceof ValidationError || e instanceof LimitError) {
        setError(e.message);
      } else {
        console.warn("Could not save goal", e);
        setError("Could not save. Please try again.");
      }
      setSaving(false);
    }
  };

  const selectedTypeHint = GOAL_TYPE_OPTIONS.find(
    (o) => o.id === goalType,
  )?.hint;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={editing ? "Edit goal" : "New goal"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!editing ? (
            <TemplatePicker
              selectedId={template?.id ?? null}
              onSelect={applyTemplate}
            />
          ) : null}

          {template ? (
            <View
              style={[
                styles.templateNote,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <AppText variant="bodySmall" style={styles.flex}>
                {`Includes ${template.milestones.length} milestones and ${templateStepCount(template)} steps. You can change them on the goal page.`}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove template plan"
                onPress={() => setTemplate(null)}
                hitSlop={8}
              >
                <AppText variant="label" tone="accent">
                  Remove
                </AppText>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.field}>
            <AppTextInput
              variant="titleL"
              value={title}
              onChangeText={setTitle}
              placeholder="What do you want to achieve?"
              maxLength={100}
              autoFocus={!editing}
              accessibilityLabel="Goal title"
            />
            <AppTextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Why does it matter? (optional)"
              multiline
              maxLength={500}
              style={styles.multiline}
              accessibilityLabel="Goal description"
            />
          </View>

          <View style={styles.field}>
            <AppText variant="caption" tone="muted">
              FOCUS AREA
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

          <View style={styles.field}>
            <AppText variant="caption" tone="muted">
              TYPE
            </AppText>
            <View style={styles.chips}>
              {GOAL_TYPE_OPTIONS.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={goalType === option.id}
                  onPress={() =>
                    setGoalType(goalType === option.id ? null : option.id)
                  }
                />
              ))}
            </View>
            {selectedTypeHint ? (
              <AppText variant="bodySmall" tone="muted">
                {selectedTypeHint}
              </AppText>
            ) : null}
          </View>

          <View style={styles.field}>
            <AppText variant="caption" tone="muted">
              DATES
            </AppText>
            <View style={styles.dates}>
              <DateRow
                label="Start"
                value={describeDate(startDate, today)}
                onPress={() => setDateSheet("start")}
              />
              <DateRow
                label="Target"
                value={
                  targetDate
                    ? describeDate(targetDate, today)
                    : "No target date"
                }
                onPress={() => setDateSheet("target")}
              />
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="caption" tone="muted">
              HOW WILL YOU KNOW IT IS DONE?
            </AppText>
            <AppTextInput
              value={criteria}
              onChangeText={setCriteria}
              placeholder="Completion criteria (optional)"
              multiline
              maxLength={300}
              style={styles.multiline}
              accessibilityLabel="Completion criteria"
            />
          </View>
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
            label={editing ? "Save changes" : "Create goal"}
            onPress={submit}
            loading={saving}
            disabled={title.trim().length === 0}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={dateSheet !== null}
        onClose={() => setDateSheet(null)}
        title={dateSheet === "start" ? "Start date" : "Target date"}
      >
        {dateSheet === "start" ? (
          <DatePickerPanel
            value={startDate}
            today={today}
            onSelect={(next) => {
              setStartDate(next);
              if (targetDate && targetDate < next) setTargetDate(null);
              setDateSheet(null);
            }}
          />
        ) : (
          <View style={styles.sheetBody}>
            <DatePickerPanel
              value={targetDate}
              today={today}
              minDate={startDate}
              shortcuts={[
                { label: "In 1 month", date: addMonths(startDate, 1) },
                { label: "In 3 months", date: addMonths(startDate, 3) },
                { label: "In 6 months", date: addMonths(startDate, 6) },
                { label: "End of year", date: endOfYear(startDate) },
              ]}
              onSelect={(next) => {
                setTargetDate(next);
                setDateSheet(null);
              }}
            />
            {targetDate ? (
              <Button
                label="No target date"
                variant="ghost"
                onPress={() => {
                  setTargetDate(null);
                  setDateSheet(null);
                }}
              />
            ) : null}
          </View>
        )}
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
  multiline: { minHeight: 56, maxHeight: 130 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dates: { flexDirection: "row", gap: spacing.sm },
  dateRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.minTarget + 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
  dateText: { flex: 1, gap: 2 },
  templateNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  sheetBody: { gap: spacing.md },
});
