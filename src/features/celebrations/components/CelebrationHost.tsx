import { Button } from "@/components/ui/Button";
import type { IconName } from "@/lib/focusAreas";
import { motion, radii, spacing, typography } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    useCelebrationStore,
    type Celebration,
    type CelebrationKind,
} from "../store";
import { Confetti } from "./Confetti";

// The overlay is a brand moment, so it keeps its own colors in light and dark mode.
const SCRIM = "rgba(20, 20, 20, 0.94)";
const GOLD = "#C49A45";
const CREAM = "#F3F1EC";
const MUTED = "#B8B3A9";

const ICON: Record<CelebrationKind, IconName> = {
  daily: "sunny",
  goal: "trophy",
  milestone: "flag",
  streak: "flame",
  review: "checkmark-done",
};

function Overlay({
  celebration,
  onDismiss,
}: {
  celebration: Celebration;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fade = useSharedValue(0);
  const pop = useSharedValue(reduceMotion ? 1 : 0);
  const ring = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 260 });
    if (!reduceMotion) {
      pop.value = withDelay(120, withSpring(1, motion.spring.snappy));
      ring.value = withDelay(
        400,
        withRepeat(
          withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
          2,
          false,
        ),
      );
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  }, [fade, pop, ring, reduceMotion]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onDismiss();
      return true;
    });
    return () => sub.remove();
  }, [onDismiss]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.5,
    transform: [{ scale: 1 + ring.value * 0.7 }],
  }));

  const openAction = () => {
    const target = celebration.action?.target;
    onDismiss();
    if (!target) return;
    if (target.type === "progress") router.navigate("/progress");
    else if (target.type === "goal") router.push(`/goal/${target.id}`);
    else router.push(`/habit/${target.id}`);
  };

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.scrim, fadeStyle]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss celebration"
      />

      {reduceMotion ? null : <Confetti />}

      <View
        pointerEvents="box-none"
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        <View style={styles.badgeWrap}>
          {reduceMotion ? null : (
            <Animated.View style={[styles.ring, ringStyle]} />
          )}
          <Animated.View style={[styles.badge, badgeStyle]}>
            <Ionicons name={ICON[celebration.kind]} size={46} color="#222222" />
          </Animated.View>
        </View>

        <Text
          style={[typography.displayL, styles.title]}
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
        >
          {celebration.title}
        </Text>
        <Text style={[typography.body, styles.message]}>
          {celebration.message}
        </Text>

        {celebration.summary ? (
          <View style={styles.summary}>
            <Text style={[typography.label, styles.summaryText]}>
              {celebration.summary}
            </Text>
          </View>
        ) : null}

        <View style={styles.buttons}>
          <Button label="Continue" onPress={onDismiss} />
          {celebration.action ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={celebration.action.label}
              onPress={openAction}
              style={styles.secondary}
            >
              <Text style={[typography.titleM, styles.secondaryText]}>
                {celebration.action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

/** Shows one celebration at a time. Mounted once, above everything else. */
export function CelebrationHost() {
  const current = useCelebrationStore((s) => s.queue[0] ?? null);
  const dismiss = useCelebrationStore((s) => s.dismiss);
  if (!current) return null;
  return <Overlay key={current.id} celebration={current} onDismiss={dismiss} />;
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: SCRIM, zIndex: 1000, elevation: 1000 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  badgeWrap: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  ring: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: GOLD,
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: CREAM, textAlign: "center" },
  message: { color: MUTED, textAlign: "center", maxWidth: 320 },
  summary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(196, 154, 69, 0.5)",
  },
  summaryText: { color: CREAM, textAlign: "center" },
  buttons: { alignSelf: "stretch", gap: spacing.sm, marginTop: spacing.lg },
  secondary: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(243, 241, 236, 0.3)",
  },
  secondaryText: { color: CREAM },
});
