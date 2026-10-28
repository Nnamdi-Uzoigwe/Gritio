import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { requestNotificationPermission } from "@/features/notifications/permissions";
import { StepIndicator } from "@/features/onboarding/components/StepIndicator";
import { completeOnboarding } from "@/features/onboarding/repository";
import { FocusStep } from "@/features/onboarding/steps/FocusStep";
import { NameStep } from "@/features/onboarding/steps/NameStep";
import { NotificationsStep } from "@/features/onboarding/steps/NotificationsStep";
import { ReadyStep } from "@/features/onboarding/steps/ReadyStep";
import { RoutineStep } from "@/features/onboarding/steps/RoutineStep";
import { WelcomeStep } from "@/features/onboarding/steps/WelcomeStep";
import { useOnboardingStore } from "@/features/onboarding/store";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  "welcome",
  "name",
  "focus",
  "routine",
  "notifications",
  "ready",
] as const;
type StepKey = (typeof STEPS)[number];
const SKIPPABLE: ReadonlyArray<StepKey> = ["name", "focus", "routine"];

const PRIMARY_LABEL: Record<StepKey, string> = {
  welcome: "Get started",
  name: "Continue",
  focus: "Continue",
  routine: "Continue",
  notifications: "Turn on reminders",
  ready: "Go to Today",
};

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const answer = useOnboardingStore((s) => s.notificationAnswer);

  const step = STEPS[page];

  const goTo = useCallback(
    (index: number) => {
      Keyboard.dismiss();
      const next = Math.max(0, Math.min(STEPS.length - 1, index));
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setPage(next);
    },
    [width],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (page > 0) {
        goTo(page - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [page, goTo]);

  const finish = async () => {
    setBusy(true);
    try {
      const {
        name,
        focusAreas,
        wakeTime,
        planningTime,
        reflectionTime,
        planningReminder,
        reflectionReminder,
      } = useOnboardingStore.getState();
      await completeOnboarding({
        name,
        focusAreas,
        wakeTime,
        planningTime,
        reflectionTime,
        planningReminder,
        reflectionReminder,
      });
      useOnboardingStore.getState().reset();
      router.replace("/today");
    } catch (error) {
      console.warn("Could not complete onboarding", error);
      Alert.alert(
        "Could not save your setup",
        "Something went wrong while saving. Please try again.",
      );
      setBusy(false);
    }
  };

  const handlePrimary = async () => {
    const store = useOnboardingStore.getState();
    if (step === "ready") {
      await finish();
      return;
    }
    if (step === "notifications" && store.notificationAnswer === null) {
      setBusy(true);
      const result = await requestNotificationPermission();
      setBusy(false);
      if (result === "granted") {
        store.setNotificationAnswer("granted");
        goTo(page + 1);
      } else {
        store.setNotificationAnswer("denied");
      }
      return;
    }
    goTo(page + 1);
  };

  const handleSkip = () => {
    const store = useOnboardingStore.getState();
    if (step === "name") store.setName("");
    if (step === "focus") store.clearFocusAreas();
    goTo(page + 1);
  };

  const handleMaybeLater = () => {
    useOnboardingStore.getState().setNotificationAnswer("skipped");
    goTo(page + 1);
  };

  const primaryLabel =
    step === "notifications" && (answer === "denied" || answer === "granted")
      ? "Continue"
      : PRIMARY_LABEL[step];

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ animation: "fade", gestureEnabled: false }} />

      <View style={styles.header}>
        <View style={styles.headerSide}>
          {page > 0 ? (
            <Pressable
              onPress={() => goTo(page - 1)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          ) : null}
        </View>
        <StepIndicator count={STEPS.length} scrollX={scrollX} />
        <View style={[styles.headerSide, styles.headerRight]}>
          {SKIPPABLE.includes(step) ? (
            <Pressable
              onPress={handleSkip}
              accessibilityRole="button"
              hitSlop={12}
              style={styles.iconButton}
            >
              <AppText variant="label" tone="secondary">
                Skip
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        onMomentumScrollEnd={(e) => {
          Keyboard.dismiss();
          setPage(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        style={styles.pager}
      >
        <WelcomeStep active={page === 0} />
        <NameStep />
        <FocusStep />
        <RoutineStep />
        <NotificationsStep active={page === 4} />
        <ReadyStep active={page === 5} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <Button label={primaryLabel} onPress={handlePrimary} loading={busy} />
        {step === "notifications" && answer === null ? (
          <Button
            label="Maybe later"
            variant="ghost"
            onPress={handleMaybeLater}
            disabled={busy}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  headerSide: { width: 72 },
  headerRight: { alignItems: "flex-end" },
  iconButton: {
    minHeight: touch.minTarget,
    minWidth: touch.minTarget,
    justifyContent: "center",
  },
  pager: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
