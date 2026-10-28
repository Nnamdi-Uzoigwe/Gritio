import { AppText } from "@/components/ui/AppText";
import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StepFrame } from "../components/StepFrame";
import { useOnboardingStore } from "../store";

const SAMPLES: ReadonlyArray<{ icon: IconName; title: string; body: string }> =
  [
    {
      icon: "book-outline",
      title: "Read for 20 minutes",
      body: "Habit reminder",
    },
    {
      icon: "sunny-outline",
      title: "Plan your day",
      body: "Two minutes now saves an hour later.",
    },
    {
      icon: "moon-outline",
      title: "Evening reflection",
      body: "What went well today?",
    },
  ];

export function NotificationsStep({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const answer = useOnboardingStore((s) => s.notificationAnswer);

  return (
    <StepFrame
      title="Gentle reminders, when you want them."
      subtitle="Reminders help you remember planned habits, daily commitments and scheduled goal steps. You stay in control of every one."
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.samples}
      >
        {SAMPLES.map((sample, i) => (
          <Animated.View
            key={`${sample.title}-${active}`}
            entering={FadeInDown.delay(150 + i * 180).duration(420)}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.icon, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons
                name={sample.icon}
                size={20}
                color={colors.primaryText}
              />
            </View>
            <View style={styles.cardText}>
              <AppText variant="label">{sample.title}</AppText>
              <AppText variant="bodySmall" tone="secondary">
                {sample.body}
              </AppText>
            </View>
          </Animated.View>
        ))}
      </View>

      {answer === "denied" ? (
        <View style={[styles.note, { backgroundColor: colors.warningSoft }]}>
          <AppText variant="bodySmall">
            Notifications are off. Gritio works fully without them, and you can
            turn them on anytime in Settings.
          </AppText>
        </View>
      ) : null}
    </StepFrame>
  );
}

const styles = StyleSheet.create({
  samples: { gap: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 2 },
  note: { padding: spacing.lg, borderRadius: radii.md },
});
