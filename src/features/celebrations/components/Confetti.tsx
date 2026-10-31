import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

const PALETTE = [
  "#C49A45",
  "#D4AA55",
  "#E3C98A",
  "#F7F6F2",
  "#C49A45",
  "#4CAF7D",
];

type Piece = {
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  color: string;
  round: boolean;
};

function ConfettiPiece({ piece, height }: { piece: Piece; height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.linear }),
    );
  }, [piece, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.08, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: piece.drift * t.value },
      { translateY: -24 + t.value * (height + 64) },
      { rotate: `${piece.spin * t.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 1.6,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/** About three seconds of falling confetti, built with Reanimated. Pieces are random but fixed per mount. */
export function Confetti({ count = 38 }: { count?: number }) {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * width,
        size: 6 + Math.random() * 6,
        delay: Math.random() * 500,
        duration: 2300 + Math.random() * 1200,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        round: Math.random() > 0.6,
      })),
    [count, width],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ piece: { position: "absolute", top: 0 } });
