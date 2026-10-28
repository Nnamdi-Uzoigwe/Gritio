import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
    archiveHabit,
    deleteHabit,
    listHabits,
} from "@/db/repositories/habits";
import { habitLimitMessage, LIMITS } from "@/lib/limits";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { HabitItem } from "@/types/habits";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { confirmDeleteHabit } from "../confirmDelete";

type Props = {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
  onCreate: () => void;
};

export function HabitLimitSheet({
  visible,
  onClose,
  onChanged,
  onCreate,
}: Props) {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<HabitItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setHabits(await listHabits("active"));
    } catch (error) {
      console.warn("Could not load habits", error);
      setFailed(true);
      setHabits([]);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setHabits(null);
      load();
    }
  }, [visible, load]);

  const run = async (habit: HabitItem, action: () => Promise<void>) => {
    setBusyId(habit.id);
    try {
      await action();
      await load();
      onChanged();
    } catch (error) {
      console.warn("Could not update habit", error);
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  };

  const hasRoom = habits !== null && habits.length < LIMITS.maxActiveHabits;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={hasRoom ? "You have room now" : "Active habit limit reached"}
    >
      <View style={styles.body}>
        <AppText tone="secondary">
          {hasRoom
            ? "A spot is free. You can create your next habit."
            : habitLimitMessage}
        </AppText>

        {habits === null ? <ActivityIndicator color={colors.primary} /> : null}
        {failed ? (
          <AppText variant="bodySmall" tone="error">
            Something went wrong. Please try again.
          </AppText>
        ) : null}

        {hasRoom ? (
          <Button
            label="Create a habit"
            onPress={() => {
              onClose();
              onCreate();
            }}
          />
        ) : null}

        {habits && habits.length > 0 ? (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {habits.map((habit) => (
              <View
                key={habit.id}
                style={[styles.item, { backgroundColor: colors.surfaceSunken }]}
              >
                <AppText variant="titleM" numberOfLines={2}>
                  {habit.name}
                </AppText>
                <View style={styles.actions}>
                  <Button
                    label="Archive"
                    variant="secondary"
                    disabled={busyId !== null}
                    loading={busyId === habit.id}
                    onPress={() => run(habit, () => archiveHabit(habit.id))}
                    style={styles.flex}
                  />
                  <Button
                    label="Delete"
                    variant="secondary"
                    disabled={busyId !== null}
                    onPress={() =>
                      confirmDeleteHabit(habit.id, {
                        canArchive: true,
                        onArchive: () =>
                          run(habit, () => archiveHabit(habit.id)),
                        onDelete: () => run(habit, () => deleteHabit(habit.id)),
                      })
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
