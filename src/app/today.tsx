import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { getSetting, setSetting } from "@/db/repositories/settings";
import { useOnboardingStore } from "@/features/onboarding/store";
import { getGreeting } from "@/lib/greeting";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TodayPlaceholder() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    getSetting("user_name")
      .then(setName)
      .catch((error) => console.warn("Could not read name", error));
  }, []);

  const resetForTesting = async () => {
    await setSetting("onboarding_completed", "0");
    await setSetting("splash_seen", "0");
    useOnboardingStore.getState().reset();
    router.replace("/");
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <Stack.Screen options={{ animation: "fade", gestureEnabled: false }} />
      <AppText variant="displayL">{getGreeting(name)}</AppText>
      <AppText tone="secondary">The Today screen arrives in Phase 4.</AppText>
      {__DEV__ ? (
        <View style={styles.dev}>
          <Button
            label="Reset onboarding (dev only)"
            variant="secondary"
            onPress={resetForTesting}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.md },
  dev: { marginTop: "auto" },
});
