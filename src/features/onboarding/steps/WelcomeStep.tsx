import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    FadeInDown,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { StepFrame } from "../components/StepFrame";

export function WelcomeStep({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const line = useSharedValue(0);
  const check = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      line.value = 0;
      check.value = 0;
      return;
    }
    line.value = withDelay(900, withTiming(1, { duration: 500 }));
    check.value = withDelay(1700, withSpring(1, motion.spring.snappy));
    const haptic = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 1750);
    return () => clearTimeout(haptic);
  }, [active, line, check]);

  const lineStyle = useAnimatedStyle(() => ({
    height: 28 * line.value,
    opacity: line.value,
  }));
  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      check.value,
      [0, 1],
      [colors.surface, colors.primary],
    ),
    borderColor: interpolateColor(
      check.value,
      [0, 1],
      [colors.border, colors.primary],
    ),
    transform: [{ scale: 1 + 0.12 * check.value }],
  }));
  const tickStyle = useAnimatedStyle(() => ({ opacity: check.value }));

  return (
    <StepFrame
      title="Turn what you want into what you do."
      subtitle="Gritio helps you break goals into small steps, put them in your day, and stay consistent, without the guilt."
    >
      <View
        style={styles.visual}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View
          key={`goal-${active}`}
          entering={FadeInDown.delay(150).duration(450)}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="caption" tone="accent">
            GOAL
          </AppText>
          <AppText variant="titleM">Learn TypeScript</AppText>
          <View
            style={[styles.track, { backgroundColor: colors.surfaceSunken }]}
          >
            <View style={[styles.fill, { backgroundColor: colors.primary }]} />
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.line, { backgroundColor: colors.primary }, lineStyle]}
        />

        <Animated.View
          key={`today-${active}`}
          entering={FadeInDown.delay(500).duration(450)}
          style={[
            styles.row,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Animated.View style={[styles.box, boxStyle]}>
            <Animated.View style={tickStyle}>
              <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
            </Animated.View>
          </Animated.View>
          <View style={styles.rowText}>
            <AppText variant="titleM">Practice generics</AppText>
            <AppText variant="caption" tone="muted">
              Today, from Learn TypeScript
            </AppText>
          </View>
        </Animated.View>
      </View>
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  visual: { alignItems: "stretch", marginTop: spacing.lg },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  fill: { width: "40%", height: 6, borderRadius: 3 },
  line: { width: 2, alignSelf: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  box: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
});
