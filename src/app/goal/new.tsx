import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { countActiveGoals, createGoal } from "@/db/repositories/goals";
import { GoalForm } from "@/features/goals/components/GoalForm";
import { goalLimitMessage, LIMITS } from "@/lib/limits";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function NewGoalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [atLimit, setAtLimit] = useState<boolean | null>(null);

  useEffect(() => {
    countActiveGoals()
      .then((count) => setAtLimit(count >= LIMITS.maxActiveGoals))
      .catch((error) => {
        console.warn("Could not check goal limit", error);
        setAtLimit(false); // saving still enforces the limit
      });
  }, []);

  if (atLimit === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (atLimit) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="New goal" />
        <View style={styles.limit}>
          <AppText variant="displayM">Active goal limit reached</AppText>
          <AppText tone="secondary">{goalLimitMessage}</AppText>
          <Button
            label="Manage goals"
            onPress={() => router.replace("/goals")}
          />
        </View>
      </View>
    );
  }

  return (
    <GoalForm
      mode="create"
      onSubmit={async (values, plan) => {
        const id = await createGoal(values, plan);
        router.replace(`/goal/${id}`);
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  limit: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
});
