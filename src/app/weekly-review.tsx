import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { listGoals } from "@/db/repositories/goals";
import {
    loadProgressData,
    stepsCompletedByGoal,
    type ProgressData,
} from "@/db/repositories/progress";
import {
    getReview,
    MAX_PRIORITIES,
    saveReview,
    type WeeklyReview,
} from "@/db/repositories/reviews";
import { GoalsProgress } from "@/features/progress/components/GoalsProgress";
import { HabitRates } from "@/features/progress/components/HabitRates";
import {
    addDays,
    formatLongDate,
    formatShortDate,
    isValidDateKey,
    startOfWeek,
    toDateKey,
} from "@/lib/dates";
import {
    computeDayStats,
    describePeriod,
    habitRates,
    periodFor,
    summarize,
} from "@/lib/progressStats";
import { ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

type Loaded = {
  progress: ProgressData;
  goals: GoalListItem[];
  stepsByGoal: Map<string, number>;
  review: WeeklyReview | null;
};

const blankPriorities = (): string[] =>
  Array.from({ length: MAX_PRIORITIES }, () => "");
const padPriorities = (list: string[]): string[] =>
  [...list, ...blankPriorities()].slice(0, MAX_PRIORITIES);

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default function WeeklyReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ week?: string }>();
  const today = toDateKey();
  const thisWeek = startOfWeek(today);
  const lastWeek = addDays(thisWeek, -7);

  const paramWeek = Array.isArray(params.week) ? params.week[0] : params.week;
  const startWeek =
    paramWeek &&
    isValidDateKey(paramWeek) &&
    startOfWeek(paramWeek) === paramWeek &&
    paramWeek <= thisWeek
      ? paramWeek
      : thisWeek;

  const [weekStart, setWeekStart] = useState(startWeek);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [notes, setNotes] = useState("");
  const [priorities, setPriorities] = useState<string[]>(blankPriorities());
  const [initial, setInitial] = useState({
    notes: "",
    priorities: blankPriorities(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => periodFor("week", weekStart), [weekStart]);
  const info = describePeriod(period, today);

  const load = useCallback(async () => {
    setLoaded(null);
    setFailed(false);
    try {
      const [progress, goals, stepsByGoal, review] = await Promise.all([
        loadProgressData(period.from, period.to),
        listGoals("active"),
        stepsCompletedByGoal(period.from, period.to),
        getReview(period.from),
      ]);
      const nextNotes = review?.notes ?? "";
      const nextPriorities = padPriorities(review?.priorities ?? []);
      setNotes(nextNotes);
      setPriorities(nextPriorities);
      setInitial({ notes: nextNotes, priorities: nextPriorities });
      setError(null);
      setLoaded({ progress, goals, stepsByGoal, review });
    } catch (e) {
      console.warn("Could not load weekly review", e);
      setFailed(true);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    notes !== initial.notes ||
    priorities.some((p, i) => p !== initial.priorities[i]);

  const switchWeek = (next: string) => {
    if (next === weekStart) return;
    if (!dirty) {
      setWeekStart(next);
      return;
    }
    Alert.alert(
      "Switch week?",
      "Your unsaved notes for this week will be lost.",
      [
        { text: "Stay", style: "cancel" },
        { text: "Switch", onPress: () => setWeekStart(next) },
      ],
    );
  };

  const view = useMemo(() => {
    if (!loaded) return null;
    const { progress } = loaded;
    const days = computeDayStats({
      from: period.from,
      to: period.to,
      today,
      tasks: progress.tasks,
      habits: progress.habits,
      steps: progress.steps,
    });

    // Only days that have already passed count as "left unfinished". Today is still in progress.
    const unfinished = [
      ...progress.tasks
        .filter((t) => !t.done && t.date < today)
        .map((t) => ({
          key: `t:${t.id}`,
          title: t.title,
          date: t.date,
          kind: "Task",
        })),
      ...progress.steps
        .filter((s) => !s.done && s.scheduledDate < today)
        .map((s) => ({
          key: `s:${s.id}`,
          title: s.title,
          date: s.scheduledDate,
          kind: "Goal step",
        })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: summarize(days, today),
      rates: habitRates(progress.habits, period.from, period.to, today),
      unfinished,
      moved: progress.tasks.filter((t) => t.postponedCount > 0).length,
      milestones: progress.accomplishments.filter(
        (a) => a.kind === "milestone",
      ),
    };
  }, [loaded, period, today]);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/progress");
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveReview(weekStart, { notes, priorities });
      // Phase 9: the weekly review celebration is triggered here.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      leave();
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else {
        console.warn("Could not save weekly review", e);
        setError("Could not save. Please try again.");
      }
      setSaving(false);
    }
  };

  const reviewed = loaded?.review != null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Weekly review" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.block}>
            <AppText variant="displayM">{`${formatShortDate(period.from)} to ${formatShortDate(period.to)}`}</AppText>
            <AppText tone="secondary">
              A calm look back, and a choice about what comes next. Skip it any
              week you like.
            </AppText>
            <View style={styles.chips}>
              <Chip
                label="This week"
                selected={weekStart === thisWeek}
                onPress={() => switchWeek(thisWeek)}
              />
              <Chip
                label="Last week"
                selected={weekStart === lastWeek}
                onPress={() => switchWeek(lastWeek)}
              />
              {weekStart !== thisWeek && weekStart !== lastWeek ? (
                <Chip label={info.label} selected />
              ) : null}
            </View>
            {reviewed && loaded?.review ? (
              <AppText variant="caption" tone="muted">
                {`Completed ${formatLongDate(toDateKey(new Date(loaded.review.completedAt)))}`}
              </AppText>
            ) : null}
          </View>

          {loaded === null && !failed ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {failed ? (
            <View style={styles.block}>
              <AppText variant="titleM">Could not load this week</AppText>
              <Button label="Try again" onPress={load} />
            </View>
          ) : null}

          {loaded && view ? (
            <>
              <View
                style={[
                  styles.summary,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText variant="caption" tone="muted">
                  {info.isCurrent ? "SO FAR THIS WEEK" : "THE WEEK"}
                </AppText>
                {view.summary.total === 0 ? (
                  <AppText tone="secondary">
                    No completed commitments recorded for this week.
                  </AppText>
                ) : (
                  <>
                    <AppText variant="displayL">{`${view.summary.percent}%`}</AppText>
                    <AppText tone="secondary">{`${view.summary.done} of ${view.summary.total} commitments done`}</AppText>
                  </>
                )}
              </View>

              {view.rates.length > 0 ? (
                <View style={styles.block}>
                  <AppText variant="caption" tone="muted">
                    HABITS FOLLOWED
                  </AppText>
                  <HabitRates rates={view.rates} />
                </View>
              ) : null}

              {loaded.goals.length > 0 ? (
                <View style={styles.block}>
                  <AppText variant="caption" tone="muted">
                    PROGRESS ON YOUR GOALS
                  </AppText>
                  <GoalsProgress
                    goals={loaded.goals}
                    note={(goal) => {
                      const count = loaded.stepsByGoal.get(goal.id) ?? 0;
                      return count > 0
                        ? `${plural(count, "step", "steps")} done this week`
                        : "No steps done this week";
                    }}
                    onOpen={(goal) => router.push(`/goal/${goal.id}`)}
                  />
                  {view.milestones.length > 0 ? (
                    <AppText variant="bodySmall" tone="secondary">
                      {`Milestones completed: ${view.milestones.map((m) => m.title).join(", ")}.`}
                    </AppText>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.block}>
                <AppText variant="caption" tone="muted">
                  LEFT UNFINISHED
                </AppText>
                <View
                  style={[
                    styles.summary,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {view.unfinished.length === 0 ? (
                    <AppText tone="secondary">
                      Nothing left over from the days that have passed.
                    </AppText>
                  ) : (
                    <>
                      <AppText variant="titleM">
                        {plural(view.unfinished.length, "item", "items")}
                      </AppText>
                      {view.unfinished.slice(0, 5).map((item) => (
                        <View key={item.key} style={styles.unfinishedRow}>
                          <AppText numberOfLines={1} style={styles.flex}>
                            {item.title}
                          </AppText>
                          <AppText variant="caption" tone="muted">
                            {`${item.kind}, ${formatShortDate(item.date)}`}
                          </AppText>
                        </View>
                      ))}
                      {view.unfinished.length > 5 ? (
                        <AppText variant="bodySmall" tone="muted">
                          {`and ${view.unfinished.length - 5} more`}
                        </AppText>
                      ) : null}
                      <AppText variant="bodySmall" tone="secondary">
                        Unfinished items are normal. Keep what matters and let
                        the rest go.
                      </AppText>
                    </>
                  )}
                  {view.moved > 0 ? (
                    <AppText variant="bodySmall" tone="muted">
                      {`${plural(view.moved, "task", "tasks")} this week ${view.moved === 1 ? "was" : "were"} moved to another day at least once.`}
                    </AppText>
                  ) : null}
                </View>
              </View>

              <View style={styles.block}>
                <AppText variant="titleM">Looking back</AppText>
                <AppTextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="What went well? What got in the way? What did you learn?"
                  multiline
                  maxLength={1000}
                  style={styles.notes}
                  accessibilityLabel="Looking back on the week"
                />
              </View>

              <View style={styles.block}>
                <AppText variant="titleM">Priorities for next week</AppText>
                <AppText variant="bodySmall" tone="secondary">
                  Up to three things that matter most. Fewer is fine.
                </AppText>
                {priorities.map((value, i) => (
                  <AppTextInput
                    key={i}
                    value={value}
                    onChangeText={(text) =>
                      setPriorities((prev) =>
                        prev.map((p, idx) => (idx === i ? text : p)),
                      )
                    }
                    placeholder={`Priority ${i + 1}`}
                    maxLength={80}
                    returnKeyType="next"
                    accessibilityLabel={`Priority ${i + 1}`}
                  />
                ))}
              </View>
            </>
          ) : null}
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
            label={reviewed ? "Save changes" : "Complete review"}
            onPress={save}
            loading={saving}
            disabled={loaded === null}
          />
          <Button
            label={reviewed ? "Close without saving" : "Skip for now"}
            variant="ghost"
            onPress={leave}
            disabled={saving}
          />
        </View>
      </KeyboardAvoidingView>
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
  block: { gap: spacing.sm },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  loader: { marginTop: spacing.xl },
  summary: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  unfinishedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  notes: { minHeight: 96, maxHeight: 220 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    borderTopWidth: 1,
  },
});
