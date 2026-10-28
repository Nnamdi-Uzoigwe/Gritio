import { AppText } from "@/components/ui/AppText";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { StepFrame } from "../components/StepFrame";
import { useOnboardingStore } from "../store";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ReadyStep({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const name = useOnboardingStore((s) => s.name.trim());
  const focusAreas = useOnboardingStore((s) => s.focusAreas);
  const planningReminder = useOnboardingStore((s) => s.planningReminder);
  const planningTime = useOnboardingStore((s) => s.planningTime);
  const reflectionReminder = useOnboardingStore((s) => s.reflectionReminder);
  const reflectionTime = useOnboardingStore((s) => s.reflectionTime);
  const answer = useOnboardingStore((s) => s.notificationAnswer);

  const progress = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      pop.value = 0;
      return;
    }
    progress.value = withDelay(
      250,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
    pop.value = withDelay(1000, withSpring(1, motion.spring.snappy));
    const haptic = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }, 1050);
    return () => clearTimeout(haptic);
  }, [active, progress, pop]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + 0.4 * pop.value }],
  }));

  const lines: string[] = [];
  if (focusAreas.length > 0) {
    lines.push(
      `${focusAreas.length} focus ${focusAreas.length === 1 ? "area" : "areas"} chosen`,
    );
  }
  if (planningReminder)
    lines.push(`Daily planning reminder at ${formatTime12(planningTime)}`);
  if (reflectionReminder)
    lines.push(
      `Evening reflection reminder at ${formatTime12(reflectionTime)}`,
    );
  if (answer === "granted") lines.push("Notifications are on");
  if (answer === "denied") lines.push("Notifications are off for now");

  return (
    <StepFrame
      title={name ? `You're set, ${name}.` : "You're set."}
      subtitle="Your goals, habits and reflections live on this device and work offline."
    >
      <View
        style={styles.ringWrap}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Svg width={100} height={100} viewBox="0 0 100 100">
          <Circle
            cx={50}
            cy={50}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={4}
            fill="none"
          />
          <AnimatedCircle
            cx={50}
            cy={50}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE}
            rotation={-90}
            origin="50, 50"
            animatedProps={ringProps}
          />
        </Svg>
        <Animated.View style={[styles.check, checkStyle]}>
          <Ionicons name="checkmark" size={40} color={colors.primary} />
        </Animated.View>
      </View>

      <View style={styles.summary}>
        {lines.map((line) => (
          <AppText key={line} variant="body">
            {line}
          </AppText>
        ))}
        <AppText variant="bodySmall" tone="muted">
          Everything can be changed later in Settings.
        </AppText>
      </View>
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    alignSelf: "center",
    width: 100,
    height: 100,
    marginVertical: spacing.lg,
  },
  check: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: { gap: spacing.sm, alignItems: "center" },
});
