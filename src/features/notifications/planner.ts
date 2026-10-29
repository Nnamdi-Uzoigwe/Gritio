import { addDays, toDateKey } from "@/lib/dates";
import { isScheduledOn } from "@/lib/habitDays";
import { parseTime } from "@/lib/time";
import { NOTIFICATION_CONFIG } from "./config";
import {
    habitContent,
    planningContent,
    reflectionContent,
    stepContent,
    taskContent,
} from "./content";
import type { NotificationPrefs } from "./prefs";

export type NotificationKind =
  | "planning"
  | "reflection"
  | "habit"
  | "task"
  | "step";

export type PlannerTask = {
  id: string;
  title: string;
  date: string;
  time: string;
};
export type PlannerStep = {
  id: string;
  title: string;
  goalTitle: string;
  date: string;
  time: string;
};
export type PlannerHabit = {
  id: string;
  name: string;
  targetLabel: string | null;
  startDate: string;
  time: string;
  weekdays: number[];
  completedDates: string[];
};

export type PlannerInput = {
  now: Date;
  prefs: NotificationPrefs;
  tasks: PlannerTask[];
  steps: PlannerStep[];
  habits: PlannerHabit[];
};

export type PlannedNotification = {
  /** Stable id, also used as the OS identifier. Re-scheduling the same id replaces it, never duplicates. */
  id: string;
  kind: NotificationKind;
  refId: string | null;
  /** ISO instant for one-off reminders, or "daily@HH:mm" for the repeating ones. */
  fireKey: string;
  at: Date | null;
  repeat: { hour: number; minute: number } | null;
  title: string;
  body: string;
};

function atLocal(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const { hour, minute } = parseTime(time);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

/**
 * Pure function: given the data and preferences, returns exactly the reminders that should exist.
 * No side effects, so it is easy to reason about and test.
 */
export function planNotifications(input: PlannerInput): PlannedNotification[] {
  const { now, prefs } = input;
  if (!prefs.masterEnabled) return [];

  const prefix = NOTIFICATION_CONFIG.idPrefix;
  const repeating: PlannedNotification[] = [];

  const addDaily = (
    kind: "planning" | "reflection",
    time: string,
    text: { title: string; body: string },
  ) => {
    const { hour, minute } = parseTime(time);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
    repeating.push({
      id: `${prefix}${kind}:daily`,
      kind,
      refId: null,
      fireKey: `daily@${time}`,
      at: null,
      repeat: { hour, minute },
      ...text,
    });
  };
  if (prefs.planningEnabled)
    addDaily("planning", prefs.planningTime, planningContent());
  if (prefs.reflectionEnabled)
    addDaily("reflection", prefs.reflectionTime, reflectionContent());

  const today = toDateKey(now);
  const earliest = now.getTime() + NOTIFICATION_CONFIG.minLeadMs;
  const latest = atLocal(
    addDays(today, NOTIFICATION_CONFIG.horizonDays),
    "00:00",
  ).getTime();
  const oneOff: PlannedNotification[] = [];

  const push = (
    id: string,
    kind: NotificationKind,
    refId: string,
    at: Date,
    text: { title: string; body: string },
  ) => {
    const ms = at.getTime();
    if (Number.isNaN(ms) || ms < earliest || ms >= latest) return;
    oneOff.push({
      id,
      kind,
      refId,
      fireKey: at.toISOString(),
      at,
      repeat: null,
      ...text,
    });
  };

  if (prefs.taskRemindersEnabled) {
    for (const t of input.tasks) {
      push(
        `${prefix}task:${t.id}`,
        "task",
        t.id,
        atLocal(t.date, t.time),
        taskContent(t.id, t.title),
      );
    }
    for (const s of input.steps) {
      push(
        `${prefix}step:${s.id}`,
        "step",
        s.id,
        atLocal(s.date, s.time),
        stepContent(s.title, s.goalTitle),
      );
    }
  }

  if (prefs.habitRemindersEnabled) {
    for (const h of input.habits) {
      const done = new Set(h.completedDates);
      for (let i = 0; i < NOTIFICATION_CONFIG.horizonDays; i++) {
        const day = addDays(today, i);
        if (
          done.has(day) ||
          !isScheduledOn({ weekdays: h.weekdays, startDate: h.startDate }, day)
        )
          continue;
        push(
          `${prefix}habit:${h.id}:${day}`,
          "habit",
          h.id,
          atLocal(day, h.time),
          habitContent(h.id, h.name, h.targetLabel),
        );
      }
    }
  }

  oneOff.sort(
    (a, b) =>
      (a.at as Date).getTime() - (b.at as Date).getTime() ||
      a.id.localeCompare(b.id),
  );
  return [...repeating, ...oneOff.slice(0, NOTIFICATION_CONFIG.maxOneOff)];
}
