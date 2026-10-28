import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    type SharedValue,
} from "react-native-reanimated";
import { AppText } from "./AppText";

export type FabAction = {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
};

const ITEM_GAP = 62;

function ActionItem({
  action,
  index,
  progress,
  open,
  onPress,
}: {
  action: FabAction;
  index: number;
  progress: SharedValue<number>;
  open: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, -(index + 1) * ITEM_GAP],
        ),
      },
      { scale: interpolate(progress.value, [0, 1], [0.85, 1]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={open ? "auto" : "none"}
      style={[styles.item, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        style={styles.itemRow}
      >
        <View
          style={[
            styles.labelPill,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText variant="label">{action.label}</AppText>
        </View>
        <View
          style={[
            styles.itemIcon,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name={action.icon} size={22} color={colors.primaryText} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function FloatingActionMenu({ actions }: { actions: FabAction[] }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const setState = (next: boolean) => {
    setOpen(next);
    progress.value = withSpring(next ? 1 : 0, motion.spring.snappy);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 135])}deg` },
    ],
  }));

  return (
    <>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.overlay },
          backdropStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setState(false)}
          accessibilityRole="button"
          accessibilityLabel="Close quick actions"
        />
      </Animated.View>

      <View pointerEvents="box-none" style={styles.wrap}>
        {actions.map((action, index) => (
          <ActionItem
            key={action.key}
            action={action}
            index={index}
            progress={progress}
            open={open}
            onPress={() => {
              setState(false);
              action.onPress();
            }}
          />
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            open ? "Close quick actions" : "Open quick actions"
          }
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
            setState(!open);
          }}
        >
          <Animated.View
            style={[styles.fab, { backgroundColor: colors.primary }, fabStyle]}
          >
            <Ionicons name="add" size={32} color={colors.onPrimary} />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xl,
    alignItems: "flex-end",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  item: { position: "absolute", right: 0, bottom: 6 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  labelPill: {
    paddingHorizontal: spacing.lg,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
