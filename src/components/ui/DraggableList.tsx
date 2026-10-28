import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type RowProps = {
  index: number;
  count: number;
  rowHeight: number;
  positions: SharedValue<number[]>;
  activeIndex: SharedValue<number>;
  dragStartSlot: SharedValue<number>;
  dragY: SharedValue<number>;
  onPickup: () => void;
  onCommit: (slots: number[]) => void;
  onMove: (index: number, delta: number) => void;
  render: (handle: React.ReactNode) => React.ReactNode;
};

function DraggableRow({
  index,
  count,
  rowHeight,
  positions,
  activeIndex,
  dragStartSlot,
  dragY,
  onPickup,
  onCommit,
  onMove,
  render,
}: RowProps) {
  const { colors } = useTheme();

  const pickup = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPickup();
  }, [onPickup]);

  const tick = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const pan = Gesture.Pan()
    .activateAfterLongPress(120)
    .onStart(() => {
      activeIndex.value = index;
      dragStartSlot.value = positions.value[index];
      dragY.value = 0;
      scheduleOnRN(pickup);
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
      const current = positions.value[index];
      const raw = dragStartSlot.value + e.translationY / rowHeight;
      const target = Math.max(0, Math.min(count - 1, Math.round(raw)));
      if (target !== current) {
        const next = positions.value.slice();
        for (let i = 0; i < next.length; i++) {
          if (i === index) continue;
          const p = next[i];
          if (current < target && p > current && p <= target) next[i] = p - 1;
          else if (current > target && p < current && p >= target)
            next[i] = p + 1;
        }
        next[index] = target;
        positions.value = next;
        scheduleOnRN(tick);
      }
    })
    .onFinalize(() => {
      if (activeIndex.value !== index) return;
      const finalSlot = positions.value[index];
      dragY.value = withTiming(
        (finalSlot - dragStartSlot.value) * rowHeight,
        { duration: 140 },
        () => {
          activeIndex.value = -1;
          scheduleOnRN(onCommit, positions.value);
        },
      );
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (activeIndex.value === index) {
      return {
        zIndex: 10,
        elevation: 6,
        shadowOpacity: 0.18,
        transform: [
          { translateY: dragStartSlot.value * rowHeight + dragY.value },
          { scale: 1.02 },
        ],
      };
    }
    return {
      zIndex: 0,
      elevation: 0,
      shadowOpacity: 0,
      transform: [
        {
          translateY: withTiming(positions.value[index] * rowHeight, {
            duration: 180,
          }),
        },
        { scale: 1 },
      ],
    };
  });

  const handle = (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Reorder handle"
        accessibilityHint="Swipe up or down to move this item"
        accessibilityActions={[
          { name: "increment", label: "Move down" },
          { name: "decrement", label: "Move up" },
        ]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "increment") onMove(index, 1);
          else if (e.nativeEvent.actionName === "decrement") onMove(index, -1);
        }}
        style={styles.handle}
      >
        <Ionicons
          name="reorder-three-outline"
          size={26}
          color={colors.textMuted}
        />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View style={[styles.row, { height: rowHeight }, animatedStyle]}>
      {render(handle)}
    </Animated.View>
  );
}

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  rowHeight: number;
  renderRow: (item: T, handle: React.ReactNode) => React.ReactNode;
  onReorder: (items: T[]) => void;
  onDragStateChange?: (dragging: boolean) => void;
};

/**
 * Fixed row height list with long press and drag handles.
 * Pass a stable `items` array (state, not a fresh .map result each render).
 */
export function DraggableList<T>({
  items,
  keyOf,
  rowHeight,
  renderRow,
  onReorder,
  onDragStateChange,
}: Props<T>) {
  const positions = useSharedValue<number[]>(items.map((_, i) => i));
  const activeIndex = useSharedValue(-1);
  const dragStartSlot = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    positions.value = items.map((_, i) => i);
    activeIndex.value = -1;
    dragY.value = 0;
  }, [items, positions, activeIndex, dragY]);

  const commit = useCallback(
    (slots: number[]) => {
      onDragStateChange?.(false);
      if (!slots.some((slot, i) => slot !== i)) return;
      const next: T[] = [];
      slots.forEach((slot, i) => {
        next[slot] = items[i];
      });
      onReorder(next);
    },
    [items, onReorder, onDragStateChange],
  );

  const pickup = useCallback(
    () => onDragStateChange?.(true),
    [onDragStateChange],
  );

  const move = useCallback(
    (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= items.length) return;
      const next = items.slice();
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      onReorder(next);
    },
    [items, onReorder],
  );

  return (
    <View style={{ height: items.length * rowHeight }}>
      {items.map((item, index) => (
        <DraggableRow
          key={keyOf(item)}
          index={index}
          count={items.length}
          rowHeight={rowHeight}
          positions={positions}
          activeIndex={activeIndex}
          dragStartSlot={dragStartSlot}
          dragY={dragY}
          onPickup={pickup}
          onCommit={commit}
          onMove={move}
          render={(handle) => renderRow(item, handle)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  handle: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
