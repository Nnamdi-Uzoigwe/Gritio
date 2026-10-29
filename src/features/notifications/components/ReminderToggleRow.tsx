import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { ensureReminderPermission } from "../ensurePermission";
import { loadNotificationPrefs, type NotificationPrefs } from "../prefs";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  category: "habit" | "task";
  subtitle: string;
};

/** A "Remind me" switch that asks for permission at the moment it is first turned on. */
export function ReminderToggleRow({
  value,
  onChange,
  category,
  subtitle,
}: Props) {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    loadNotificationPrefs()
      .then(setPrefs)
      .catch((error) =>
        console.warn("Could not read notification settings", error),
      );
  }, []);

  const handleChange = async (next: boolean) => {
    if (!next) {
      onChange(false);
      return;
    }
    if (await ensureReminderPermission()) onChange(true);
  };

  let hint: string | null = null;
  if (value && prefs) {
    if (!prefs.masterEnabled)
      hint =
        "Reminders are switched off in Settings, so this one will stay quiet.";
    else if (category === "habit" && !prefs.habitRemindersEnabled)
      hint = "Habit reminders are switched off in Settings.";
    else if (category === "task" && !prefs.taskRemindersEnabled)
      hint = "Task and step reminders are switched off in Settings.";
  }

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceSunken }]}>
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="titleM">Remind me</AppText>
          <AppText variant="bodySmall" tone="secondary">
            {subtitle}
          </AppText>
        </View>
        <Switch
          value={value}
          onValueChange={handleChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Remind me"
        />
      </View>
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, borderRadius: radii.lg, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  text: { flex: 1, gap: 2 },
});
