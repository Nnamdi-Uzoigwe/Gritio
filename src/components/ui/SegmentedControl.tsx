import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { AppText } from "./AppText";

const PAD = 4;

type Props<T extends string> = {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const segment = width > 0 ? (width - PAD * 2) / options.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(index * segment, motion.spring.snappy);
  }, [index, segment, x]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: colors.surfaceSunken }]}
      accessibilityRole="radiogroup"
    >
      <Animated.View
        style={[styles.thumb, { backgroundColor: colors.surface }, thumbStyle]}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(option.value);
            }}
            style={styles.option}
          >
            <AppText variant="label" tone={selected ? "default" : "muted"}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", padding: PAD, borderRadius: radii.pill },
  thumb: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radii.pill,
  },
  option: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
