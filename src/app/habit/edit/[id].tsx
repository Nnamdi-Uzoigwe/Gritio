import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  archiveHabit,
  deleteHabit,
  getHabit,
  restoreHabit,
  updateHabit,
} from "@/db/repositories/habits";
import { HabitForm } from "@/features/habits/components/HabitForm";
import { confirmDeleteHabit } from "@/features/habits/confirmDelete";
import { LimitError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import type { HabitItem } from "@/types/habits";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function EditHabitScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [habit, setHabit] = useState<HabitItem | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getHabit(id)
      .then(setHabit)
      .catch((error) => {
        console.warn("Could not load habit", error);
        setHabit(null);
      });
  }, [id]);

  if (habit === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (habit === null) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Edit habit" />
        <View style={styles.missing}>
          <AppText variant="displayM">Habit not found</AppText>
          <Button
            label="Back to habits"
            onPress={() => router.replace("/habits")}
          />
        </View>
      </View>
    );
  }

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/habits");
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      leave();
    } catch (error) {
      if (error instanceof LimitError)
        Alert.alert("Active habit limit reached", error.message);
      else {
        console.warn("Could not update habit", error);
        Alert.alert("Something went wrong", "Please try again.");
      }
      setBusy(false);
    }
  };

  const archived = habit.status === "archived";

  return (
    <HabitForm
      mode="edit"
      initial={{
        name: habit.name,
        description: habit.description,
        category: habit.category,
        weekdays: habit.weekdays,
        startDate: habit.startDate,
        timeOfDay: habit.timeOfDay,
        remindersEnabled: habit.remindersEnabled,
        minimumLabel: habit.minimumLabel,
        targetLabel: habit.targetLabel,
      }}
      onSubmit={async (values) => {
        await updateHabit(habit.id, values);
        leave();
      }}
    >
      <View style={styles.actions}>
        {archived ? (
          <Button
            label="Restore habit"
            variant="secondary"
            disabled={busy}
            onPress={() => run(() => restoreHabit(habit.id))}
          />
        ) : (
          <Button
            label="Archive habit"
            variant="secondary"
            disabled={busy}
            onPress={() => run(() => archiveHabit(habit.id))}
          />
        )}
        <Button
          label="Delete habit"
          variant="ghost"
          disabled={busy}
          onPress={() =>
            confirmDeleteHabit(habit.id, {
              canArchive: !archived,
              onArchive: () => run(() => archiveHabit(habit.id)),
              onDelete: () => run(() => deleteHabit(habit.id)),
            })
          }
        />
      </View>
    </HabitForm>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  missing: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
