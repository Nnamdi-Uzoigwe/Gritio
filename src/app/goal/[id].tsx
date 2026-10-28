import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  archiveGoal,
  completeGoal,
  deleteGoal,
  getGoalDeleteSummary,
  reopenGoal,
  restoreGoal,
} from "@/db/repositories/goals";
import {
  addMilestone,
  addStep,
  deleteMilestone,
  deleteStep,
  reorderMilestones,
  reorderSteps,
  scheduleStep,
  setMilestoneDone,
  setStepDone,
  updateMilestone,
} from "@/db/repositories/steps";
import { GoalActionsSheet } from "@/features/goals/components/GoalActionsSheet";
import { MilestoneSection } from "@/features/goals/components/MilestoneSection";
import { MilestoneSheet } from "@/features/goals/components/MilestoneSheet";
import { OnYourPlan } from "@/features/goals/components/OnYourPlan";
import { ReorderPanel } from "@/features/goals/components/ReorderPanel";
import { ScheduleStepSheet } from "@/features/goals/components/ScheduleStepSheet";
import { StepQuickAdd } from "@/features/goals/components/StepQuickAdd";
import { StepRow } from "@/features/goals/components/StepRow";
import { StepSheet } from "@/features/goals/components/StepSheet";
import { confirmComplete } from "@/features/goals/confirmComplete";
import { goalTiming } from "@/features/goals/goalText";
import { useGoalPlan } from "@/features/goals/useGoalPlan";
import { nowIso, toDateKey } from "@/lib/dates";
import { FOCUS_AREAS, type IconName } from "@/lib/focusAreas";
import { GOAL_STATUS_LABEL, GOAL_TYPE_OPTIONS } from "@/lib/goalMeta";
import { computeProgress } from "@/lib/progress";
import { LimitError, ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing, touch } from "@/theme/tokens";
import type { GoalPlanView, MilestoneItem, StepItem } from "@/types/steps";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.headerButton,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

function mapSteps(
  plan: GoalPlanView,
  fn: (step: StepItem) => StepItem,
): GoalPlanView {
  return {
    milestones: plan.milestones.map((m) => ({ ...m, steps: m.steps.map(fn) })),
    looseSteps: plan.looseSteps.map(fn),
  };
}

export default function GoalDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { goal, plan, setPlan, load } = useGoalPlan(id);

  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [reorderMode, setReorderMode] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [schedulingStepId, setSchedulingStepId] = useState<string | null>(null);
  const [milestoneSheet, setMilestoneSheet] = useState<{
    visible: boolean;
    milestone: MilestoneItem | null;
  }>({
    visible: false,
    milestone: null,
  });
  const [actionsOpen, setActionsOpen] = useState(false);

  const actedRef = useRef(false); // true once the person changed progress on this screen
  const promptedRef = useRef(false);
  const today = toDateKey();

  const allSteps = useMemo(
    () => [...plan.milestones.flatMap((m) => m.steps), ...plan.looseSteps],
    [plan],
  );
  const editingStep = allSteps.find((s) => s.id === editingStepId) ?? null;
  const schedulingStep =
    allSteps.find((s) => s.id === schedulingStepId) ?? null;

  // Ask once, only right after the person finishes the last open item. Never auto completes.
  useEffect(() => {
    if (!goal || goal.status !== "active") return;
    const p = computeProgress(goal);
    const everythingDone = p.total > 0 && p.done === p.total;
    if (!everythingDone) {
      promptedRef.current = false;
      return;
    }
    if (promptedRef.current || !actedRef.current) return;
    promptedRef.current = true;
    actedRef.current = false;
    Alert.alert(
      "Mark this goal as complete?",
      "Every item is done. If your completion criteria are met, you can close this goal now.",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Mark complete",
          onPress: async () => {
            try {
              await completeGoal(goal.id); // Phase 9: the goal celebration is triggered here.
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
              await load();
            } catch (error) {
              console.warn("Could not complete goal", error);
              Alert.alert("Something went wrong", "Please try again.");
            }
          },
        },
      ],
    );
  }, [goal, load]);

  if (goal === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (goal === null) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Goal" />
        <View style={styles.missing}>
          <AppText variant="displayM">Goal not found</AppText>
          <AppText tone="secondary">It may have been deleted.</AppText>
          <Button
            label="Back to goals"
            onPress={() => router.replace("/goals")}
          />
        </View>
      </View>
    );
  }

  const editable = goal.status === "active";
  const progress = computeProgress(goal);
  const area = goal.category
    ? FOCUS_AREAS.find((a) => a.id === goal.category)
    : undefined;
  const typeLabel = GOAL_TYPE_OPTIONS.find(
    (o) => o.id === goal.goalType,
  )?.label;
  const ringColor =
    goal.status === "completed" ? colors.success : colors.primary;
  const hasPlan = plan.milestones.length > 0 || plan.looseSteps.length > 0;
  const reorderable =
    plan.milestones.length > 1 ||
    plan.milestones.some((m) => m.steps.length > 1) ||
    plan.looseSteps.length > 1;

  const fail = (error: unknown) => {
    console.warn("Goal update failed", error);
    Alert.alert("Something went wrong", "Please try again.");
  };

  const run = async (action: () => Promise<void>, reload = true) => {
    setBusy(true);
    try {
      await action();
      if (reload) await load();
    } catch (error) {
      if (error instanceof LimitError)
        Alert.alert("Active goal limit reached", error.message);
      else fail(error);
    } finally {
      setBusy(false);
    }
  };

  const toggleStep = async (step: StepItem) => {
    const next = step.completedAt === null;
    actedRef.current = true;

    if (next && step.milestoneId) {
      const milestone = plan.milestones.find((m) => m.id === step.milestoneId);
      const lastOpen = milestone?.steps.every(
        (s) => s.id === step.id || s.completedAt !== null,
      );
      if (milestone && lastOpen) {
        // Phase 9: the milestone celebration is triggered here.
        setTimeout(
          () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
              () => {},
            ),
          220,
        );
      }
    }

    setPlan((prev) =>
      mapSteps(prev, (s) =>
        s.id === step.id ? { ...s, completedAt: next ? nowIso() : null } : s,
      ),
    );
    try {
      await setStepDone(step.id, next);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const toggleBare = async (milestone: MilestoneItem) => {
    actedRef.current = true;
    try {
      await setMilestoneDone(milestone.id, milestone.completedAt === null);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const addStepTo = async (milestoneId: string | null, title: string) => {
    try {
      await addStep(goal.id, milestoneId, title);
      await load();
    } catch (error) {
      if (error instanceof ValidationError)
        Alert.alert("Check the step", error.message);
      else fail(error);
      throw error;
    }
  };

  const saveMilestone = async (title: string) => {
    if (milestoneSheet.milestone)
      await updateMilestone(milestoneSheet.milestone.id, title);
    else await addMilestone(goal.id, title);
    await load();
  };

  const removeMilestone = async (milestone: MilestoneItem) => {
    setMilestoneSheet({ visible: false, milestone: null });
    try {
      await deleteMilestone(milestone.id);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const removeStep = async (step: StepItem) => {
    setEditingStepId(null);
    try {
      await deleteStep(step.id);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const pickSchedule = async (date: string | null) => {
    const step = schedulingStep;
    setSchedulingStepId(null);
    if (!step) return;
    try {
      await scheduleStep(step.id, date);
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const commitReorder = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      fail(error);
    }
    await load();
  };

  const confirmDelete = async () => {
    let summary = { milestones: 0, steps: 0 };
    try {
      summary = await getGoalDeleteSummary(goal.id);
    } catch (error) {
      console.warn("Could not read goal contents", error);
    }
    const parts: string[] = [];
    if (summary.milestones > 0)
      parts.push(
        `${summary.milestones} ${summary.milestones === 1 ? "milestone" : "milestones"}`,
      );
    if (summary.steps > 0)
      parts.push(`${summary.steps} ${summary.steps === 1 ? "step" : "steps"}`);
    const contents =
      parts.length > 0 ? ` This also deletes ${parts.join(" and ")}.` : "";

    Alert.alert("Delete this goal?", `This cannot be undone.${contents}`, [
      { text: "Cancel", style: "cancel" },
      ...(goal.status !== "archived"
        ? [
            {
              text: "Archive instead",
              onPress: () => run(() => archiveGoal(goal.id)),
            },
          ]
        : []),
      {
        text: "Delete",
        style: "destructive" as const,
        onPress: () =>
          run(async () => {
            await deleteGoal(goal.id);
            router.replace("/goals");
          }, false),
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Goal"
        right={
          <View style={styles.headerActions}>
            {editable && (reorderable || reorderMode) ? (
              <HeaderButton
                icon={reorderMode ? "checkmark" : "swap-vertical-outline"}
                label={reorderMode ? "Done reordering" : "Reorder"}
                onPress={() => {
                  setReorderMode((v) => !v);
                  setScrollLocked(false);
                }}
              />
            ) : null}
            <HeaderButton
              icon="ellipsis-horizontal"
              label="Goal actions"
              onPress={() => setActionsOpen(true)}
            />
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          scrollEnabled={!scrollLocked}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!reorderMode ? (
            <>
              <View style={styles.hero}>
                <ProgressRing
                  progress={progress.fraction ?? 0}
                  size={140}
                  strokeWidth={12}
                  color={ringColor}
                  trackColor={colors.surfaceSunken}
                >
                  {progress.percent === null ? (
                    <Ionicons
                      name="flag-outline"
                      size={32}
                      color={colors.textMuted}
                    />
                  ) : (
                    <AppText variant="displayM">{`${progress.percent}%`}</AppText>
                  )}
                </ProgressRing>
                <AppText variant="displayL" style={styles.centerText}>
                  {goal.title}
                </AppText>
                <View style={styles.chips}>
                  <Chip
                    label={GOAL_STATUS_LABEL[goal.status]}
                    icon="ellipse"
                    tint={
                      goal.status === "completed"
                        ? colors.success
                        : colors.primaryText
                    }
                  />
                  {area && goal.category ? (
                    <Chip
                      label={area.label}
                      icon={area.icon}
                      tint={focusAreaTints[goal.category]}
                    />
                  ) : null}
                  {typeLabel ? <Chip label={typeLabel} /> : null}
                </View>
                <AppText tone="secondary">{goalTiming(goal, today)}</AppText>
              </View>

              <View
                style={[
                  styles.progressCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText variant="caption" tone="muted">
                  PROGRESS
                </AppText>
                <AppText variant="titleL">{progress.label}</AppText>
                <AppText variant="bodySmall" tone="muted">
                  {progress.total > 0
                    ? "Every step counts as one. A milestone with no steps counts as one item you tick yourself."
                    : editable
                      ? "Add your first step below to start measuring progress."
                      : "This goal has no steps."}
                </AppText>
              </View>

              {goal.description ? (
                <View style={styles.block}>
                  <AppText variant="caption" tone="muted">
                    ABOUT
                  </AppText>
                  <AppText>{goal.description}</AppText>
                </View>
              ) : null}

              {goal.completionCriteria ? (
                <View style={styles.block}>
                  <AppText variant="caption" tone="muted">
                    DONE WHEN
                  </AppText>
                  <AppText>{goal.completionCriteria}</AppText>
                </View>
              ) : null}

              {!editable && hasPlan ? (
                <View
                  style={[styles.note, { backgroundColor: colors.primarySoft }]}
                >
                  <AppText variant="bodySmall">
                    {goal.status === "completed"
                      ? "This goal is complete. Reopen it from the menu to change its plan."
                      : "This goal is archived. Restore it from the menu to change its plan."}
                  </AppText>
                </View>
              ) : null}

              {editable ? (
                <OnYourPlan
                  plan={plan}
                  today={today}
                  onOpenStep={(s) => setEditingStepId(s.id)}
                />
              ) : null}

              {plan.milestones.map((milestone, index) => (
                <MilestoneSection
                  key={milestone.id}
                  index={index}
                  milestone={milestone}
                  today={today}
                  editable={editable}
                  collapsed={Boolean(collapsed[milestone.id])}
                  onToggleCollapsed={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [milestone.id]: !prev[milestone.id],
                    }))
                  }
                  onToggleBare={() => toggleBare(milestone)}
                  onEdit={() => setMilestoneSheet({ visible: true, milestone })}
                  onToggleStep={toggleStep}
                  onOpenStep={(s) => setEditingStepId(s.id)}
                  onScheduleStep={(s) => setSchedulingStepId(s.id)}
                  onAddStep={(title) => addStepTo(milestone.id, title)}
                />
              ))}

              {editable || plan.looseSteps.length > 0 ? (
                <View style={styles.section}>
                  <AppText variant="caption" tone="muted">
                    {plan.milestones.length > 0 ? "OTHER STEPS" : "STEPS"}
                  </AppText>
                  {plan.looseSteps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      today={today}
                      editable={editable}
                      onToggle={() => toggleStep(step)}
                      onOpen={() => setEditingStepId(step.id)}
                      onSchedule={() => setSchedulingStepId(step.id)}
                    />
                  ))}
                  {editable ? (
                    <StepQuickAdd onAdd={(title) => addStepTo(null, title)} />
                  ) : null}
                </View>
              ) : null}

              {editable ? (
                <Button
                  label="Add milestone"
                  variant="secondary"
                  onPress={() =>
                    setMilestoneSheet({ visible: true, milestone: null })
                  }
                />
              ) : null}

              {editable && !hasPlan ? (
                <AppText
                  variant="bodySmall"
                  tone="muted"
                  style={styles.centerText}
                >
                  Break this goal into steps, or group them into milestones.
                  Swipe a step left to put it on your day.
                </AppText>
              ) : null}
            </>
          ) : (
            <ReorderPanel
              plan={plan}
              onDragStateChange={setScrollLocked}
              onReorderMilestones={(ids) =>
                commitReorder(() => reorderMilestones(ids))
              }
              onReorderSteps={(ids) => commitReorder(() => reorderSteps(ids))}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <StepSheet
        visible={editingStep !== null}
        step={editingStep}
        today={today}
        onClose={() => setEditingStepId(null)}
        onSaved={load}
        onDelete={removeStep}
      />

      <ScheduleStepSheet
        visible={schedulingStep !== null}
        step={schedulingStep}
        today={today}
        onClose={() => setSchedulingStepId(null)}
        onPick={pickSchedule}
      />

      <MilestoneSheet
        visible={milestoneSheet.visible}
        milestone={milestoneSheet.milestone}
        onClose={() => setMilestoneSheet((s) => ({ ...s, visible: false }))}
        onSave={saveMilestone}
        onDelete={removeMilestone}
      />

      <GoalActionsSheet
        visible={actionsOpen}
        status={goal.status}
        onClose={() => setActionsOpen(false)}
        onEdit={() => router.push(`/goal/edit/${goal.id}`)}
        onComplete={() =>
          confirmComplete(goal, () =>
            run(async () => {
              await completeGoal(goal.id); // Phase 9: the goal celebration is triggered here.
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
            }),
          )
        }
        onReopen={() => run(() => reopenGoal(goal.id))}
        onRestore={() => run(() => restoreGoal(goal.id))}
        onArchive={() => run(() => archiveGoal(goal.id))}
        onDelete={confirmDelete}
      />

      {busy ? (
        <View
          pointerEvents="auto"
          style={[styles.busy, { backgroundColor: colors.overlay }]}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.xl,
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerButton: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: touch.minTarget / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { alignItems: "center", gap: spacing.md },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  block: { gap: spacing.xs },
  note: { padding: spacing.lg, borderRadius: radii.md },
  section: { gap: spacing.sm },
  missing: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  busy: {
    ...{ position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 },
    alignItems: "center",
    justifyContent: "center",
  },
});
