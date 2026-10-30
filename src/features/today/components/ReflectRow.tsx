import { AppText } from "@/components/ui/AppText";
import { hasReflection } from "@/db/repositories/reflections";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

/** A quiet, optional doorway to today's reflection. No streaks, no nagging. */
export function ReflectRow({ today }: { today: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [has, setHas] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      hasReflection(today)
        .then((value) => {
          if (active) setHas(value);
        })
        .catch((error) => console.warn("Could not check reflection", error));
      return () => {
        active = false;
      };
    }, [today]),
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        has ? "Edit today's reflection" : "Reflect on your day"
      }
      onPress={() => router.push("/reflection")}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name="moon-outline" size={22} color={colors.primaryText} />
      <View style={styles.text}>
        <AppText variant="titleM">
          {has ? "Edit today's reflection" : "Reflect on your day"}
        </AppText>
        <AppText variant="bodySmall" tone="secondary">
          {has ? "Saved on this device." : "Optional. A few words is plenty."}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  text: { flex: 1, gap: 2 },
});
