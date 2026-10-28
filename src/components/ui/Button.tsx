import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing, touch } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { AppText } from "./AppText";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const inactive = disabled || loading;

  const containerStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "secondary"
        ? {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }
        : { backgroundColor: "transparent" };

  const tone =
    variant === "primary"
      ? "onPrimary"
      : variant === "ghost"
        ? "accent"
        : "default";

  return (
    <Animated.View style={[animatedStyle, inactive && styles.inactive, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={() => {
          scale.value = withSpring(0.96, motion.spring.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, motion.spring.gentle);
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          onPress();
        }}
        style={[styles.base, containerStyle]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === "primary" ? colors.onPrimary : colors.primaryText
            }
          />
        ) : (
          <AppText variant="titleM" tone={tone}>
            {label}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.minTarget + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  inactive: { opacity: 0.5 },
});
