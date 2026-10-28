import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
    getOverdueTasks,
    moveTasksToDate,
    type OverdueTask,
} from "@/db/repositories/tasks";
import { describeDate } from "@/lib/dates";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  today: string;
  total: number;
  done: number;
  onClose: () => void;
  onChanged: () => void;
};

export function PlanReviewSheet({
  visible,
  today,
  total,
  done,
  onClose,
  onChanged,
}: Props) {
  const { colors } = useTheme();
  const [overdue, setOverdue] = useState<OverdueTask[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setOverdue(await getOverdueTasks(today));
    } catch (error) {
      console.warn("Could not load overdue tasks", error);
      setFailed(true);
      setOverdue([]);
    }
  }, [today]);

  useEffect(() => {
    if (visible) {
      setOverdue(null);
      load();
    }
  }, [visible, load]);

  const move = async (ids: string[]) => {
    setBusy(true);
    try {
      await moveTasksToDate(ids, today);
      await load();
      onChanged();
    } catch (error) {
      console.warn("Could not move tasks", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Review today's plan"
    >
      <View style={styles.body}>
        <AppText tone="secondary">
          {total === 0
            ? "Nothing planned for today yet."
            : `${total} ${total === 1 ? "commitment" : "commitments"} today, ${done} done.`}
        </AppText>

        {overdue === null ? <ActivityIndicator color={colors.primary} /> : null}

        {failed ? (
          <AppText variant="bodySmall" tone="error">
            Could not update the plan. Please try again.
          </AppText>
        ) : null}

        {overdue !== null && overdue.length === 0 && !failed ? (
          <AppText variant="bodySmall" tone="muted">
            Nothing left over from earlier days. Your plan is clear.
          </AppText>
        ) : null}

        {overdue !== null && overdue.length > 0 ? (
          <>
            <AppText variant="caption" tone="accent">
              FROM EARLIER DAYS
            </AppText>
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {overdue.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.item,
                    { backgroundColor: colors.surfaceSunken },
                  ]}
                >
                  <View style={styles.itemText}>
                    <AppText variant="titleM" numberOfLines={2}>
                      {task.title}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {describeDate(task.date, today)}
                      {task.time ? `, ${formatTime12(task.time)}` : ""}
                    </AppText>
                  </View>
                  <Button
                    label="Move to today"
                    variant="ghost"
                    disabled={busy}
                    onPress={() => move([task.id])}
                  />
                </View>
              ))}
            </ScrollView>
            <Button
              label={overdue.length > 1 ? "Move all to today" : "Move to today"}
              loading={busy}
              onPress={() => move(overdue.map((t) => t.id))}
            />
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  list: { maxHeight: 260 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  itemText: { flex: 1, gap: 2 },
});
