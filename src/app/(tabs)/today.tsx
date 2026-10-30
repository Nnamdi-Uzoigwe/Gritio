import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { FloatingActionMenu } from "@/components/ui/FloatingActionMenu";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { HabitLevelSheet } from "@/features/habits/components/HabitLevelSheet";
import {
  AddTaskSheet,
  type EditableTask,
} from "@/features/tasks/components/AddTaskSheet";
import { CommitmentRow } from "@/features/today/components/CommitmentRow";
import { EmptyDay } from "@/features/today/components/EmptyDay";
import { PlanReviewSheet } from "@/features/today/components/PlanReviewSheet";
import { ReflectRow } from "@/features/today/components/ReflectRow";
import { RescheduleSheet } from "@/features/today/components/RescheduleSheet";
import { RuleOfDay } from "@/features/today/components/RuleOfDay";
import { TaskDetailsSheet } from "@/features/today/components/TaskDetailsSheet";
import { useToday } from "@/features/today/useToday";
import { formatLongDate } from "@/lib/dates";
import { getGreeting } from "@/lib/greeting";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import type { Commitment } from "@/types/today";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TodayScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    date,
    name,
    items,
    overdueCount,
    unread,
    status,
    reload,
    toggle,
    reschedule,
    removeTask,
  } = useToday();

  const [taskSheet, setTaskSheet] = useState<{
    visible: boolean;
    initial: EditableTask | null;
  }>({
    visible: false,
    initial: null,
  });
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [rescheduleKey, setRescheduleKey] = useState<string | null>(null);
  const [levelKey, setLevelKey] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const detail = items.find((i) => i.key === detailKey) ?? null;
  const rescheduleTarget = items.find((i) => i.key === rescheduleKey) ?? null;
  const levelItem = items.find((i) => i.key === levelKey) ?? null;

  const pending = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);
  const timed = pending.filter((i) => i.time !== null);
  const anytime = pending.filter((i) => i.time === null);
  const total = items.length;
  const doneCount = completed.length;
  const allDone = total > 0 && pending.length === 0;
  const progress = total > 0 ? doneCount / total : 0;

  // Gentle haptic the moment the last item gets done (not on opening an already finished day).
  const seeded = useRef(false);
  const prevAllDone = useRef(false);
  useEffect(() => {
    if (status !== "ready") return;
    if (!seeded.current) {
      seeded.current = true;
      prevAllDone.current = allDone;
      return;
    }
    if (allDone && !prevAllDone.current) {
      // Phase 9: the once per day celebration overlay is triggered here.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    prevAllDone.current = allDone;
  }, [allDone, status]);

  const heroLine = allDone
    ? "All done for today."
    : doneCount === 0
      ? "Start with the easiest one."
      : `${pending.length} left. Keep going.`;

  const openAdd = () => setTaskSheet({ visible: true, initial: null });
  const openEdit = (item: Commitment) =>
    setTaskSheet({
      visible: true,
      initial: {
        id: item.id,
        title: item.title,
        description: item.description,
        date,
        time: item.time,
      },
    });

  const needsLevel = (item: Commitment) =>
    item.source === "habit" && !item.done && Boolean(item.levels?.minimum);

  // A habit with a minimum version asks which version you did. Everything else completes in one tap.
  const handleToggle = (item: Commitment) => {
    if (needsLevel(item)) setLevelKey(item.key);
    else toggle(item);
  };

  const renderRow = (item: Commitment) => (
    <Animated.View
      key={item.key}
      layout={LinearTransition.springify().damping(18)}
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
    >
      <CommitmentRow
        item={item}
        onToggle={() => handleToggle(item)}
        onOpen={() => setDetailKey(item.key)}
        onPostpone={
          item.source === "habit" ? undefined : () => setRescheduleKey(item.key)
        }
      />
    </Animated.View>
  );

  const section = (label: string, list: Commitment[]) =>
    list.length > 0 ? (
      <View style={styles.section} key={label}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <View style={styles.list}>{list.map(renderRow)}</View>
      </View>
    ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            colors={[colors.primary]}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.greeting}>
            <AppText variant="displayL">{getGreeting(name)}</AppText>
            <AppText tone="secondary">{formatLongDate(date)}</AppText>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
              }
              onPress={() => router.push("/notifications")}
              style={[
                styles.iconButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.text}
              />
              {unread > 0 ? (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.surface,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push("/settings")}
              style={[
                styles.iconButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {status === "ready" ? <RuleOfDay /> : null}

        {status === "loading" ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {status === "error" ? (
          <View style={styles.errorBox}>
            <AppText variant="titleM">Could not load your day</AppText>
            <AppText tone="secondary">
              Your data is safe on this device. Please try again.
            </AppText>
            <Button label="Try again" onPress={reload} />
          </View>
        ) : null}

        {status === "ready" && total === 0 ? (
          <EmptyDay onAddTask={openAdd} />
        ) : null}

        {status === "ready" && total > 0 ? (
          <>
            <View style={styles.hero}>
              <ProgressRing
                progress={progress}
                size={176}
                strokeWidth={14}
                color={allDone ? colors.success : colors.primary}
                trackColor={colors.surfaceSunken}
              >
                <CountUp
                  value={doneCount}
                  tone={allDone ? "success" : "default"}
                />
                <AppText variant="caption" tone="muted">
                  {`of ${total} done`}
                </AppText>
              </ProgressRing>
              <AppText
                variant="titleM"
                tone={allDone ? "success" : "secondary"}
                accessibilityLiveRegion="polite"
              >
                {heroLine}
              </AppText>
            </View>

            {overdueCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${overdueCount} unfinished from earlier days. Review plan.`}
                onPress={() => setPlanOpen(true)}
                style={[
                  styles.overdue,
                  { backgroundColor: colors.warningSoft },
                ]}
              >
                <AppText variant="bodySmall" style={styles.overdueText}>
                  {`${overdueCount} unfinished from earlier days`}
                </AppText>
                <AppText variant="label" tone="accent">
                  Review
                </AppText>
              </Pressable>
            ) : null}

            {section("SCHEDULED", timed)}
            {section(timed.length > 0 ? "ANYTIME TODAY" : "TO DO", anytime)}

            {completed.length > 0 ? (
              <View style={styles.section}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Completed, ${completed.length}. ${showCompleted ? "Collapse" : "Expand"}.`}
                  onPress={() => setShowCompleted((v) => !v)}
                  style={styles.completedHeader}
                >
                  <AppText variant="caption" tone="muted">
                    {`COMPLETED (${completed.length})`}
                  </AppText>
                  <Ionicons
                    name={showCompleted ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
                {showCompleted ? (
                  <View style={styles.list}>{completed.map(renderRow)}</View>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        {status === "ready" ? <ReflectRow today={date} /> : null}
      </ScrollView>

      <FloatingActionMenu
        actions={[
          {
            key: "task",
            label: "Add task",
            icon: "add-circle-outline",
            onPress: openAdd,
          },
          {
            key: "habit",
            label: "Create habit",
            icon: "repeat-outline",
            onPress: () => router.push("/habit/new"),
          },
          {
            key: "goal",
            label: "Create goal",
            icon: "flag-outline",
            onPress: () => router.push("/goal/new"),
          },
          {
            key: "review",
            label: "Review plan",
            icon: "list-outline",
            onPress: () => setPlanOpen(true),
          },
        ]}
      />

      <AddTaskSheet
        visible={taskSheet.visible}
        today={date}
        initial={taskSheet.initial}
        onClose={() => setTaskSheet((s) => ({ ...s, visible: false }))}
        onSaved={reload}
      />

      <TaskDetailsSheet
        item={detail}
        onClose={() => setDetailKey(null)}
        onToggle={(item) => {
          if (needsLevel(item)) {
            // Let the details sheet finish closing before the next sheet opens.
            setDetailKey(null);
            setTimeout(() => setLevelKey(item.key), 280);
            return;
          }
          toggle(item);
          setDetailKey(null);
        }}
        onReschedule={(item) => {
          setDetailKey(null);
          setRescheduleKey(item.key);
        }}
        onEdit={(item) => {
          setDetailKey(null);
          openEdit(item);
        }}
        onDelete={(item) => {
          setDetailKey(null);
          removeTask(item.id);
        }}
      />

      <RescheduleSheet
        visible={rescheduleTarget !== null}
        today={date}
        onClose={() => setRescheduleKey(null)}
        onPick={(newDate) => {
          if (rescheduleTarget) reschedule(rescheduleTarget, newDate);
          setRescheduleKey(null);
        }}
      />

      <HabitLevelSheet
        visible={levelItem !== null}
        habitName={levelItem?.title ?? ""}
        levels={levelItem?.levels ?? null}
        onClose={() => setLevelKey(null)}
        onPick={(level) => {
          const item = levelItem;
          setLevelKey(null);
          if (item) toggle(item, level);
        }}
      />

      <PlanReviewSheet
        visible={planOpen}
        today={date}
        total={total}
        done={doneCount}
        onClose={() => setPlanOpen(false)}
        onChanged={reload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  greeting: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.xs },
  iconButton: {
    width: touch.minTarget,
    height: touch.minTarget,
    borderRadius: touch.minTarget / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  loader: { marginTop: spacing.xxxl },
  errorBox: { gap: spacing.md, paddingTop: spacing.xl },
  hero: { alignItems: "center", gap: spacing.lg },
  overdue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    minHeight: touch.minTarget,
    borderRadius: radii.lg,
  },
  overdueText: { flex: 1 },
  section: { gap: spacing.sm },
  list: { gap: spacing.sm },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 32,
  },
});
