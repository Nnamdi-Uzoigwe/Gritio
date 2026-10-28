import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing } from "@/theme/tokens";
import React, { useEffect, useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, View } from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./AppText";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const EXIT_MS = 220;

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

function SheetContent({
  visible,
  onClose,
  onExited,
  title,
  children,
}: SheetProps & { onExited: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, motion.spring.gentle);
      return;
    }
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: EXIT_MS });
    const timer = setTimeout(onExited, EXIT_MS + 20);
    return () => clearTimeout(timer);
  }, [visible, translateY, onExited]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        onClose();
      } else {
        translateY.value = withSpring(0, motion.spring.snappy);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={styles.fill}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.overlay },
          backdropStyle,
        ]}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + spacing.lg,
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={pan}>
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            {title ? <AppText variant="titleL">{title}</AppText> : null}
          </View>
        </GestureDetector>
        {children}
      </Animated.View>
    </View>
  );
}

export function BottomSheet(props: SheetProps) {
  const [mounted, setMounted] = useState(props.visible);

  useEffect(() => {
    if (props.visible) setMounted(true);
  }, [props.visible]);

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={props.onClose}
    >
      <GestureHandlerRootView style={styles.fill}>
        <SheetContent {...props} onExited={() => setMounted(false)} />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: { width: 40, height: 4, borderRadius: 2 },
});
