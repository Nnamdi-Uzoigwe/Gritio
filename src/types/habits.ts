import type { FocusAreaId, HabitLevel, HabitStatus } from "./domain";

export type HabitCompletion = { date: string; level: HabitLevel };

export type HabitItem = {
  id: string;
  name: string;
  description: string | null;
  category: FocusAreaId | null;
  status: HabitStatus;
  startDate: string;
  minimumLabel: string | null;
  targetLabel: string | null;
  /** Preferred time of day, "HH:mm". Orders the habit on Today and is the reminder time. */
  timeOfDay: string | null;
  remindersEnabled: boolean;
  weekdays: number[];
  completions: HabitCompletion[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type HabitInput = {
  name: string;
  description?: string | null;
  category?: FocusAreaId | null;
  weekdays: number[];
  startDate: string;
  timeOfDay?: string | null;
  remindersEnabled?: boolean;
  minimumLabel?: string | null;
  targetLabel?: string | null;
};
