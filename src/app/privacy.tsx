import { AppText } from "@/components/ui/AppText";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import type { IconName } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, View } from "react-native";

type SectionProps = {
  icon: IconName;
  title: string;
  lines: ReadonlyArray<string>;
};

function Section({ icon, title, lines }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={colors.primaryText} />
        </View>
        <AppText variant="titleM" style={styles.flex}>
          {title}
        </AppText>
      </View>
      {lines.map((line) => (
        <AppText key={line} variant="bodySmall" tone="secondary">
          {line}
        </AppText>
      ))}
    </View>
  );
}

export default function PrivacyScreen() {
  return <PrivacyBody />;
}

function PrivacyBody() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Privacy" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText tone="secondary">
          Gritio is built to be a private place for your goals and habits. Here
          is, in plain words, how it treats your information.
        </AppText>

        <Section
          icon="phone-portrait-outline"
          title="What Gritio stores"
          lines={[
            "Your name if you choose to give one, your goals with their milestones and steps, your habits and their history, your tasks, your reflections, weekly reviews and personal rules, and your preferences.",
            "All of it is stored in a database on your phone.",
          ]}
        />

        <Section
          icon="lock-closed-outline"
          title="Where it stays"
          lines={[
            "Gritio has no accounts and no servers of its own. It does not send your goals, habits, tasks or reflections anywhere, and it works fully without an internet connection.",
          ]}
        />

        <Section
          icon="eye-off-outline"
          title="What Gritio does not do"
          lines={[
            "It does not show advertising, it does not use analytics or tracking, and it does not sell or share your information.",
          ]}
        />

        <Section
          icon="key-outline"
          title="Permissions, and why"
          lines={[
            "Notifications: only if you switch on reminders. Reminders are scheduled on your phone.",
            "Biometrics or passcode: only if you switch on App Lock. Your fingerprint or face data never reaches Gritio. Your phone only tells it whether you unlocked successfully.",
            "Files: only when you create or restore a backup, through your phone's own share and file screens.",
          ]}
        />

        <Section
          icon="document-outline"
          title="Your backups"
          lines={[
            "A backup file is a plain copy of your data. It is not encrypted, and it is yours to keep safe. Gritio never uploads it.",
          ]}
        />

        <Section
          icon="options-outline"
          title="Your control"
          lines={[
            "You can edit or delete anything you create in Gritio. Removing Gritio from your phone removes the data it stored on the phone itself.",
            "Your phone's own backup features may also keep a copy of app data, depending on your phone's settings.",
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
