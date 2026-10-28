import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { countActiveHabits, createHabit } from "@/db/repositories/habits";
import { HabitForm } from "@/features/habits/components/HabitForm";
import { habitLimitMessage, LIMITS } from "@/lib/limits";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function NewHabitScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [atLimit, setAtLimit] = useState<boolean | null>(null);

  useEffect(() => {
    countActiveHabits()
      .then((count) => setAtLimit(count >= LIMITS.maxActiveHabits))
      .catch((error) => {
        console.warn("Could not check habit limit", error);
        setAtLimit(false); // saving still enforces the limit
      });
  }, []);

  if (atLimit === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (atLimit) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="New habit" />
        <View style={styles.limit}>
          <AppText variant="displayM">Active habit limit reached</AppText>
          <AppText tone="secondary">{habitLimitMessage}</AppText>
          <Button
            label="Manage habits"
            onPress={() => router.replace("/habits")}
          />
        </View>
      </View>
    );
  }

  return (
    <HabitForm
      mode="create"
      onSubmit={async (values) => {
        await createHabit(values);
        if (router.canGoBack()) router.back();
        else router.replace("/habits");
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  limit: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
});
