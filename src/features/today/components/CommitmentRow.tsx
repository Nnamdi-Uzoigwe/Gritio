import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, spacing, touch } from "@/theme/tokens";
import type { Commitment } from "@/types/today";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { sourceMeta } from "../sourceMeta";

type Props = {
  item: Commitment;
  onToggle: () => void;
  onOpen: () => void;
  onPostpone?: () => void;
};

export function CommitmentRow({ item, onToggle, onOpen, onPostpone }: Props) {
  const { colors } = useTheme();
  const check = useSharedValue(item.done ? 1 : 0);
  const pop = useSharedValue(1);
  const meta = sourceMeta(item);

  useEffect(() => {
    check.value = withSpring(item.done ? 1 : 0, motion.spring.snappy);
  }, [item.done, check]);

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

  const handleCheck = () => {
    if (item.done) {
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
    onToggle();
  };

  return (
    <SwipeableRow
      completeLabel={item.done ? "Undo" : "Done"}
      onComplete={onToggle}
      onPostpone={onPostpone}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${meta.label}. ${item.done ? "Completed" : "Not completed"}. Open details.`}
        onPress={onOpen}
        style={styles.row}
      >
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}
          accessibilityLabel={
            item.done
              ? `Mark ${item.title} as not done`
              : `Mark ${item.title} as done`
          }
          hitSlop={10}
          onPress={handleCheck}
          style={styles.checkHit}
        >
          <Animated.View style={[styles.box, boxStyle]}>
            <Animated.View style={tickStyle}>
              <Ionicons name="checkmark" size={18} color={colors.onSuccess} />
            </Animated.View>
          </Animated.View>
        </Pressable>

        <View style={styles.text}>
          <AppText
            variant="titleM"
            tone={item.done ? "muted" : "default"}
            numberOfLines={2}
            style={item.done ? styles.struck : undefined}
          >
            {item.title}
          </AppText>
          <View style={styles.meta}>
            <Chip label={meta.label} icon={meta.icon} />
            {item.done && item.doneLevel === "minimum" ? (
              <Chip label="Minimum" icon="leaf-outline" />
            ) : null}
            {item.time ? (
              <AppText variant="caption" tone="muted">
                {formatTime12(item.time)}
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  checkHit: {
    width: touch.minTarget - 8,
    height: touch.minTarget - 8,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: spacing.xs },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  struck: { textDecorationLine: "line-through" },
});
