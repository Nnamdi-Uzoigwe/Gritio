import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  archiveGoal,
  countActiveGoals,
  listGoals,
  restoreGoal,
} from "@/db/repositories/goals";
import { GoalFocusCard } from "@/features/goals/components/GoalFocusCard";
import { GoalLimitSheet } from "@/features/goals/components/GoalLimitSheet";
import { GoalRow } from "@/features/goals/components/GoalRow";
import { toDateKey } from "@/lib/dates";
import { LIMITS } from "@/lib/limits";
import { LimitError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, touch } from "@/theme/tokens";
import type { GoalStatus } from "@/types/domain";
import type { GoalListItem } from "@/types/goals";
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

const SEGMENTS: ReadonlyArray<{ value: GoalStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const EMPTY: Record<GoalStatus, { title: string; body: string }> = {
  active: {
    title: "No active goals yet",
    body: "A goal is something you want to achieve. Break it into steps and give it a place in your day.",
  },
  completed: {
    title: "Nothing completed yet",
    body: "Goals you finish will be kept here, so you can look back on them.",
  },
  archived: {
    title: "No archived goals",
    body: "Archive a goal to put it aside without losing any of it.",
  },
};

export default function GoalsTab() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [segment, setSegment] = useState<GoalStatus>("active");
  const [goals, setGoals] = useState<GoalListItem[] | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const requestId = useRef(0);
  const today = toDateKey();

  const load = useCallback(async (status: GoalStatus) => {
    const id = ++requestId.current;
    try {
      const [list, count] = await Promise.all([
        listGoals(status),
        countActiveGoals(),
      ]);
      if (id !== requestId.current) return;
      setFailed(false);
      setGoals(list);
      setActiveCount(count);
    } catch (error) {
      if (id !== requestId.current) return;
      console.warn("Could not load goals", error);
      setFailed(true);
      setGoals((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(segment);
    }, [load, segment]),
  );

  const atLimit = activeCount >= LIMITS.maxActiveGoals;

  const handleNew = () => {
    if (atLimit) setLimitOpen(true);
    else router.push("/goal/new");
  };

  const handleSwipe = async (goal: GoalListItem) => {
    try {
      if (goal.status === "archived") await restoreGoal(goal.id);
      else await archiveGoal(goal.id);
      await load(segment);
    } catch (error) {
      if (error instanceof LimitError) {
        setLimitOpen(true);
      } else {
        console.warn("Could not update goal", error);
        Alert.alert("Something went wrong", "Please try again.");
      }
    }
  };

  const open = (goal: GoalListItem) => router.push(`/goal/${goal.id}`);
  const focusGoal =
    segment === "active" && goals && goals.length > 0 ? goals[0] : null;
  const restGoals = goals ? (focusGoal ? goals.slice(1) : goals) : [];

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
            <AppText variant="displayL">Goals</AppText>
            <AppText tone={atLimit ? "accent" : "secondary"}>
              {`${activeCount} of ${LIMITS.maxActiveGoals} active goals`}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New goal"
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
            setGoals(null);
          }}
        />

        {goals === null ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {failed && goals !== null && goals.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="titleM">Could not load your goals</AppText>
            <AppText tone="secondary">
              Your data is safe on this device. Please try again.
            </AppText>
            <Button label="Try again" onPress={() => load(segment)} />
          </View>
        ) : null}

        {goals !== null && goals.length === 0 && !failed ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name="flag-outline"
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
                label="Create a goal"
                onPress={handleNew}
                style={styles.emptyButton}
              />
            ) : null}
          </View>
        ) : null}

        {focusGoal ? (
          <GoalFocusCard
            goal={focusGoal}
            today={today}
            onPress={() => open(focusGoal)}
          />
        ) : null}

        {restGoals.length > 0 ? (
          <View style={styles.list}>
            {restGoals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                today={today}
                swipeLabel={goal.status === "archived" ? "Restore" : "Archive"}
                swipeIcon={
                  goal.status === "archived"
                    ? "arrow-undo-outline"
                    : "archive-outline"
                }
                onSwipe={() => handleSwipe(goal)}
                onPress={() => open(goal)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <GoalLimitSheet
        visible={limitOpen}
        onClose={() => setLimitOpen(false)}
        onChanged={() => load(segment)}
        onCreate={() => router.push("/goal/new")}
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
