// import { AppText } from "@/components/ui/AppText";
// import { Chip } from "@/components/ui/Chip";
// import { SwipeableRow } from "@/components/ui/SwipeableRow";
// import { formatTime12 } from "@/lib/time";
// import { useTheme } from "@/theme/ThemeProvider";
// import { motion, spacing, touch } from "@/theme/tokens";
// import type { Commitment } from "@/types/today";
// import { Ionicons } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import { useEffect } from "react";
// import { Pressable, StyleSheet, View } from "react-native";
// import Animated, {
//   interpolateColor,
//   useAnimatedStyle,
//   useSharedValue,
//   withSequence,
//   withSpring,
//   withTiming,
// } from "react-native-reanimated";
// import { sourceMeta } from "../sourceMeta";

// type Props = {
//   item: Commitment;
//   onToggle: () => void;
//   onOpen: () => void;
//   onPostpone?: () => void;
// };

// export function CommitmentRow({ item, onToggle, onOpen, onPostpone }: Props) {
//   const { colors } = useTheme();
//   const check = useSharedValue(item.done ? 1 : 0);
//   const pop = useSharedValue(1);
//   const meta = sourceMeta(item);

//   const accent = item.source === "habit" ? colors.primary : colors.inputBorder;

//   useEffect(() => {
//     check.value = withSpring(item.done ? 1 : 0, motion.spring.snappy);
//   }, [item.done, check]);

//   const cardStyle = useAnimatedStyle(() => ({
//     backgroundColor: colors.surface,
//   }));

//   const accentStyle = useAnimatedStyle(() => ({
//     backgroundColor: interpolateColor(
//       check.value,
//       [0, 1],
//       [accent, colors.success],
//     ),
//   }));
//   const boxStyle = useAnimatedStyle(() => ({
//     backgroundColor: interpolateColor(
//       check.value,
//       [0, 1],
//       [colors.surface, colors.success],
//     ),
//     borderColor: interpolateColor(
//       check.value,
//       [0, 1],
//       [colors.inputBorder, colors.success],
//     ),
//     transform: [{ scale: pop.value }],
//   }));

//   const tickStyle = useAnimatedStyle(() => ({
//     opacity: check.value,
//   }));

//   const handleCheck = () => {
//     if (item.done) {
//       Haptics.selectionAsync().catch(() => {});
//     } else {
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
//         () => {},
//       );

//       pop.value = withSequence(
//         withTiming(1.2, { duration: 90 }),
//         withSpring(1, motion.spring.snappy),
//       );
//     }

//     onToggle();
//   };

//   const showMinimum = item.done && item.doneLevel === "minimum";
//   const hasMeta = Boolean(item.time) || showMinimum;

//   return (
//     <SwipeableRow
//       bare
//       completeLabel={item.done ? "Undo" : "Done"}
//       onComplete={onToggle}
//       onPostpone={onPostpone}
//     >
//       <Pressable
//         accessibilityRole="button"
//         accessibilityLabel={`${item.title}. ${meta.label}. ${
//           item.done ? "Completed" : "Not completed"
//         }. Open details.`}
//         onPress={onOpen}
//         style={styles.press}
//       >
//         <Animated.View style={[styles.card, cardStyle]}>
//           <Animated.View
//             pointerEvents="none"
//             accessibilityElementsHidden
//             importantForAccessibility="no-hide-descendants"
//             style={[styles.accent, accentStyle]}
//           />
//           <Pressable
//             accessibilityRole="checkbox"
//             accessibilityState={{ checked: item.done }}
//             accessibilityLabel={
//               item.done
//                 ? `Mark ${item.title} as not done`
//                 : `Mark ${item.title} as done`
//             }
//             hitSlop={10}
//             onPress={handleCheck}
//             style={styles.checkHit}
//           >
//             <Animated.View style={[styles.box, boxStyle]}>
//               <Animated.View style={tickStyle}>
//                 <Ionicons name="checkmark" size={16} color={colors.onSuccess} />
//               </Animated.View>
//             </Animated.View>
//           </Pressable>

//           <View style={styles.text}>
//             <AppText
//               variant="titleM"
//               tone={item.done ? "muted" : "default"}
//               numberOfLines={2}
//               style={item.done ? styles.struck : undefined}
//             >
//               {item.title}
//             </AppText>

//             {hasMeta ? (
//               <View style={styles.meta}>
//                 {item.time ? (
//                   <AppText variant="caption" tone="muted">
//                     {formatTime12(item.time)}
//                   </AppText>
//                 ) : null}

//                 {showMinimum ? (
//                   <Chip label="Minimum" icon="leaf-outline" />
//                 ) : null}
//               </View>
//             ) : null}
//           </View>

//           <View
//             style={[styles.source, item.done ? styles.sourceDone : null]}
//             accessibilityElementsHidden
//             importantForAccessibility="no-hide-descendants"
//           >
//             <Ionicons name={meta.icon} size={16} color={colors.textMuted} />
//           </View>
//         </Animated.View>
//       </Pressable>
//     </SwipeableRow>
//   );
// }

// const styles = StyleSheet.create({
//   press: {
//     borderRadius: 8,
//   },
//   card: {
//     position: "relative",
//     flexDirection: "row",
//     alignItems: "center",
//     gap: spacing.sm,
//     paddingVertical: spacing.md,
//     paddingLeft: spacing.md + 5,
//     paddingRight: spacing.lg,
//     minHeight: touch.minTarget + spacing.md,
//     borderRadius: 8,
//     overflow: "hidden",
//   },
//   accent: {
//     position: "absolute",
//     left: 0,
//     top: 0,
//     bottom: 0,
//     width: 7,
//   },
//   checkHit: {
//     width: touch.minTarget - 8,
//     height: touch.minTarget - 8,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   box: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     borderWidth: 2,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   text: {
//     flex: 1,
//     gap: 2,
//   },
//   meta: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     alignItems: "center",
//     gap: spacing.sm,
//   },
//   source: {
//     paddingLeft: spacing.xs,
//   },
//   sourceDone: {
//     opacity: 0.5,
//   },
//   struck: {
//     textDecorationLine: "line-through",
//   },
// });

import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import {
  SwipeableRow,
  SwipeProgressContext,
} from "@/components/ui/SwipeableRow";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, spacing, touch } from "@/theme/tokens";
import type { Commitment } from "@/types/today";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useContext, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { sourceMeta } from "../sourceMeta";

// The accent is fully gone after the card has moved this many pixels.
const ACCENT_FADE_DISTANCE = 20;

type Props = {
  item: Commitment;
  onToggle: () => void;
  onOpen: () => void;
  onPostpone?: () => void;
};

/**
 * Left edge accent. It must render inside SwipeableRow so it can read the
 * swipe offset, and it fades out as soon as the card is dragged.
 */
function AccentBar({
  color,
  check,
}: {
  color: string;
  check: SharedValue<number>;
}) {
  const { colors } = useTheme();
  const swipeX = useContext(SwipeProgressContext);

  const style = useAnimatedStyle(() => {
    const pulled = swipeX
      ? Math.min(1, Math.abs(swipeX.value) / ACCENT_FADE_DISTANCE)
      : 0;
    return {
      opacity: 1 - pulled,
      backgroundColor: interpolateColor(
        check.value,
        [0, 1],
        [color, colors.success],
      ),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.accent, style]}
    />
  );
}

export function CommitmentRow({ item, onToggle, onOpen, onPostpone }: Props) {
  const { colors } = useTheme();
  const check = useSharedValue(item.done ? 1 : 0);
  const pop = useSharedValue(1);
  const meta = sourceMeta(item);

  const accent = item.source === "habit" ? colors.primary : colors.inputBorder;

  useEffect(() => {
    check.value = withSpring(item.done ? 1 : 0, motion.spring.snappy);
  }, [item.done, check]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.surface,
  }));

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      check.value,
      [0, 1],
      [colors.surface, colors.success],
    ),
    borderColor: interpolateColor(
      check.value,
      [0, 1],
      [colors.inputBorder, colors.success],
    ),
    transform: [{ scale: pop.value }],
  }));

  const tickStyle = useAnimatedStyle(() => ({
    opacity: check.value,
  }));

  const handleCheck = () => {
    if (item.done) {
      Haptics.selectionAsync().catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );

      pop.value = withSequence(
        withTiming(1.2, { duration: 90 }),
        withSpring(1, motion.spring.snappy),
      );
    }

    onToggle();
  };

  const showMinimum = item.done && item.doneLevel === "minimum";
  const hasMeta = Boolean(item.time) || showMinimum;

  return (
    <SwipeableRow
      bare
      completeLabel={item.done ? "Undo" : "Done"}
      onComplete={onToggle}
      onPostpone={onPostpone}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${meta.label}. ${
          item.done ? "Completed" : "Not completed"
        }. Open details.`}
        onPress={onOpen}
        style={styles.press}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <AccentBar color={accent} check={check} />
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
                <Ionicons name="checkmark" size={16} color={colors.onSuccess} />
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

            {hasMeta ? (
              <View style={styles.meta}>
                {item.time ? (
                  <AppText variant="caption" tone="muted">
                    {formatTime12(item.time)}
                  </AppText>
                ) : null}

                {showMinimum ? (
                  <Chip label="Minimum" icon="leaf-outline" />
                ) : null}
              </View>
            ) : null}
          </View>

          <View
            style={[styles.source, item.done ? styles.sourceDone : null]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Ionicons name={meta.icon} size={16} color={colors.textMuted} />
          </View>
        </Animated.View>
      </Pressable>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  press: {
    borderRadius: 8,
  },
  card: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md + 5,
    paddingRight: spacing.lg,
    minHeight: touch.minTarget + spacing.md,
    borderRadius: 8,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
  },
  checkHit: {
    width: touch.minTarget - 8,
    height: touch.minTarget - 8,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  source: {
    paddingLeft: spacing.xs,
  },
  sourceDone: {
    opacity: 0.5,
  },
  struck: {
    textDecorationLine: "line-through",
  },
});
