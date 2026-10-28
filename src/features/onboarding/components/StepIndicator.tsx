import { useTheme } from "@/theme/ThemeProvider";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
    Extrapolation,
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    type SharedValue,
} from "react-native-reanimated";

type Props = { count: number; scrollX: SharedValue<number> };

function Dot({
  index,
  scrollX,
  pageWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    const p = scrollX.value / pageWidth;
    const range = [index - 1, index, index + 1];
    return {
      width: interpolate(p, range, [8, 28, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(p, range, [
        colors.border,
        colors.primary,
        colors.border,
      ]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export function StepIndicator({ count, scrollX }: Props) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} index={i} scrollX={scrollX} pageWidth={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
});
