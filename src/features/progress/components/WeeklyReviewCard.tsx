import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import type { WeeklyReview } from "@/db/repositories/reviews";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

type Props = { review: WeeklyReview | null; onOpen: () => void };

export function WeeklyReviewCard({ review, onOpen }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: review ? colors.successSoft : colors.primarySoft },
      ]}
    >
      <View style={styles.top}>
        <Ionicons
          name={review ? "checkmark-circle-outline" : "calendar-outline"}
          size={22}
          color={review ? colors.success : colors.primaryText}
        />
        <AppText variant="titleM" style={styles.title}>
          {review ? "This week is reviewed" : "Weekly review"}
        </AppText>
      </View>

      {review && review.priorities.length > 0 ? (
        <View style={styles.priorities}>
          <AppText variant="caption" tone="muted">
            YOUR PRIORITIES THIS WEEK
          </AppText>
          {review.priorities.map((p, i) => (
            <AppText key={`${i}-${p}`}>{`${i + 1}. ${p}`}</AppText>
          ))}
        </View>
      ) : (
        <AppText tone="secondary">
          {review
            ? "Nicely done. You can look back or change it any time."
            : "Take a few minutes to look back on the week and choose what matters next. It is optional."}
        </AppText>
      )}

      <Button
        label={review ? "View or edit review" : "Start weekly review"}
        variant={review ? "secondary" : "primary"}
        onPress={onOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, borderRadius: radii.lg, gap: spacing.md },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flex: 1 },
  priorities: { gap: spacing.xs },
});
