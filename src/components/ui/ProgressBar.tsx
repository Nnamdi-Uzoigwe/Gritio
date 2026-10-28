import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

type Props = {
  progress: number;
  color: string;
  trackColor: string;
  height?: number;
};

export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 6,
}: Props) {
  const [width, setWidth] = useState(0);
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, value]);

  const fillStyle = useAnimatedStyle(() => ({ width: width * value.value }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          { height, borderRadius: height / 2, backgroundColor: color },
          fillStyle,
        ]}
      />
    </View>
  );
}
