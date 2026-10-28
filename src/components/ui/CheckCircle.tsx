import { useTheme } from "@/theme/ThemeProvider";
import { motion, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

type Props = {
  checked: boolean;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  size?: number;
};

export function CheckCircle({
  checked,
  onPress,
  label,
  disabled = false,
  size = 32,
}: Props) {
  const { colors } = useTheme();
  const check = useSharedValue(checked ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    check.value = withSpring(checked ? 1 : 0, motion.spring.snappy);
  }, [checked, check]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      check.value,
      [0, 1],
      [colors.surface, colors.success],
    ),
    borderColor: interpolateColor(
      check.value,
      [0, 1],
      [colors.border, colors.success],
    ),
    transform: [{ scale: pop.value }],
  }));
  const tickStyle = useAnimatedStyle(() => ({ opacity: check.value }));

  const handlePress = () => {
    if (checked) {
      Haptics.selectionAsync().catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      pop.value = withSequence(
        withTiming(1.25, { duration: 90 }),
        withSpring(1, motion.spring.snappy),
      );
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={10}
      onPress={handlePress}
      style={styles.hit}
    >
      <Animated.View
        style={[
          styles.box,
          { width: size, height: size, borderRadius: size / 2 },
          disabled && styles.disabled,
          boxStyle,
        ]}
      >
        <Animated.View style={tickStyle}>
          <Ionicons
            name="checkmark"
            size={Math.round(size * 0.56)}
            color={colors.onSuccess}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: touch.minTarget - 8,
    height: touch.minTarget - 8,
    alignItems: "center",
    justifyContent: "center",
  },
  box: { borderWidth: 2, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.6 },
});
