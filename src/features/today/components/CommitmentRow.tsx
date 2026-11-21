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

//   useEffect(() => {
//     check.value = withSpring(item.done ? 1 : 0, motion.spring.snappy);
//   }, [item.done, check]);

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
//   const tickStyle = useAnimatedStyle(() => ({ opacity: check.value }));

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
//       completeLabel={item.done ? "Undo" : "Done"}
//       onComplete={onToggle}
//       onPostpone={onPostpone}
//     >
//       <Pressable
//         accessibilityRole="button"
//         accessibilityLabel={`${item.title}. ${meta.label}. ${item.done ? "Completed" : "Not completed"}. Open details.`}
//         onPress={onOpen}
//         style={styles.row}
//       >
//         <Pressable
//           accessibilityRole="checkbox"
//           accessibilityState={{ checked: item.done }}
//           accessibilityLabel={
//             item.done
//               ? `Mark ${item.title} as not done`
//               : `Mark ${item.title} as done`
//           }
//           hitSlop={10}
//           onPress={handleCheck}
//           style={styles.checkHit}
//         >
//           <Animated.View style={[styles.box, boxStyle]}>
//             <Animated.View style={tickStyle}>
//               <Ionicons name="checkmark" size={16} color={colors.onSuccess} />
//             </Animated.View>
//           </Animated.View>
//         </Pressable>

//         <View style={styles.text}>
//           <AppText
//             variant="titleM"
//             tone={item.done ? "muted" : "default"}
//             numberOfLines={2}
//             style={item.done ? styles.struck : undefined}
//           >
//             {item.title}
//           </AppText>
//           {hasMeta ? (
//             <View style={styles.meta}>
//               {item.time ? (
//                 <AppText variant="caption" tone="muted">
//                   {formatTime12(item.time)}
//                 </AppText>
//               ) : null}
//               {showMinimum ? (
//                 <Chip label="Minimum" icon="leaf-outline" />
//               ) : null}
//             </View>
//           ) : null}
//         </View>

//         <View
//           style={[styles.source, item.done ? styles.sourceDone : null]}
//           accessibilityElementsHidden
//           importantForAccessibility="no-hide-descendants"
//         >
//           <Ionicons name={meta.icon} size={16} color={colors.textMuted} />
//         </View>
//       </Pressable>
//     </SwipeableRow>
//   );
// }

// const styles = StyleSheet.create({
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: spacing.sm,
//     paddingVertical: spacing.md,
//     paddingLeft: spacing.sm,
//     paddingRight: spacing.lg,
//     minHeight: touch.minTarget + spacing.md,
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
//   text: { flex: 1, gap: 2 },
//   meta: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     alignItems: "center",
//     gap: spacing.sm,
//   },
//   source: { paddingLeft: spacing.xs },
//   sourceDone: { opacity: 0.5 },
//   struck: { textDecorationLine: "line-through" },
// });

// import { AppText } from "@/components/ui/AppText";
// import { Chip } from "@/components/ui/Chip";
// import { SwipeableRow } from "@/components/ui/SwipeableRow";
// import { formatTime12 } from "@/lib/time";
// import { useTheme } from "@/theme/ThemeProvider";
// import { motion, radii, spacing, touch } from "@/theme/tokens";
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

//   // The edge bar says what kind of item this is. Habits are gold, everything else is a warm grey.
//   const accent = item.source === "habit" ? colors.primary : colors.inputBorder;

//   useEffect(() => {
//     check.value = withSpring(item.done ? 1 : 0, motion.spring.snappy);
//   }, [item.done, check]);

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
//   const tickStyle = useAnimatedStyle(() => ({ opacity: check.value }));

//   // A finished card sinks into the page and its bar fades, so a settled list looks settled.
//   const cardStyle = useAnimatedStyle(() => ({
//     backgroundColor: interpolateColor(
//       check.value,
//       [0, 1],
//       [colors.surface, colors.background],
//     ),
//   }));
//   const barStyle = useAnimatedStyle(() => ({
//     backgroundColor: interpolateColor(
//       check.value,
//       [0, 1],
//       [accent, colors.border],
//     ),
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
//         accessibilityLabel={`${item.title}. ${meta.label}. ${item.done ? "Completed" : "Not completed"}. Open details.`}
//         onPress={onOpen}
//         style={[styles.press, { borderColor: colors.border }]}
//       >
//         <Animated.View style={[styles.card, cardStyle]}>
//           <Animated.View
//             accessibilityElementsHidden
//             importantForAccessibility="no-hide-descendants"
//             style={[styles.bar, barStyle]}
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
//   // The card edge: rounded, clipped, and bordered on three sides only so the bar sits flush on the left.
//   press: {
//     borderRadius: radii.lg,
//     overflow: "hidden",
//     borderTopWidth: 1,
//     borderRightWidth: 1,
//     borderBottomWidth: 1,
//   },
//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: spacing.sm,
//     paddingVertical: spacing.md,
//     paddingLeft: spacing.md,
//     paddingRight: spacing.lg,
//     minHeight: touch.minTarget + spacing.md,
//   },
//   // Flush with the left edge and full height. The rounded clip above shapes its corners.
//   bar: {
//     position: "absolute",
//     left: 0,
//     top: 0,
//     bottom: 0,
//     width: 6,
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
//   text: { flex: 1, gap: 2 },
//   meta: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     alignItems: "center",
//     gap: spacing.sm,
//   },
//   source: { paddingLeft: spacing.xs },
//   sourceDone: { opacity: 0.5 },
//   struck: { textDecorationLine: "line-through" },
// });

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

  const accent = item.source === "habit" ? colors.primary : colors.inputBorder;

  useEffect(() => {
    check.value = withSpring(item.done ? 1 : 0, motion.spring.snappy);
  }, [item.done, check]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.surface,
  }));

  const accentStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      check.value,
      [0, 1],
      [accent, colors.success],
    ),
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
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.accent, accentStyle]}
          />
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
