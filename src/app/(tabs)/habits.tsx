import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  archiveHabit,
  countActiveHabits,
  listHabits,
  restoreHabit,
  setHabitCompletion,
} from "@/db/repositories/habits";
import { HabitLevelSheet } from "@/features/habits/components/HabitLevelSheet";
import { HabitLimitSheet } from "@/features/habits/components/HabitLimitSheet";
import { HabitRow } from "@/features/habits/components/HabitRow";
import { toDateKey } from "@/lib/dates";
import { isScheduledOn } from "@/lib/habitDays";
import { LIMITS } from "@/lib/limits";
import { LimitError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, touch } from "@/theme/tokens";
import type { HabitLevel, HabitStatus } from "@/types/domain";
import type { HabitItem } from "@/types/habits";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SEGMENTS: ReadonlyArray<{ value: HabitStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const EMPTY: Record<HabitStatus, { title: string; body: string }> = {
  active: {
    title: "No habits yet",
    body: "Start small. One habit you can do on most days is worth more than five you cannot keep up.",
  },
  archived: {
    title: "No archived habits",
    body: "Archive a habit to pause it without losing your history.",
  },
};

export default function HabitsTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [segment, setSegment] = useState<HabitStatus>("active");
  const [habits, setHabits] = useState<HabitItem[] | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [levelHabitId, setLevelHabitId] = useState<string | null>(null);
  const requestId = useRef(0);
  const today = toDateKey();

  const load = useCallback(async (status: HabitStatus) => {
    const id = ++requestId.current;
    try {
      const [list, count] = await Promise.all([
        listHabits(status),
        countActiveHabits(),
      ]);
      if (id !== requestId.current) return;
      setFailed(false);
      setHabits(list);
      setActiveCount(count);
    } catch (error) {
      if (id !== requestId.current) return;
      console.warn("Could not load habits", error);
      setFailed(true);
      setHabits((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(segment);
    }, [load, segment]),
  );

  const atLimit = activeCount >= LIMITS.maxActiveHabits;
  const levelHabit = habits?.find((h) => h.id === levelHabitId) ?? null;

  const scheduledToday =
    segment === "active" && habits
      ? habits.filter((h) => isScheduledOn(h, today))
      : [];
  const doneToday = scheduledToday.filter((h) =>
    h.completions.some((c) => c.date === today),
  ).length;

  const handleNew = () => {
    if (atLimit) setLimitOpen(true);
    else router.push("/habit/new");
  };

  const toggleToday = async (habit: HabitItem, level?: HabitLevel) => {
    const has = habit.completions.some((c) => c.date === today);
    const next = !has;
    const chosen: HabitLevel = level ?? "target";
    setHabits((prev) =>
      prev
        ? prev.map((h) =>
            h.id === habit.id
              ? {
                  ...h,
                  completions: next
                    ? [...h.completions, { date: today, level: chosen }]
                    : h.completions.filter((c) => c.date !== today),
                }
              : h,
          )
        : prev,
    );
    try {
      await setHabitCompletion(habit.id, today, next ? chosen : null);
    } catch (error) {
      console.warn("Could not update habit", error);
      Alert.alert(
        "Could not update",
        "Something went wrong. Please try again.",
      );
      await load(segment);
    }
  };

  const requestToggle = (habit: HabitItem) => {
    const has = habit.completions.some((c) => c.date === today);
    if (!has && habit.minimumLabel) setLevelHabitId(habit.id);
    else toggleToday(habit);
  };

  const handleSwipe = async (habit: HabitItem) => {
    try {
      if (habit.status === "archived") await restoreHabit(habit.id);
      else await archiveHabit(habit.id);
      await load(segment);
    } catch (error) {
      if (error instanceof LimitError) setLimitOpen(true);
      else {
        console.warn("Could not update habit", error);
        Alert.alert("Something went wrong", "Please try again.");
      }
    }
  };

  const open = (habit: HabitItem) => router.push(`/habit/${habit.id}`);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="displayL">Habits</AppText>
            <AppText
              tone={atLimit ? "accent" : "secondary"}
            >{`${activeCount} of ${LIMITS.maxActiveHabits} active habits`}</AppText>
            {segment === "active" && scheduledToday.length > 0 ? (
              <AppText variant="bodySmall" tone="muted">
                {`${doneToday} of ${scheduledToday.length} done today`}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New habit"
            onPress={handleNew}
            style={[styles.add, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={28} color={colors.onPrimary} />
          </Pressable>
        </View>

        <SegmentedControl
          options={SEGMENTS}
          value={segment}
          onChange={(next) => {
            setSegment(next);
            setHabits(null);
          }}
        />

        {habits === null ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {failed && habits !== null && habits.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="titleM">Could not load your habits</AppText>
            <AppText tone="secondary">
              Your data is safe on this device. Please try again.
            </AppText>
            <Button label="Try again" onPress={() => load(segment)} />
          </View>
        ) : null}

        {habits !== null && habits.length === 0 && !failed ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="repeat-outline"
                size={28}
                color={colors.primaryText}
              />
            </View>
            <AppText variant="displayM" style={styles.center}>
              {EMPTY[segment].title}
            </AppText>
            <AppText tone="secondary" style={styles.center}>
              {EMPTY[segment].body}
            </AppText>
            {segment === "active" ? (
              <Button
                label="Create a habit"
                onPress={handleNew}
                style={styles.emptyButton}
              />
            ) : null}
          </View>
        ) : null}

        {habits && habits.length > 0 ? (
          <View style={styles.list}>
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                today={today}
                swipeLabel={habit.status === "archived" ? "Restore" : "Archive"}
                swipeIcon={
                  habit.status === "archived"
                    ? "arrow-undo-outline"
                    : "archive-outline"
                }
                onSwipe={() => handleSwipe(habit)}
                onOpen={() => open(habit)}
                onToggleToday={() => requestToggle(habit)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <HabitLevelSheet
        visible={levelHabit !== null}
        habitName={levelHabit?.name ?? ""}
        levels={
          levelHabit
            ? {
                minimum: levelHabit.minimumLabel,
                target: levelHabit.targetLabel,
              }
            : null
        }
        onClose={() => setLevelHabitId(null)}
        onPick={(level) => {
          const habit = levelHabit;
          setLevelHabitId(null);
          if (habit) toggleToday(habit, level);
        }}
      />

      <HabitLimitSheet
        visible={limitOpen}
        onClose={() => setLimitOpen(false)}
        onChanged={() => load(segment)}
        onCreate={() => router.push("/habit/new")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xs },
  add: {
    width: touch.minTarget + 4,
    height: touch.minTarget + 4,
    borderRadius: (touch.minTarget + 4) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: { marginTop: spacing.xxl },
  list: { gap: spacing.sm },
  empty: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButton: { alignSelf: "stretch", marginTop: spacing.md },
  center: { textAlign: "center" },
});
