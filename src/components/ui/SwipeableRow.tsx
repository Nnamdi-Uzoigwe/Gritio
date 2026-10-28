import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppText } from "./AppText";

const THRESHOLD = 96;
const MAX_PULL = 140;

type ActionTone = "success" | "warning" | "primary";

type Props = {
  children: React.ReactNode;
  /** Swipe right. Optional. */
  completeLabel?: string;
  onComplete?: () => void;
  /** Swipe left. Optional. */
  postponeLabel?: string;
  postponeIcon?: IconName;
  postponeTone?: ActionTone;
  onPostpone?: () => void;
};

export function SwipeableRow({
  children,
  completeLabel = "Done",
  onComplete,
  postponeLabel = "Move",
  postponeIcon = "calendar-outline",
  postponeTone = "warning",
  onPostpone,
}: Props) {
  const { colors } = useTheme();
  const x = useSharedValue(0);
  const crossed = useSharedValue(0);
  const canComplete = onComplete !== undefined;
  const canPostpone = onPostpone !== undefined;

  const leftColors =
    postponeTone === "primary"
      ? { bg: colors.primary, fg: colors.onPrimary }
      : postponeTone === "success"
        ? { bg: colors.success, fg: colors.onSuccess }
        : { bg: colors.warning, fg: "#FFFFFF" };

  const fire = useCallback(
    (kind: "complete" | "postpone") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (kind === "complete") onComplete?.();
      else onPostpone?.();
    },
    [onComplete, onPostpone],
  );

  const tick = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const next = Math.max(
        canPostpone ? -MAX_PULL : 0,
        Math.min(canComplete ? MAX_PULL : 0, e.translationX),
      );
      x.value = next;
      const state = next > THRESHOLD ? 1 : next < -THRESHOLD ? -1 : 0;
      if (state !== crossed.value) {
        crossed.value = state;
        if (state !== 0) scheduleOnRN(tick);
      }
    })
    .onEnd(() => {
      const final = x.value;
      x.value = withSpring(0, motion.spring.snappy);
      crossed.value = 0;
      if (final > THRESHOLD) scheduleOnRN(fire, "complete");
      else if (final < -THRESHOLD) scheduleOnRN(fire, "postpone");
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  const completeBg = useAnimatedStyle(() => ({
    opacity: x.value > 0 ? Math.min(1, x.value / THRESHOLD) : 0,
  }));
  const postponeBg = useAnimatedStyle(() => ({
    opacity: x.value < 0 ? Math.min(1, -x.value / THRESHOLD) : 0,
  }));

  return (
    <View style={styles.wrap}>
      {canComplete ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.bg,
            styles.bgLeft,
            { backgroundColor: colors.success },
            completeBg,
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.onSuccess}
          />
          <AppText variant="label" style={{ color: colors.onSuccess }}>
            {completeLabel}
          </AppText>
        </Animated.View>
      ) : null}
      {canPostpone ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.bg,
            styles.bgRight,
            { backgroundColor: leftColors.bg },
            postponeBg,
          ]}
        >
          <AppText variant="label" style={{ color: leftColors.fg }}>
            {postponeLabel}
          </AppText>
          <Ionicons name={postponeIcon} size={22} color={leftColors.fg} />
        </Animated.View>
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            { backgroundColor: colors.surface, borderColor: colors.border },
            styles.row,
            rowStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.lg, overflow: "hidden" },
  row: { borderRadius: radii.lg, borderWidth: 1 },
  bg: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  bgLeft: { justifyContent: "flex-start" },
  bgRight: { justifyContent: "flex-end" },
});
