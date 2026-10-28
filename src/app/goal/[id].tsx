import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
    archiveGoal,
    completeGoal,
    deleteGoal,
    getGoal,
    getGoalDeleteSummary,
    reopenGoal,
    restoreGoal,
} from "@/db/repositories/goals";
import { confirmComplete } from "@/features/goals/confirmComplete";
import { goalTiming } from "@/features/goals/goalText";
import { toDateKey } from "@/lib/dates";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { GOAL_STATUS_LABEL, GOAL_TYPE_OPTIONS } from "@/lib/goalMeta";
import { computeProgress } from "@/lib/progress";
import { LimitError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

export default function GoalDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [goal, setGoal] = useState<GoalListItem | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const today = toDateKey();

  const load = useCallback(async () => {
    try {
      setGoal(await getGoal(id));
    } catch (error) {
      console.warn("Could not load goal", error);
      setGoal(null);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (action: () => Promise<void>, reload = true) => {
    setBusy(true);
    try {
      await action();
      if (reload) await load();
    } catch (error) {
      if (error instanceof LimitError) {
        Alert.alert("Active goal limit reached", error.message);
      } else {
        console.warn("Could not update goal", error);
        Alert.alert("Something went wrong", "Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

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

  const progress = computeProgress(goal);
  const area = goal.category
    ? FOCUS_AREAS.find((a) => a.id === goal.category)
    : undefined;
  const typeLabel = GOAL_TYPE_OPTIONS.find(
    (o) => o.id === goal.goalType,
  )?.label;
  const ringColor =
    goal.status === "completed" ? colors.success : colors.primary;

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

    const buttons = [
      { text: "Cancel", style: "cancel" as const },
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
    ];
    Alert.alert(
      "Delete this goal?",
      `This cannot be undone.${contents}`,
      buttons,
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Goal" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <ProgressRing
            progress={progress.fraction ?? 0}
            size={148}
            strokeWidth={13}
            color={ringColor}
            trackColor={colors.surfaceSunken}
          >
            {progress.percent === null ? (
              <Ionicons
                name="flag-outline"
                size={34}
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
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="caption" tone="muted">
            PROGRESS
          </AppText>
          <AppText variant="titleL">{progress.label}</AppText>
          <AppText variant="bodySmall" tone="muted">
            {progress.total > 0
              ? "Every step counts as one. A milestone with no steps counts as one item you tick yourself."
              : "Milestones and steps can be added on this page in the next build phase."}
          </AppText>
          {goal.milestoneCount > 0 ? (
            <AppText variant="bodySmall" tone="secondary">
              {`${goal.milestoneCount} ${goal.milestoneCount === 1 ? "milestone" : "milestones"} in this goal`}
            </AppText>
          ) : null}
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

        <View style={styles.actions}>
          {goal.status === "active" ? (
            <Button
              label="Mark complete"
              disabled={busy}
              onPress={() =>
                confirmComplete(goal, () =>
                  run(async () => {
                    await completeGoal(goal.id);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    ).catch(() => {});
                  }),
                )
              }
            />
          ) : null}
          {goal.status === "completed" ? (
            <Button
              label="Reopen goal"
              disabled={busy}
              onPress={() => run(() => reopenGoal(goal.id))}
            />
          ) : null}
          {goal.status === "archived" ? (
            <Button
              label="Restore goal"
              disabled={busy}
              onPress={() => run(() => restoreGoal(goal.id))}
            />
          ) : null}
          <Button
            label="Edit goal"
            variant="secondary"
            disabled={busy}
            onPress={() => router.push(`/goal/edit/${goal.id}`)}
          />
          {goal.status !== "archived" ? (
            <Button
              label="Archive"
              variant="ghost"
              disabled={busy}
              onPress={() => run(() => archiveGoal(goal.id))}
            />
          ) : null}
          <Button
            label="Delete"
            variant="ghost"
            disabled={busy}
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { textAlign: "center" },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  hero: { alignItems: "center", gap: spacing.md },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  block: { gap: spacing.xs },
  actions: { gap: spacing.sm },
  missing: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
});
