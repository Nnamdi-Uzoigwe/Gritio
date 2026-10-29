export type ThemeMode = "light" | "dark" | "system";
export type GoalStatus = "active" | "completed" | "archived";
export type HabitStatus = "active" | "archived";
export type TaskStatus = "pending" | "done";
export type HabitLevel = "minimum" | "target";

/** 0 = Sunday ... 6 = Saturday, matching JavaScript's Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type FocusAreaId =
  | "discipline"
  | "health"
  | "learning"
  | "career"
  | "productivity"
  | "reading"
  | "finance"
  | "routines"
  | "other";

export type SettingKey =
  | "user_name"
  | "onboarding_completed"
  | "splash_seen"
  | "wake_time"
  | "planning_time"
  | "reflection_time"
  | "planning_reminder_enabled"
  | "reflection_reminder_enabled"
  | "notifications_enabled"
  | "habit_reminders_enabled"
  | "task_reminders_enabled"
  | "theme_mode"
  | "app_lock_enabled";
