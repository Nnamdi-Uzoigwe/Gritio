import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { TimeWheelBody } from "@/components/ui/TimeWheelSheet";
import { DevNotificationTools } from "@/features/notifications/components/DevNotificationTools";
import {
    getPermissionInfo,
    requestPermission,
    type PermissionInfo,
} from "@/features/notifications/permissions";
import {
    loadNotificationPrefs,
    saveNotificationPrefs,
    type NotificationPrefs,
} from "@/features/notifications/prefs";
import { requestReconcile } from "@/features/notifications/service";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing, touch } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    AppState,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from "react-native";

function ToggleRow({
  title,
  subtitle,
  value,
  disabled,
  onChange,
  children,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rowWrap, disabled && styles.dim]}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <AppText variant="titleM">{title}</AppText>
          {subtitle ? (
            <AppText variant="bodySmall" tone="secondary">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <Switch
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel={title}
        />
      </View>
      {children}
    </View>
  );
}

function TimeChip({
  label,
  time,
  onPress,
}: {
  label: string;
  time: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${formatTime12(time)}. Tap to change.`}
      onPress={onPress}
      style={[styles.timeChip, { backgroundColor: colors.surfaceSunken }]}
    >
      <Ionicons name="time-outline" size={18} color={colors.primaryText} />
      <AppText variant="label" tone="accent">
        {formatTime12(time)}
      </AppText>
    </Pressable>
  );
}

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [permission, setPermission] = useState<PermissionInfo | null>(null);
  const [timeSheet, setTimeSheet] = useState<"planning" | "reflection" | null>(
    null,
  );
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [p, perm] = await Promise.all([
        loadNotificationPrefs(),
        getPermissionInfo(),
      ]);
      setPrefs(p);
      setPermission(perm);
      setFailed(false);
    } catch (error) {
      console.warn("Could not load notification settings", error);
      setFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // The person may come back from the system settings screen.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        getPermissionInfo().then(setPermission);
        requestReconcile();
      }
    });
    return () => sub.remove();
  }, []);

  const update = async (patch: Partial<NotificationPrefs>) => {
    if (!prefs) return;
    const enabling = Object.values(patch).some((v) => v === true);
    if (enabling && permission?.state !== "granted") {
      const result = await requestPermission();
      setPermission(result);
      if (result.state !== "granted") return; // the card below explains what to do
    }
    setPrefs({ ...prefs, ...patch });
    try {
      await saveNotificationPrefs(patch);
      requestReconcile();
    } catch (error) {
      console.warn("Could not save notification settings", error);
      Alert.alert("Could not save", "Something went wrong. Please try again.");
      refresh();
    }
  };

  const allowOrOpenSettings = async () => {
    if (
      permission &&
      permission.state === "denied" &&
      !permission.canAskAgain
    ) {
      Linking.openSettings().catch(() =>
        Alert.alert(
          "Could not open settings",
          "Open your phone settings and allow notifications for Gritio.",
        ),
      );
      return;
    }
    const result = await requestPermission();
    setPermission(result);
    if (result.state === "granted") requestReconcile();
  };

  const granted = permission?.state === "granted";
  const off = !prefs?.masterEnabled;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {prefs === null && !failed ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : null}

        {failed ? (
          <View style={styles.gap}>
            <AppText variant="titleM">Could not load settings</AppText>
            <Button label="Try again" onPress={refresh} />
          </View>
        ) : null}

        {prefs && permission ? (
          <>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: granted
                    ? colors.successSoft
                    : colors.warningSoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <Ionicons
                  name={
                    granted
                      ? "checkmark-circle-outline"
                      : "notifications-off-outline"
                  }
                  size={22}
                  color={granted ? colors.success : colors.warning}
                />
                <AppText variant="titleM" style={styles.flex}>
                  {granted
                    ? "Notifications are allowed"
                    : "Notifications are off"}
                </AppText>
              </View>
              <AppText variant="bodySmall" tone="secondary">
                {granted
                  ? "Gritio can remind you. You choose exactly which reminders you want below."
                  : permission.state === "denied" && !permission.canAskAgain
                    ? "They are turned off in your phone settings. Gritio works fully without them, and you can turn them on whenever you like."
                    : "Reminders can help you remember planned habits, tasks and goal steps. Gritio works fully without them."}
              </AppText>
              {!granted ? (
                <Button
                  label={
                    permission.state === "denied" && !permission.canAskAgain
                      ? "Open settings"
                      : "Allow notifications"
                  }
                  onPress={allowOrOpenSettings}
                />
              ) : null}
            </View>

            <View
              style={[
                styles.group,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ToggleRow
                title="Reminders"
                subtitle="Turn every Gritio reminder on or off."
                value={prefs.masterEnabled}
                onChange={(value) => update({ masterEnabled: value })}
              />
            </View>

            <AppText variant="caption" tone="muted">
              DAILY
            </AppText>
            <View
              style={[
                styles.group,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ToggleRow
                title="Daily planning"
                subtitle="A nudge to decide what matters today."
                value={prefs.planningEnabled}
                disabled={off}
                onChange={(value) => update({ planningEnabled: value })}
              >
                {prefs.planningEnabled && !off ? (
                  <TimeChip
                    label="Planning time"
                    time={prefs.planningTime}
                    onPress={() => setTimeSheet("planning")}
                  />
                ) : null}
              </ToggleRow>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <ToggleRow
                title="Evening reflection"
                subtitle="A moment to look back on the day."
                value={prefs.reflectionEnabled}
                disabled={off}
                onChange={(value) => update({ reflectionEnabled: value })}
              >
                {prefs.reflectionEnabled && !off ? (
                  <TimeChip
                    label="Reflection time"
                    time={prefs.reflectionTime}
                    onPress={() => setTimeSheet("reflection")}
                  />
                ) : null}
              </ToggleRow>
            </View>

            <AppText variant="caption" tone="muted">
              ITEMS
            </AppText>
            <View
              style={[
                styles.group,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ToggleRow
                title="Habit reminders"
                subtitle="For habits that have a reminder switched on."
                value={prefs.habitRemindersEnabled}
                disabled={off}
                onChange={(value) => update({ habitRemindersEnabled: value })}
              />
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <ToggleRow
                title="Task and goal step reminders"
                subtitle="For tasks and steps that have a reminder switched on."
                value={prefs.taskRemindersEnabled}
                disabled={off}
                onChange={(value) => update({ taskRemindersEnabled: value })}
              />
            </View>

            <AppText variant="bodySmall" tone="muted">
              Reminders are a best effort. Focus modes, Do Not Disturb, battery
              settings and your phone's own rules can delay or hide them, so
              please don't rely on a reminder arriving at an exact second.
            </AppText>

            {__DEV__ ? <DevNotificationTools /> : null}
          </>
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={timeSheet !== null}
        onClose={() => setTimeSheet(null)}
        title={timeSheet === "planning" ? "Planning time" : "Reflection time"}
      >
        {prefs ? (
          <TimeWheelBody
            value={
              timeSheet === "reflection"
                ? prefs.reflectionTime
                : prefs.planningTime
            }
            onConfirm={(next) => {
              const which = timeSheet;
              setTimeSheet(null);
              if (which === "planning") update({ planningTime: next });
              if (which === "reflection") update({ reflectionTime: next });
            }}
          />
        ) : (
          <View />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  loader: { marginTop: spacing.xxl },
  gap: { gap: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  group: { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
  rowWrap: { padding: spacing.lg, gap: spacing.md },
  dim: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  divider: { height: 1 },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    minHeight: touch.minTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
});
