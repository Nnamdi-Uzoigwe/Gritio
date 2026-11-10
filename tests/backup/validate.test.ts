import { validateBackup } from "@/features/backup/validate";
import { clone, makeBackup } from "../helpers/fixtures";

function errorsOf(input: unknown): string {
  const result = validateBackup(input);
  return result.ok ? "" : result.errors.join(" | ");
}

describe("backup validation", () => {
  it("accepts a complete valid backup and summarizes it", () => {
    const result = validateBackup(clone(makeBackup()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toMatchObject({
      goals: 1,
      activeGoals: 1,
      milestones: 1,
      steps: 1,
      habits: 1,
      activeHabits: 1,
      completions: 1,
      tasks: 1,
      reflections: 1,
      reviews: 1,
      rules: 1,
      hasReminders: true,
    });
  });

  it("reports no reminders when none are switched on", () => {
    const b = makeBackup();
    b.data.habits[0].reminders_enabled = 0;
    b.data.goal_steps[0].reminder_enabled = 0;
    const result = validateBackup(b);
    expect(result.ok && result.summary.hasReminders).toBe(false);
  });

  it("refuses things that are not backups", () => {
    for (const input of [
      null,
      undefined,
      "text",
      42,
      [],
      {},
      { app: "other" },
    ]) {
      expect(validateBackup(input).ok).toBe(false);
    }
    expect(errorsOf({ ...makeBackup(), app: "other" })).toContain(
      "not a Gritio backup",
    );
  });

  it("refuses backups from a newer version of the app", () => {
    const newerFormat = validateBackup({ ...makeBackup(), format: 2 });
    const newerSchema = validateBackup({ ...makeBackup(), schemaVersion: 3 });
    expect(newerFormat).toMatchObject({ ok: false, kind: "newer" });
    expect(newerSchema).toMatchObject({ ok: false, kind: "newer" });
  });

  it("refuses an unreadable version or date", () => {
    expect(validateBackup({ ...makeBackup(), format: "one" }).ok).toBe(false);
    expect(validateBackup({ ...makeBackup(), format: 0 }).ok).toBe(false);
    expect(
      validateBackup({ ...makeBackup(), exportedAt: "yesterday" }).ok,
    ).toBe(false);
  });

  it("refuses a backup with a missing section", () => {
    const b = clone(makeBackup()) as unknown as {
      data: Record<string, unknown>;
    };
    delete b.data.tasks;
    expect(errorsOf(b)).toContain('The "tasks" section is missing.');
  });

  it("refuses invalid dates, times and values", () => {
    const date = makeBackup();
    date.data.goals[0].start_date = "2026-13-01";
    expect(errorsOf(date)).toContain('"start_date" is not a valid date');

    const time = makeBackup();
    time.data.goal_steps[0].scheduled_time = "25:99";
    expect(errorsOf(time)).toContain('"scheduled_time" is not a valid time');

    const status = makeBackup();
    status.data.goals[0].status = "banana";
    expect(errorsOf(status)).toContain('"status" has an unknown value');

    const long = makeBackup();
    long.data.goals[0].title = "x".repeat(101);
    expect(errorsOf(long)).toContain('"title" is too long');
  });

  it("refuses records that point at things that are not in the backup", () => {
    const step = makeBackup();
    step.data.goal_steps[0].goal_id = "ghost";
    expect(errorsOf(step)).toContain(
      "belongs to a goal that is not in the backup",
    );

    const completion = makeBackup();
    completion.data.habit_completions[0].habit_id = "ghost";
    expect(errorsOf(completion)).toContain(
      "belongs to a habit that is not in the backup",
    );

    const task = makeBackup();
    task.data.tasks[0].goal_id = "ghost";
    expect(errorsOf(task)).toContain(
      "linked to a goal that is not in the backup",
    );
  });

  it("refuses duplicate ids and duplicate completions", () => {
    const goals = makeBackup();
    goals.data.goals.push({ ...goals.data.goals[0] });
    expect(errorsOf(goals)).toContain("appears more than once");

    const completions = makeBackup();
    completions.data.habit_completions.push({
      ...completions.data.habit_completions[0],
      id: "c2",
    });
    expect(errorsOf(completions)).toContain("appears more than once");
  });

  it("refuses a habit that has no scheduled days", () => {
    const b = makeBackup();
    b.data.habit_schedules = [];
    expect(errorsOf(b)).toContain("has no scheduled days");
  });

  it("refuses a weekly review that does not start on a Monday", () => {
    const b = makeBackup();
    b.data.weekly_reviews[0].week_start = "2026-10-06";
    expect(errorsOf(b)).toContain("does not start on a Monday");
  });

  it("refuses preferences that must not travel in a file, such as App Lock", () => {
    const b = makeBackup();
    b.data.settings.push({ key: "app_lock_enabled", value: "1" });
    expect(errorsOf(b)).toContain("unknown preference");

    const theme = makeBackup();
    theme.data.settings[1].value = "neon";
    expect(errorsOf(theme)).toContain("unknown theme");
  });

  it("refuses a backup over the active goal or habit limits instead of dropping data", () => {
    const goals = makeBackup();
    const goal = goals.data.goals[0];
    goals.data.goals = Array.from({ length: 11 }, (_, i) => ({
      ...goal,
      id: `g${i + 1}`,
    }));
    expect(errorsOf(goals)).toContain("11 active goals");

    const habits = makeBackup();
    const row = habits.data.habits[0];
    habits.data.habits = Array.from({ length: 11 }, (_, i) => ({
      ...row,
      id: `h${i + 1}`,
    }));
    habits.data.habit_schedules = habits.data.habits.map((h) => ({
      habit_id: String(h.id),
      weekday: 1,
    }));
    expect(errorsOf(habits)).toContain("11 active habits");
  });

  it("allows archived and completed items beyond the limit", () => {
    const b = makeBackup();
    const goal = b.data.goals[0];
    b.data.goals = Array.from({ length: 15 }, (_, i) => ({
      ...goal,
      id: `g${i + 1}`,
      status: i < 5 ? "active" : "archived",
    }));
    expect(validateBackup(b).ok).toBe(true);
  });
});
