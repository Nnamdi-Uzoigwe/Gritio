import { getSetting, setSetting } from "@/db/repositories/settings";
import { AnimatedSplash, BRAND } from "@/features/splash/AnimatedSplash";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

type Boot = { fast: boolean; onboarded: boolean };

export default function Index() {
  const router = useRouter();
  const [boot, setBoot] = useState<Boot | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getSetting("onboarding_completed"), getSetting("splash_seen")])
      .then(([onboarded, seen]) => {
        if (active)
          setBoot({ onboarded: onboarded === "1", fast: seen === "1" });
      })
      .catch((error) => {
        console.warn("Could not read startup settings", error);
        if (active) setBoot({ onboarded: false, fast: false });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDone = useCallback(() => {
    if (!boot) return;
    setSetting("splash_seen", "1").catch((error) =>
      console.warn("Could not save splash flag", error),
    );
    router.replace(boot.onboarded ? "/today" : "/onboarding");
  }, [boot, router]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ animation: "fade", gestureEnabled: false }} />
      <StatusBar style="light" />
      {boot ? <AnimatedSplash fast={boot.fast} onDone={handleDone} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.charcoal },
});
