import { AppText } from "@/components/ui/AppText";
import type { Accomplishment } from "@/db/repositories/progress";
import { formatShortDate } from "@/lib/dates";
import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

const ICON: Record<Accomplishment["kind"], IconName> = {
  goal: "trophy-outline",
  milestone: "flag-outline",
  review: "checkmark-done-outline",
};

export function Accomplishments({ items }: { items: Accomplishment[] }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {items.slice(0, 10).map((item, i) => (
        <View
          key={item.id}
          style={[
            styles.row,
            i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons
              name={ICON[item.kind]}
              size={20}
              color={colors.primaryText}
            />
          </View>
          <View style={styles.text}>
            <AppText variant="titleM" numberOfLines={2}>
              {item.title}
            </AppText>
            {item.subtitle ? (
              <AppText variant="bodySmall" tone="secondary" numberOfLines={1}>
                {item.subtitle}
              </AppText>
            ) : null}
          </View>
          <AppText variant="caption" tone="muted">
            {formatShortDate(item.date)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
});
