import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { HabitRate } from "@/lib/progressStats";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { StyleSheet, View } from "react-native";

export function HabitRates({ rates }: { rates: HabitRate[] }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {rates.map((rate, i) => (
        <View
          key={rate.id}
          style={[
            styles.row,
            i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.top}>
            <AppText variant="titleM" numberOfLines={1} style={styles.name}>
              {rate.name}
            </AppText>
            {rate.archived ? <Chip label="Archived" /> : null}
          </View>
          <ProgressBar
            progress={rate.completed / rate.scheduled}
            color={
              rate.completed === rate.scheduled
                ? colors.success
                : colors.primary
            }
            trackColor={colors.surfaceSunken}
          />
          <AppText variant="caption" tone="secondary">
            {`${rate.completed} of ${rate.scheduled} scheduled ${rate.scheduled === 1 ? "day" : "days"}`}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  row: { padding: spacing.lg, gap: spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flex: 1 },
});
