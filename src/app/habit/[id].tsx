import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "@/components/ui/CheckCircle";
import { Chip } from "@/components/ui/Chip";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
    archiveHabit,
    deleteHabit,
    restoreHabit,
    setHabitCompletion,
} from "@/db/repositories/habits";
import { DayEditSheet } from "@/features/habits/components/DayEditSheet";
import { HabitActionsSheet } from "@/features/habits/components/HabitActionsSheet";
import { HabitCalendar } from "@/features/habits/components/HabitCalendar";
import { HabitLevelSheet } from "@/features/habits/components/HabitLevelSheet";
import { HabitStatsPanel } from "@/features/habits/components/HabitStatsPanel";
import { RecoveryCard } from "@/features/habits/components/RecoveryCard";
import { WeekDots } from "@/features/habits/components/WeekDots";
import { confirmDeleteHabit } from "@/features/habits/confirmDelete";
import { useHabit } from "@/features/habits/useHabit";
import { describeDate, toDateKey } from "@/lib/dates";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { isScheduledOn, summarizeSchedule } from "@/lib/habitDays";
import { countRecentMisses, nextScheduledDate } from "@/lib/habitRecovery";
import { computeHabitStats } from "@/lib/habitStats";
import { formatTime12 } from "@/lib/time";
import { LimitError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing } from "@/theme/tokens";
import type { HabitLevel } from "@/types/domain";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

export default function HabitDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { habit, setHabit, load } = useHabit(id);

  const [levelOpen, setLevelOpen] = useState(false);
  const [dayEdit, setDayEdit] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const hadHabit = useRef(false);
  const today = toDateKey();

  const stats = useMemo(
    () =>
      habit
        ? computeHabitStats({
            weekdays: habit.weekdays,
            startDate: habit.startDate,
            completionDates: habit.completions.map((c) => c.date),
            today,
          })
        : null,
    [habit, today],
  );

  // If the habit was deleted from the editor, leave this page once we are focused again.
  useEffect(() => {
    if (habit) hadHabit.current = true;
    else if (habit === null && hadHabit.current) router.replace("/habits");
  }, [habit, router]);

  if (habit === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (habit === null || stats === null) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Habit" />
        <View style={styles.missing}>
          <AppText variant="displayM">Habit not found</AppText>
          <AppText tone="secondary">It may have been deleted.</AppText>
          <Button
            label="Back to habits"
            onPress={() => router.replace("/habits")}
          />
        </View>
      </View>
    );
  }

  const active = habit.status === "active";
  const area = habit.category
    ? FOCUS_AREAS.find((a) => a.id === habit.category)
    : undefined;
  const scheduledToday = active && isScheduledOn(habit, today);
  const doneTodayLevel =
    habit.completions.find((c) => c.date === today)?.level ?? null;
  const upcoming = nextScheduledDate(habit, today, false);
  const misses = countRecentMisses(
    habit,
    habit.completions.map((c) => c.date),
    today,
  );
  const showRecovery =
    active && misses >= 1 && stats.currentStreak < 2 && doneTodayLevel === null;
  const schedule = `${summarizeSchedule(habit.weekdays)}${habit.timeOfDay ? `, ${formatTime12(habit.timeOfDay)}` : ""}`;

  const fail = (error: unknown) => {
    console.warn("Habit update failed", error);
    Alert.alert("Something went wrong", "Please try again.");
  };

  /** Records, changes or removes one day's completion. Updates the screen first, then saves. */
  const record = async (date: string, level: HabitLevel | null) => {
    const others = habit.completions.filter((c) => c.date !== date);
    const next = level === null ? others : [...others, { date, level }];
    setHabit({ ...habit, completions: next });
    try {
      await setHabitCompletion(habit.id, date, level);
    } catch (error) {
      fail(error);
      await load();
      return;
    }
    if (level !== null && date === today) {
      const after = computeHabitStats({
        weekdays: habit.weekdays,
        startDate: habit.startDate,
        completionDates: next.map((c) => c.date),
        today,
      });
      if (after.streakMilestoneToday !== null) {
        // Phase 9: the streak milestone celebration is triggered here.
        setTimeout(
          () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
              () => {},
            ),
          240,
        );
      }
    }
  };

  const requestToday = () => {
    if (doneTodayLevel !== null) record(today, null);
    else if (habit.minimumLabel) setLevelOpen(true);
    else record(today, "target");
  };

  const run = async (action: () => Promise<void>, reload = true) => {
    setBusy(true);
    try {
      await action();
      if (reload) await load();
    } catch (error) {
      if (error instanceof LimitError)
        Alert.alert("Active habit limit reached", error.message);
      else fail(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Habit"
        right={
          <View style={styles.headerActions}>
            <HeaderIconButton
              icon="create-outline"
              label="Edit habit"
              onPress={() => router.push(`/habit/edit/${habit.id}`)}
            />
            <HeaderIconButton
              icon="ellipsis-horizontal"
              label="Habit actions"
              onPress={() => setActionsOpen(true)}
            />
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AppText variant="displayL">{habit.name}</AppText>
          <View style={styles.chips}>
            {!active ? <Chip label="Archived" icon="archive-outline" /> : null}
            <Chip label={schedule} icon="repeat-outline" />
            {area && habit.category ? (
              <Chip
                label={area.label}
                icon={area.icon}
                tint={focusAreaTints[habit.category]}
              />
            ) : null}
          </View>
          {habit.description ? (
            <AppText tone="secondary">{habit.description}</AppText>
          ) : null}
        </View>

        {active ? (
          <View
            style={[
              styles.todayCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {scheduledToday ? (
              <>
                <CheckCircle
                  size={44}
                  checked={doneTodayLevel !== null}
                  label={
                    doneTodayLevel !== null
                      ? `Mark ${habit.name} as not done today`
                      : `Mark ${habit.name} as done today`
                  }
                  onPress={requestToday}
                />
                <View style={styles.todayText}>
                  <AppText variant="titleM">
                    {doneTodayLevel === null
                      ? "Not done yet today"
                      : doneTodayLevel === "minimum"
                        ? "Done today, minimum version"
                        : "Done today"}
                  </AppText>
                  <AppText variant="bodySmall" tone="secondary">
                    {doneTodayLevel === null
                      ? "Tap the circle when you have done it."
                      : "Nice work. Tap again to undo."}
                  </AppText>
                </View>
              </>
            ) : (
              <View style={styles.todayText}>
                <AppText variant="titleM">Not scheduled today</AppText>
                <AppText variant="bodySmall" tone="secondary">
                  {upcoming
                    ? `Next one: ${describeDate(upcoming, today)}`
                    : "There are no upcoming days in the schedule."}
                </AppText>
              </View>
            )}
          </View>
        ) : null}

        {showRecovery ? (
          <RecoveryCard
            totalCompletions={stats.totalCompletions}
            canDoNow={scheduledToday}
            nextLabel={
              upcoming ? describeDate(upcoming, today).toLowerCase() : null
            }
            onDoNow={requestToday}
          />
        ) : null}

        <View style={styles.block}>
          <AppText variant="caption" tone="muted">
            LAST 7 DAYS
          </AppText>
          <WeekDots habit={habit} today={today} />
        </View>

        <HabitStatsPanel stats={stats} />

        {habit.targetLabel || habit.minimumLabel ? (
          <View
            style={[
              styles.levels,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {habit.targetLabel ? (
              <View style={styles.levelRow}>
                <AppText variant="caption" tone="accent">
                  TARGET
                </AppText>
                <AppText>{habit.targetLabel}</AppText>
              </View>
            ) : null}
            {habit.minimumLabel ? (
              <View style={styles.levelRow}>
                <AppText variant="caption" tone="muted">
                  MINIMUM
                </AppText>
                <AppText>{habit.minimumLabel}</AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.block}>
          <AppText variant="caption" tone="muted">
            HISTORY
          </AppText>
          {active ? (
            <AppText variant="bodySmall" tone="secondary">
              Tap any day to add, change or remove a completion.
            </AppText>
          ) : null}
          <HabitCalendar
            habit={habit}
            today={today}
            editable={active}
            onSelectDay={setDayEdit}
          />
        </View>
      </ScrollView>

      <HabitLevelSheet
        visible={levelOpen}
        habitName={habit.name}
        levels={{ minimum: habit.minimumLabel, target: habit.targetLabel }}
        onClose={() => setLevelOpen(false)}
        onPick={(level) => {
          setLevelOpen(false);
          record(today, level);
        }}
      />

      <DayEditSheet
        visible={dayEdit !== null}
        date={dayEdit}
        habit={habit}
        onClose={() => setDayEdit(null)}
        onPick={(date, level) => {
          setDayEdit(null);
          record(date, level);
        }}
      />

      <HabitActionsSheet
        visible={actionsOpen}
        archived={!active}
        onClose={() => setActionsOpen(false)}
        onEdit={() => router.push(`/habit/edit/${habit.id}`)}
        onArchive={() => run(() => archiveHabit(habit.id))}
        onRestore={() => run(() => restoreHabit(habit.id))}
        onDelete={() =>
          confirmDeleteHabit(habit.id, {
            canArchive: active,
            onArchive: () => run(() => archiveHabit(habit.id)),
            onDelete: () =>
              run(async () => {
                await deleteHabit(habit.id);
                router.replace("/habits");
              }, false),
          })
        }
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.xl,
  },
  hero: { gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  todayText: { flex: 1, gap: 2 },
  block: { gap: spacing.sm },
  levels: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  levelRow: { gap: 2 },
  missing: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  busy: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
