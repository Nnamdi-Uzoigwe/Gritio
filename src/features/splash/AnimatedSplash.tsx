import { typography } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    cancelAnimation,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
    type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { GRITIO_GLYPHS, GRITIO_VIEWBOX } from "./gritioPath";

export const BRAND = {
  charcoal: "#222222",
  gold: "#C49A45",
  tagline: "#B8B3A9",
} as const;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LOGO_WIDTH = 260;

function buildTimeline(count: number, speed: number) {
  const stagger = 170 * speed;
  const draw = 700 * speed;
  const fillStart = (count - 1) * stagger + draw - 200 * speed;
  const fillDuration = 450 * speed;
  const taglineStart = fillStart + fillDuration;
  const taglineEnd = taglineStart + 400 * speed;
  return {
    stagger,
    draw,
    fillStart,
    fillDuration,
    taglineStart,
    taglineEnd,
    total: taglineEnd + 600 * speed,
  };
}

type GlyphProps = {
  d: string;
  length: number;
  start: number;
  draw: number;
  fillStart: number;
  fillDuration: number;
  time: SharedValue<number>;
};

function Glyph({
  d,
  length,
  start,
  draw,
  fillStart,
  fillDuration,
  time,
}: GlyphProps) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(
      time.value,
      [start, start + draw],
      [length, 0],
      Extrapolation.CLAMP,
    ),
    fillOpacity: interpolate(
      time.value,
      [fillStart, fillStart + fillDuration],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <AnimatedPath
      d={d}
      stroke={BRAND.gold}
      strokeWidth={1.4}
      strokeLinejoin="round"
      strokeDasharray={`${length} ${length}`}
      strokeDashoffset={length}
      fill={BRAND.gold}
      fillOpacity={0}
      animatedProps={animatedProps}
    />
  );
}

type Props = { fast: boolean; onDone: () => void };

export function AnimatedSplash({ fast, onDone }: Props) {
  const reduceMotion = useReducedMotion();
  const time = useSharedValue(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finish = useCallback(() => doneRef.current(), []);

  const t = useMemo(
    () => buildTimeline(GRITIO_GLYPHS.length, fast ? 0.45 : 1),
    [fast],
  );

  useEffect(() => {
    if (reduceMotion) {
      time.value = t.total;
      const timer = setTimeout(finish, 700);
      return () => clearTimeout(timer);
    }
    time.value = withTiming(t.total, {
      duration: t.total,
      easing: Easing.linear,
    });
    const haptic = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    }, t.fillStart);
    const done = setTimeout(finish, t.total);
    return () => {
      clearTimeout(haptic);
      clearTimeout(done);
      cancelAnimation(time);
    };
  }, [reduceMotion, t, time, finish]);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      time.value,
      [t.taglineStart, t.taglineEnd],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          time.value,
          [t.taglineStart, t.taglineEnd],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const height = (LOGO_WIDTH * GRITIO_VIEWBOX.height) / GRITIO_VIEWBOX.width;

  return (
    <View style={styles.root} accessibilityLabel="Gritio" accessible>
      <Svg
        width={LOGO_WIDTH}
        height={height}
        viewBox={`${GRITIO_VIEWBOX.x} ${GRITIO_VIEWBOX.y} ${GRITIO_VIEWBOX.width} ${GRITIO_VIEWBOX.height}`}
      >
        {GRITIO_GLYPHS.map((glyph, i) => (
          <Glyph
            key={i}
            d={glyph.d}
            length={glyph.length}
            start={i * t.stagger}
            draw={t.draw}
            fillStart={t.fillStart}
            fillDuration={t.fillDuration}
            time={time}
          />
        ))}
      </Svg>
      <Animated.Text
        style={[typography.bodySmall, styles.tagline, taglineStyle]}
      >
        Every goal. Every action. Every day.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  tagline: { color: BRAND.tagline, marginTop: 20, letterSpacing: 0.4 },
});
