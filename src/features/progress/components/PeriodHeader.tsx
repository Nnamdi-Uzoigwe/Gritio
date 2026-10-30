import { AppText } from "@/components/ui/AppText";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { PeriodKind } from "@/lib/progressStats";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";

const OPTIONS: ReadonlyArray<{ value: PeriodKind; label: string }> = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

type Props = {
  kind: PeriodKind;
  onKindChange: (kind: PeriodKind) => void;
  label: string;
  detail: string | null;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function PeriodHeader({
  kind,
  onKindChange,
  label,
  detail,
  canNext,
  onPrev,
  onNext,
}: Props) {
  const { colors } = useTheme();

  const press = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    fn();
  };

  return (
    <View style={styles.wrap}>
      <SegmentedControl
        options={OPTIONS}
        value={kind}
        onChange={onKindChange}
      />
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous period"
          onPress={press(onPrev)}
          style={styles.nav}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.center}>
          <AppText variant="titleM">{label}</AppText>
          {detail ? (
            <AppText variant="caption" tone="muted">
              {detail}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next period"
          disabled={!canNext}
          onPress={press(onNext)}
          style={[styles.nav, !canNext && styles.disabled]}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: { alignItems: "center", gap: 2 },
  nav: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.3 },
});
