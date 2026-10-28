import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

export function EmptyDay({ onAddTask }: { onAddTask: () => void }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reduceMotion, float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * float.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.art, floatStyle]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={[
            styles.bar,
            { width: 150, backgroundColor: colors.surfaceSunken },
          ]}
        />
        <View
          style={[
            styles.bar,
            { width: 110, backgroundColor: colors.surfaceSunken },
          ]}
        />
        <View
          style={[
            styles.bar,
            { width: 130, backgroundColor: colors.surfaceSunken },
          ]}
        />
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Ionicons name="sunny" size={26} color={colors.onPrimary} />
        </View>
      </Animated.View>
      <AppText variant="displayM" style={styles.center}>
        Fresh day.
      </AppText>
      <AppText tone="secondary" style={styles.center}>
        What is the one thing that matters today?
      </AppText>
      <Button label="Add a task" onPress={onAddTask} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: spacing.xxxl, gap: spacing.md },
  art: {
    width: 190,
    height: 120,
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bar: { height: 16, borderRadius: radii.pill },
  badge: {
    position: "absolute",
    right: 0,
    top: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { textAlign: "center" },
  button: { marginTop: spacing.lg, alignSelf: "stretch" },
});
