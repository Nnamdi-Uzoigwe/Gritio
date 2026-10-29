import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

type Props = {
  totalCompletions: number;
  canDoNow: boolean;
  nextLabel: string | null;
  onDoNow: () => void;
};

/** Shown after missed days. Encouraging, never a verdict, and nothing is reset. */
export function RecoveryCard({
  totalCompletions,
  canDoNow,
  nextLabel,
  onDoNow,
}: Props) {
  const { colors } = useTheme();

  const message =
    totalCompletions > 0
      ? `A fresh start is always available. Your ${totalCompletions} ${totalCompletions === 1 ? "completion" : "completions"} still count.`
      : "Every habit starts somewhere. Today is a good day to begin.";

  return (
    <View style={[styles.card, { backgroundColor: colors.primarySoft }]}>
      <View style={styles.top}>
        <Ionicons name="leaf-outline" size={22} color={colors.primaryText} />
        <AppText variant="titleM" style={styles.title}>
          Welcome back
        </AppText>
      </View>
      <AppText tone="secondary">{message}</AppText>
      {canDoNow ? (
        <Button label="Do it now" onPress={onDoNow} />
      ) : nextLabel ? (
        <AppText
          variant="bodySmall"
          tone="secondary"
        >{`Your next one is ${nextLabel}.`}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, borderRadius: radii.lg, gap: spacing.md },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flex: 1 },
});
