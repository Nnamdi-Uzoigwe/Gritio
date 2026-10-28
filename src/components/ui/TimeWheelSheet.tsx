import { parseTime, toTimeString } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { AppText } from "./AppText";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);
const PERIODS = ["AM", "PM"];

type WheelProps = {
  data: string[];
  index: number;
  onChange: (index: number) => void;
  width: number;
};

function WheelColumn({ data, index, onChange, width }: WheelProps) {
  const { colors } = useTheme();
  const ref = useRef<ScrollView>(null);
  const [live, setLive] = useState(index);
  const lastIndex = useRef(index);

  const indexFromOffset = (y: number) =>
    Math.max(0, Math.min(data.length - 1, Math.round(y / ITEM_HEIGHT)));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = indexFromOffset(e.nativeEvent.contentOffset.y);
    if (i !== lastIndex.current) {
      lastIndex.current = i;
      setLive(i);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onChange(indexFromOffset(e.nativeEvent.contentOffset.y));
  };

  return (
    <View style={{ width, height: ITEM_HEIGHT * VISIBLE_ROWS }}>
      <View
        pointerEvents="none"
        style={[
          styles.band,
          { backgroundColor: colors.surfaceSunken, top: ITEM_HEIGHT * 2 },
        ]}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        contentOffset={{ x: 0, y: index * ITEM_HEIGHT }}
        onLayout={() =>
          ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false })
        }
        onScroll={handleScroll}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {data.map((label, i) => (
          <View key={label} style={styles.item}>
            <AppText
              variant={i === live ? "titleL" : "body"}
              tone={i === live ? "default" : "muted"}
            >
              {label}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function TimeWheelBody({
  value,
  onConfirm,
}: {
  value: string;
  onConfirm: (value: string) => void;
}) {
  const { hour, minute } = parseTime(value);
  const [hourIndex, setHourIndex] = useState((hour % 12 || 12) - 1);
  const [minuteIndex, setMinuteIndex] = useState(
    Math.min(11, Math.round(minute / 5)),
  );
  const [periodIndex, setPeriodIndex] = useState(hour >= 12 ? 1 : 0);

  const confirm = () => {
    const base = (hourIndex + 1) % 12;
    const hour24 = periodIndex === 1 ? base + 12 : base;
    onConfirm(toTimeString(hour24, minuteIndex * 5));
  };

  return (
    <View style={styles.body}>
      <View style={styles.wheels}>
        <WheelColumn
          data={HOURS}
          index={hourIndex}
          onChange={setHourIndex}
          width={88}
        />
        <WheelColumn
          data={MINUTES}
          index={minuteIndex}
          onChange={setMinuteIndex}
          width={88}
        />
        <WheelColumn
          data={PERIODS}
          index={periodIndex}
          onChange={setPeriodIndex}
          width={88}
        />
      </View>
      <Button label="Set time" onPress={confirm} />
    </View>
  );
}

type Props = {
  visible: boolean;
  title: string;
  value: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
};

export function TimeWheelSheet({
  visible,
  title,
  value,
  onConfirm,
  onClose,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <TimeWheelBody value={value} onConfirm={onConfirm} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  wheels: { flexDirection: "row", justifyContent: "center", gap: spacing.md },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: radii.md,
  },
  item: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
});
