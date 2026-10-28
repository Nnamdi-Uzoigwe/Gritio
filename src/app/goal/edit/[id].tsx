import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getGoal, updateGoal } from "@/db/repositories/goals";
import { GoalForm } from "@/features/goals/components/GoalForm";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import type { GoalListItem } from "@/types/goals";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function EditGoalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [goal, setGoal] = useState<GoalListItem | null | undefined>(undefined);

  useEffect(() => {
    getGoal(id)
      .then(setGoal)
      .catch((error) => {
        console.warn("Could not load goal", error);
        setGoal(null);
      });
  }, [id]);

  if (goal === undefined) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (goal === null) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Edit goal" />
        <View style={styles.missing}>
          <AppText variant="displayM">Goal not found</AppText>
          <Button
            label="Back to goals"
            onPress={() => router.replace("/goals")}
          />
        </View>
      </View>
    );
  }

  return (
    <GoalForm
      mode="edit"
      initial={{
        title: goal.title,
        description: goal.description,
        category: goal.category,
        goalType: goal.goalType,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        completionCriteria: goal.completionCriteria,
      }}
      onSubmit={async (values) => {
        await updateGoal(goal.id, values);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  missing: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
});
