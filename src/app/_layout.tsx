import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { getDb } from "@/db/client";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

function DatabaseError({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.errorWrap, { backgroundColor: colors.background }]}>
      <AppText variant="displayM">Something went wrong</AppText>
      <AppText tone="secondary" style={styles.errorText}>
        Gritio could not open its local data. Your data has not been touched.
        Please try again.
      </AppText>
      <Button label="Try again" onPress={onRetry} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbFailed, setDbFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setDbFailed(false);
    getDb()
      .then(() => setDbReady(true))
      .catch((error) => {
        console.warn("Database init failed", error);
        setDbFailed(true);
      });
  }, [attempt]);

  const ready = (fontsLoaded || fontError !== null) && (dbReady || dbFailed);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        {dbFailed ? (
          <DatabaseError onRetry={() => setAttempt((n) => n + 1)} />
        ) : (
          <RootStack />
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorWrap: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    gap: spacing.lg,
  },
  errorText: { marginBottom: spacing.md },
});
