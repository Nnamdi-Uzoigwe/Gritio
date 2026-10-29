import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { getDb } from "@/db/client";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { NOTIFICATION_CONFIG } from "../config";
import {
    ensureAndroidChannel,
    getNotificationPermission,
    requestPermission,
} from "../permissions";
import { reconcileNow } from "../service";

type Row = { id: string; fireAt: string };

/** Development only. Compares what the OS holds with what our records say, to catch duplicates and leaks. */
export function DevNotificationTools() {
  const { colors } = useTheme();
  const [os, setOs] = useState<Row[]>([]);
  const [records, setRecords] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      setOs(
        all
          .filter((r) => r.identifier.startsWith(NOTIFICATION_CONFIG.idPrefix))
          .map((r) => ({
            id: r.identifier,
            fireAt: JSON.stringify(r.trigger),
          })),
      );
      const db = await getDb();
      const rows = await db.getAllAsync<{ id: string; fire_at: string }>(
        "SELECT id, fire_at FROM scheduled_notifications ORDER BY fire_at ASC",
      );
      setRecords(rows.map((r) => ({ id: r.id, fireAt: r.fire_at })));
    } catch (error) {
      console.warn("Inspector failed", error);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendTest = async () => {
    if ((await getNotificationPermission()) !== "granted") {
      const result = await requestPermission();
      if (result.state !== "granted") {
        Alert.alert("Notifications are off", "Allow notifications first.");
        return;
      }
    }
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: "gritio-test", // no gritio: prefix, so reconcile never removes it
      content: {
        title: "Gritio test",
        body: "If you can read this, reminders work on this device.",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 5000),
        channelId: NOTIFICATION_CONFIG.channelId,
      },
    });
    setMessage(
      "Test scheduled. Lock the phone or leave the app and wait 5 seconds.",
    );
  };

  const runReconcile = async () => {
    const result = await reconcileNow();
    setMessage(
      `Reconcile: ${result.scheduled} scheduled, ${result.cancelled} cancelled, ${result.kept} kept (permission ${result.permission}).`,
    );
    await refresh();
  };

  const mismatch = os.length !== records.length;

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <AppText variant="titleM">Developer tools</AppText>
      <AppText variant="bodySmall" tone={mismatch ? "error" : "secondary"}>
        {`On the OS: ${os.length}. In our records: ${records.length}.${mismatch ? " These should match." : ""}`}
      </AppText>
      {records.slice(0, 12).map((r) => (
        <AppText key={r.id} variant="caption" tone="muted" numberOfLines={1}>
          {`${r.id.replace(NOTIFICATION_CONFIG.idPrefix, "")}  ${r.fireAt}`}
        </AppText>
      ))}
      {message ? <AppText variant="bodySmall">{message}</AppText> : null}
      <Button
        label="Send a test in 5 seconds"
        variant="secondary"
        onPress={sendTest}
      />
      <Button
        label="Run reconcile now"
        variant="secondary"
        onPress={runReconcile}
      />
      <Button label="Refresh" variant="ghost" onPress={refresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
});
