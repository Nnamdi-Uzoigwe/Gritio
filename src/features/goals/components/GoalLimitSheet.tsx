import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { archiveGoal, completeGoal, listGoals } from "@/db/repositories/goals";
import { goalLimitMessage, LIMITS } from "@/lib/limits";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { confirmComplete } from "../confirmComplete";

type Props = {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
  onCreate: () => void;
};

export function GoalLimitSheet({
  visible,
  onClose,
  onChanged,
  onCreate,
}: Props) {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<GoalListItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setGoals(await listGoals("active"));
    } catch (error) {
      console.warn("Could not load goals", error);
      setFailed(true);
      setGoals([]);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setGoals(null);
      load();
    }
  }, [visible, load]);

  const run = async (goal: GoalListItem, action: () => Promise<void>) => {
    setBusyId(goal.id);
    try {
      await action();
      await load();
      onChanged();
    } catch (error) {
      console.warn("Could not update goal", error);
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  };

  const hasRoom = goals !== null && goals.length < LIMITS.maxActiveGoals;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={hasRoom ? "You have room now" : "Active goal limit reached"}
    >
      <View style={styles.body}>
        <AppText tone="secondary">
          {hasRoom
            ? "A spot is free. You can create your next goal."
            : goalLimitMessage}
        </AppText>

        {goals === null ? <ActivityIndicator color={colors.primary} /> : null}
        {failed ? (
          <AppText variant="bodySmall" tone="error">
            Something went wrong. Please try again.
          </AppText>
        ) : null}

        {hasRoom ? (
          <Button
            label="Create a goal"
            onPress={() => {
              onClose();
              onCreate();
            }}
          />
        ) : null}

        {goals && goals.length > 0 ? (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {goals.map((goal) => (
              <View
                key={goal.id}
                style={[styles.item, { backgroundColor: colors.surfaceSunken }]}
              >
                <AppText variant="titleM" numberOfLines={2}>
                  {goal.title}
                </AppText>
                <View style={styles.actions}>
                  <Button
                    label="Archive"
                    variant="secondary"
                    disabled={busyId !== null}
                    loading={busyId === goal.id}
                    onPress={() => run(goal, () => archiveGoal(goal.id))}
                    style={styles.flex}
                  />
                  <Button
                    label="Complete"
                    variant="secondary"
                    disabled={busyId !== null}
                    onPress={() =>
                      confirmComplete(goal, () =>
                        run(goal, () => completeGoal(goal.id)),
                      )
                    }
                    style={styles.flex}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  list: { maxHeight: 340 },
  item: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});
