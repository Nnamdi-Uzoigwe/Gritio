import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { getDb } from "@/db/client";
import { CelebrationHost } from "@/features/celebrations/components/CelebrationHost";
import {
  reconcileNow,
  requestReconcile,
} from "@/features/notifications/service";
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
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Reminders that arrive while the app is open still show as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Sends the person to the right place when they tap a reminder while the app is already running. */
function NotificationBridge() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const baselineSet = useRef(false);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (response === undefined) return; // still loading
    const id = response
      ? `${response.notification.request.identifier}:${response.notification.date}`
      : null;
    if (!baselineSet.current) {
      // A reminder that launched the app is handled by the normal splash to Today flow.
      baselineSet.current = true;
      handled.current = id;
      return;
    }
    if (!response || id === handled.current) return;
    handled.current = id;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
      return;

    const data = response.notification.request.content.data as
      | { kind?: string }
      | undefined;
    router.navigate(data?.kind === "reflection" ? "/reflection" : "/today");
  }, [response, router]);

  return null;
}

function RootStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NotificationBridge />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <CelebrationHost />
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

  // Keep reminders in step with the data on launch and whenever the app returns to the foreground.
  useEffect(() => {
    if (!dbReady) return;
    reconcileNow().catch((error) => console.warn("Reconcile failed", error));
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") requestReconcile();
    });
    return () => sub.remove();
  }, [dbReady]);

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
