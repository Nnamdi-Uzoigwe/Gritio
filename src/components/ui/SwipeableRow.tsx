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

type Props = {
  children: React.ReactNode;
  completeLabel: string;
  onComplete: () => void;
  onPostpone?: () => void;
};

/** Swipe right to complete (or undo), swipe left to postpone when allowed. */
export function SwipeableRow({
  children,
  completeLabel,
  onComplete,
  onPostpone,
}: Props) {
  const { colors } = useTheme();
  const x = useSharedValue(0);
  const crossed = useSharedValue(0);
  const canPostpone = onPostpone !== undefined;

  const fire = useCallback(
    (kind: "complete" | "postpone") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (kind === "complete") onComplete();
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
        Math.min(MAX_PULL, e.translationX),
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
        <Ionicons name="checkmark-circle" size={22} color={colors.onSuccess} />
        <AppText variant="label" style={{ color: colors.onSuccess }}>
          {completeLabel}
        </AppText>
      </Animated.View>
      {canPostpone ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.bg,
            styles.bgRight,
            { backgroundColor: colors.warning },
            postponeBg,
          ]}
        >
          <AppText variant="label" style={{ color: "#FFFFFF" }}>
            Move
          </AppText>
          <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
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
