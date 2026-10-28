import { AppText } from "@/components/ui/AppText";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, motion, radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { StepFrame } from "../components/StepFrame";
import { useOnboardingStore } from "../store";

type Area = (typeof FOCUS_AREAS)[number];

function AreaTile({
  area,
  selected,
  onPress,
}: {
  area: Area;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tint = focusAreaTints[area.id];
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tileWrap, animated]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={area.label}
        onPressIn={() => {
          scale.value = withSpring(0.95, motion.spring.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, motion.spring.gentle);
        }}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        style={[
          styles.tile,
          {
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
          <Ionicons name={area.icon} size={22} color={tint} />
        </View>
        <AppText variant="label">{area.label}</AppText>
        {selected ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function FocusStep() {
  const focusAreas = useOnboardingStore((s) => s.focusAreas);
  const toggle = useOnboardingStore((s) => s.toggleFocusArea);

  return (
    <StepFrame
      title="What do you want to improve?"
      subtitle="Pick any that matter to you, or none. You can change this later."
    >
      <View style={styles.grid}>
        {FOCUS_AREAS.map((area) => (
          <AreaTile
            key={area.id}
            area={area}
            selected={focusAreas.includes(area.id)}
            onPress={() => toggle(area.id)}
          />
        ))}
      </View>
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  tileWrap: { width: "48%" },
  tile: {
    minHeight: 112,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
