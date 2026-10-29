import { getDb } from "@/db/client";
import { loadPlannerData } from "@/db/repositories/notificationSnapshot";
import { addDays, toDateKey } from "@/lib/dates";
import { runSerial } from "@/lib/serial";
import * as Notifications from "expo-notifications";
import { NOTIFICATION_CONFIG } from "./config";
import {
    ensureAndroidChannel,
    getNotificationPermission,
    type PermissionState,
} from "./permissions";
import { planNotifications, type PlannedNotification } from "./planner";
import { loadNotificationPrefs } from "./prefs";

export type ReconcileResult = {
  permission: PermissionState;
  scheduled: number;
  cancelled: number;
  kept: number;
};

type RecordRow = {
  id: string;
  fire_at: string;
  title: string | null;
  body: string | null;
};

async function schedule(p: PlannedNotification): Promise<void> {
  const channelId = NOTIFICATION_CONFIG.channelId;
  const trigger: Notifications.NotificationTriggerInput = p.repeat
    ? {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: p.repeat.hour,
        minute: p.repeat.minute,
        channelId,
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.at as Date,
        channelId,
      };

  // Same identifier means the OS replaces the old one, so a repeated call can never duplicate.
  await Notifications.scheduleNotificationAsync({
    identifier: p.id,
    content: {
      title: p.title,
      body: p.body,
      sound: "default",
      data: { kind: p.kind, refId: p.refId },
    },
    trigger,
  });
}

/**
 * The single place reminders are scheduled. It computes what should exist, compares that with what
 * the OS and our records actually hold, and makes them match. Safe to call any number of times.
 */
export function reconcileNow(): Promise<ReconcileResult> {
  return runSerial(async () => {
    const db = await getDb();
    const prefix = NOTIFICATION_CONFIG.idPrefix;
    const permission = await getNotificationPermission();

    let desired: PlannedNotification[] = [];
    if (permission === "granted") {
      await ensureAndroidChannel();
      const now = new Date();
      const today = toDateKey(now);
      const prefs = await loadNotificationPrefs();
      const data = await loadPlannerData(
        today,
        addDays(today, NOTIFICATION_CONFIG.horizonDays),
      );
      desired = planNotifications({ now, prefs, ...data });
    }
    // Without permission, desired stays empty, so everything of ours is cleaned up.
    // When permission returns, the next reconcile rebuilds the reminders from the data.

    const desiredById = new Map(desired.map((p) => [p.id, p]));
    const osOurs = (
      await Notifications.getAllScheduledNotificationsAsync()
    ).filter((r) => r.identifier.startsWith(prefix));
    const osIds = new Set(osOurs.map((r) => r.identifier));
    const records = await db.getAllAsync<RecordRow>(
      "SELECT id, fire_at, title, body FROM scheduled_notifications",
    );
    const recordById = new Map(records.map((r) => [r.id, r]));

    let cancelled = 0;
    for (const r of osOurs) {
      if (desiredById.has(r.identifier)) continue;
      try {
        await Notifications.cancelScheduledNotificationAsync(r.identifier);
        cancelled += 1;
      } catch (error) {
        console.warn("Could not cancel notification", r.identifier, error);
      }
    }

    let kept = 0;
    const written: PlannedNotification[] = [];
    for (const p of desired) {
      const rec = recordById.get(p.id);
      const unchanged =
        rec !== undefined &&
        osIds.has(p.id) &&
        rec.fire_at === p.fireKey &&
        rec.title === p.title &&
        rec.body === p.body;
      if (unchanged) {
        kept += 1;
        continue;
      }
      try {
        await schedule(p);
        written.push(p);
      } catch (error) {
        console.warn("Could not schedule notification", p.id, error);
      }
    }

    // Phase 7b: records whose time has passed are imported into the notification center before this cleanup.
    const orphanIds = records
      .filter((r) => !desiredById.has(r.id))
      .map((r) => r.id);
    const nowIso = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      for (const id of orphanIds)
        await db.runAsync(
          "DELETE FROM scheduled_notifications WHERE id = ?",
          id,
        );
      for (const p of written) {
        await db.runAsync(
          `INSERT INTO scheduled_notifications (id, os_identifier, kind, ref_id, fire_at, created_at, title, body)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET os_identifier = excluded.os_identifier, kind = excluded.kind,
             ref_id = excluded.ref_id, fire_at = excluded.fire_at, title = excluded.title, body = excluded.body`,
          p.id,
          p.id,
          p.kind,
          p.refId,
          p.fireKey,
          nowIso,
          p.title,
          p.body,
        );
      }
    });

    return { permission, scheduled: written.length, cancelled, kept };
  });
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Call this after any data or preference change. Bursts collapse into a single reconcile. */
export function requestReconcile(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    reconcileNow().catch((error) => console.warn("Reconcile failed", error));
  }, NOTIFICATION_CONFIG.debounceMs);
}
