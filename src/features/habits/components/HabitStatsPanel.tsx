import { AppText } from "@/components/ui/AppText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { HabitStats } from "@/lib/habitStats";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { StyleSheet, View } from "react-native";

type Tile = { label: string; value: number };

/** Shows only numbers that are meaningful. Streaks appear from 2 in a row, never as a zero. */
export function HabitStatsPanel({ stats }: { stats: HabitStats }) {
  const { colors } = useTheme();
  const hasWindow = stats.windowScheduled > 0;

  const tiles: Tile[] = [];
  if (stats.currentStreak >= 2)
    tiles.push({ label: "In a row", value: stats.currentStreak });
  if (stats.bestStreak >= 2)
    tiles.push({ label: "Best run", value: stats.bestStreak });
  if (stats.totalCompletions >= 1)
    tiles.push({ label: "Total done", value: stats.totalCompletions });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <AppText variant="caption" tone="muted">
        LAST 30 DAYS
      </AppText>

      {hasWindow ? (
        <>
          <AppText variant="displayM">{`${stats.windowCompleted} of ${stats.windowScheduled}`}</AppText>
          <AppText variant="bodySmall" tone="secondary">
            scheduled days done
          </AppText>
          <ProgressBar
            progress={stats.windowCompleted / stats.windowScheduled}
            color={colors.primary}
            trackColor={colors.surfaceSunken}
            height={8}
          />
        </>
      ) : (
        <AppText tone="secondary">
          Not enough days yet. Your consistency shows up here after a few
          scheduled days.
        </AppText>
      )}

      {tiles.length > 0 ? (
        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <View
              key={tile.label}
              style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}
            >
              <AppText variant="displayM">{tile.value}</AppText>
              <AppText variant="caption" tone="muted">
                {tile.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <AppText variant="bodySmall" tone="muted">
        A missed day never erases what you have already done.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  tiles: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  tile: { flex: 1, padding: spacing.md, borderRadius: radii.md, gap: 2 },
});
