import { AppText } from "@/components/ui/AppText";
import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { motion, radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabRoute = { key: string; name: string };
type Props = {
  routes: TabRoute[];
  activeIndex: number;
  onPress: (route: TabRoute, focused: boolean) => void;
};

const META: Record<
  string,
  { label: string; icon: IconName; iconActive: IconName }
> = {
  today: { label: "Today", icon: "sunny-outline", iconActive: "sunny" },
  goals: { label: "Goals", icon: "flag-outline", iconActive: "flag" },
  habits: { label: "Habits", icon: "repeat-outline", iconActive: "repeat" },
  progress: {
    label: "Progress",
    icon: "stats-chart-outline",
    iconActive: "stats-chart",
  },
};

const PILL_WIDTH = 58;

export function AppTabBar({ routes, activeIndex, onPress }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const tabWidth = width / Math.max(1, routes.length);
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(
      activeIndex * tabWidth + (tabWidth - PILL_WIDTH) / 2,
      motion.spring.snappy,
    );
  }, [activeIndex, tabWidth, x]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + spacing.xs,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: colors.primarySoft },
          pillStyle,
        ]}
      />
      {routes.map((route, index) => {
        const meta = META[route.name];
        if (!meta) return null;
        const focused = index === activeIndex;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={meta.label}
            onPress={() => {
              if (!focused) Haptics.selectionAsync().catch(() => {});
              onPress(route, focused);
            }}
            style={styles.tab}
          >
            <Ionicons
              name={focused ? meta.iconActive : meta.icon}
              size={22}
              color={focused ? colors.primaryText : colors.textMuted}
            />
            <AppText variant="caption" tone={focused ? "accent" : "muted"}>
              {meta.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: 1, paddingTop: spacing.sm },
  pill: {
    position: "absolute",
    top: spacing.sm,
    left: 0,
    width: PILL_WIDTH,
    height: 30,
    borderRadius: radii.pill,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 52,
  },
});
