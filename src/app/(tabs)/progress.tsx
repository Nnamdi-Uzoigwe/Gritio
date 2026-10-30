import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { listGoals } from "@/db/repositories/goals";
import {
  loadProgressData,
  type ProgressData,
} from "@/db/repositories/progress";
import { getReview, type WeeklyReview } from "@/db/repositories/reviews";
import { Accomplishments } from "@/features/progress/components/Accomplishments";
import { DayBars } from "@/features/progress/components/DayBars";
import { GoalsProgress } from "@/features/progress/components/GoalsProgress";
import { HabitRates } from "@/features/progress/components/HabitRates";
import { HowItWorksSheet } from "@/features/progress/components/HowItWorksSheet";
import { PeriodHeader } from "@/features/progress/components/PeriodHeader";
import { WeeklyReviewCard } from "@/features/progress/components/WeeklyReviewCard";
import { formatShortDate, startOfWeek, toDateKey } from "@/lib/dates";
import {
  computeDayStats,
  describePeriod,
  habitRates,
  periodFor,
  shiftPeriod,
  summarize,
  trendPoints,
  type PeriodKind,
} from "@/lib/progressStats";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Loaded = {
  current: ProgressData;
  previous: ProgressData;
  goals: GoalListItem[];
  review: WeeklyReview | null;
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default function ProgressTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [kind, setKind] = useState<PeriodKind>("week");
  const [anchor, setAnchor] = useState(() => toDateKey());
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const requestId = useRef(0);

  const today = toDateKey();
  const period = useMemo(() => periodFor(kind, anchor), [kind, anchor]);
  const info = describePeriod(period, today);
  const previousLabel = kind === "week" ? "week" : "month";

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const prev = shiftPeriod(period, -1);
      const [current, previous, goals, review] = await Promise.all([
        loadProgressData(period.from, period.to),
        loadProgressData(prev.from, prev.to),
        listGoals("active"),
        getReview(startOfWeek(toDateKey())),
      ]);
      if (id !== requestId.current) return;
      setLoaded({ current, previous, goals, review });
      setFailed(false);
    } catch (error) {
      if (id !== requestId.current) return;
      console.warn("Could not load progress", error);
      setFailed(true);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const view = useMemo(() => {
    if (!loaded) return null;
    const prevPeriod = shiftPeriod(period, -1);
    const days = computeDayStats({
      from: period.from,
      to: period.to,
      today,
      tasks: loaded.current.tasks,
      habits: loaded.current.habits,
      steps: loaded.current.steps,
    });
    const prevDays = computeDayStats({
      from: prevPeriod.from,
      to: prevPeriod.to,
      today,
      tasks: loaded.previous.tasks,
      habits: loaded.previous.habits,
      steps: loaded.previous.steps,
    });
    const summary = summarize(days, today);
    const prevSummary = summarize(prevDays, today);
    return {
      days,
      summary,
      trend: trendPoints(summary, prevSummary),
      rates: habitRates(loaded.current.habits, period.from, period.to, today),
      reflectionCount: loaded.current.reflectionDates.length,
      milestones: loaded.current.accomplishments.filter(
        (a) => a.kind === "milestone",
      ).length,
    };
  }, [loaded, period, today]);

  const changePeriod = (next: string) => {
    setLoaded(null);
    setSelected(null);
    setAnchor(next);
  };

  const selectedStat = view?.days.find((d) => d.date === selected) ?? null;

  const trendText =
    view?.trend == null
      ? null
      : view.trend > 0
        ? `${plural(view.trend, "point", "points")} higher than the previous ${previousLabel}`
        : view.trend < 0
          ? `${plural(Math.abs(view.trend), "point", "points")} lower than the previous ${previousLabel}`
          : `Same as the previous ${previousLabel}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="displayL">Progress</AppText>

        <PeriodHeader
          kind={kind}
          onKindChange={(next) => {
            setKind(next);
            changePeriod(toDateKey());
          }}
          label={info.label}
          detail={info.detail}
          canNext={!info.isCurrent}
          onPrev={() => changePeriod(shiftPeriod(period, -1).from)}
          onNext={() => changePeriod(shiftPeriod(period, 1).from)}
        />

        {loaded === null && !failed ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {failed && loaded === null ? (
          <View style={styles.gap}>
            <AppText variant="titleM">Could not load your progress</AppText>
            <AppText tone="secondary">
              Your data is safe on this device. Please try again.
            </AppText>
            <Button label="Try again" onPress={load} />
          </View>
        ) : null}

        {loaded && view ? (
          <>
            {view.summary.total === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={26}
                    color={colors.primaryText}
                  />
                </View>
                <AppText variant="titleL" style={styles.center}>
                  Nothing to measure yet
                </AppText>
                <AppText tone="secondary" style={styles.center}>
                  Your progress shows up here once you have tasks, habits or
                  goal steps on your days and start completing them.
                </AppText>
              </View>
            ) : (
              <View style={styles.hero}>
                <AppText
                  variant="displayXL"
                  tone={view.summary.percent === 100 ? "success" : "default"}
                >
                  {`${view.summary.percent}%`}
                </AppText>
                <AppText tone="secondary">
                  {`${view.summary.done} of ${view.summary.total} commitments done`}
                </AppText>
                {trendText ? (
                  <Chip label={trendText} icon="trending-up-outline" />
                ) : null}
              </View>
            )}

            {view.days.some((d) => !d.isFuture) ? (
              <View style={styles.block}>
                <DayBars
                  days={view.days}
                  today={today}
                  kind={kind}
                  selected={selected}
                  onSelect={setSelected}
                />
                <AppText
                  variant="bodySmall"
                  tone="secondary"
                  style={styles.center}
                  accessibilityLiveRegion="polite"
                >
                  {selectedStat
                    ? selectedStat.total === 0
                      ? `${formatShortDate(selectedStat.date)}: nothing scheduled`
                      : `${formatShortDate(selectedStat.date)}: ${selectedStat.done} of ${selectedStat.total} done`
                    : "Tap a bar to see that day."}
                </AppText>
              </View>
            ) : null}

            {view.rates.length > 0 ? (
              <View style={styles.block}>
                <AppText variant="caption" tone="muted">
                  HABITS
                </AppText>
                <HabitRates rates={view.rates} />
              </View>
            ) : null}

            {loaded.goals.length > 0 ? (
              <View style={styles.block}>
                <AppText variant="caption" tone="muted">
                  GOALS
                </AppText>
                <GoalsProgress
                  goals={loaded.goals}
                  onOpen={(goal) => router.push(`/goal/${goal.id}`)}
                />
                <AppText variant="bodySmall" tone="secondary">
                  {view.milestones > 0
                    ? `${plural(view.milestones, "milestone", "milestones")} completed in this ${previousLabel}.`
                    : `No milestones completed in this ${previousLabel}.`}
                </AppText>
              </View>
            ) : null}

            <View style={styles.block}>
              <AppText variant="caption" tone="muted">
                REFLECTIONS
              </AppText>
              <View
                style={[
                  styles.reflectCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.reflectText}>
                  <AppText variant="titleM">
                    {view.reflectionCount > 0
                      ? `You reflected on ${plural(view.reflectionCount, "day", "days")}`
                      : "No reflections in this period"}
                  </AppText>
                  <AppText variant="bodySmall" tone="secondary">
                    Reflecting is always optional.
                  </AppText>
                </View>
                <Button
                  label="History"
                  variant="ghost"
                  onPress={() => router.push("/reflection-history")}
                />
              </View>
            </View>

            {loaded.current.accomplishments.length > 0 ? (
              <View style={styles.block}>
                <AppText variant="caption" tone="muted">
                  ACCOMPLISHED IN THIS PERIOD
                </AppText>
                <Accomplishments items={loaded.current.accomplishments} />
              </View>
            ) : null}

            <WeeklyReviewCard
              review={loaded.review}
              onOpen={() => router.push("/weekly-review")}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How these numbers are calculated"
              onPress={() => setHelpOpen(true)}
              style={styles.help}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.primaryText}
              />
              <AppText variant="label" tone="accent">
                How these numbers are calculated
              </AppText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <HowItWorksSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  loader: { marginTop: spacing.xxl },
  gap: { gap: spacing.md },
  center: { textAlign: "center" },
  hero: { alignItems: "center", gap: spacing.sm },
  block: { gap: spacing.sm },
  emptyCard: {
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  reflectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  reflectText: { flex: 1, gap: 2 },
  help: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 48,
  },
});
