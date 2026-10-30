import { AppText } from "@/components/ui/AppText";
import { listRules, type PersonalRule } from "@/db/repositories/rules";
import { toDateKey } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

/** One of your rules, rotating daily. Hidden when you have none, so Today stays calm. */
export function RuleOfDay() {
  const { colors } = useTheme();
  const router = useRouter();
  const [rules, setRules] = useState<PersonalRule[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listRules()
        .then((list) => {
          if (active) setRules(list);
        })
        .catch((error) => console.warn("Could not load rules", error));
      return () => {
        active = false;
      };
    }, []),
  );

  if (rules.length === 0) return null;

  const [y, m, d] = toDateKey().split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const rule = rules[dayNumber % rules.length];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rule for today: ${rule.text}. Open your personal rules.`}
      onPress={() => router.push("/rules")}
      style={[styles.card, { backgroundColor: colors.primarySoft }]}
    >
      <Ionicons name="bookmark-outline" size={20} color={colors.primaryText} />
      <View style={styles.text}>
        <AppText variant="caption" tone="accent">
          RULE FOR TODAY
        </AppText>
        <AppText variant="body" numberOfLines={3}>
          {rule.text}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  text: { flex: 1, gap: 2 },
});
