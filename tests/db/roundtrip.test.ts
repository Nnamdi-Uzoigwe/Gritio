import { addDays, toDateKey } from "@/lib/dates";
import { countRows, freshApp, type App } from "../helpers/app";
import { clone, normalizeData } from "../helpers/fixtures";

const today = toDateKey();
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

async function seed(app: App): Promise<{ goalId: string }> {
  await app.settings.setSetting("user_name", "Ada");
  await app.settings.setSetting("theme_mode", "dark");

  const goalId = await app.goals.createGoal(
    { title: "Learn", category: "learning", startDate: addDays(today, -5) },
    { milestones: [{ title: "M", steps: ["a", "b"] }], looseSteps: ["c"] },
  );
  const plan = await app.steps.getGoalPlan(goalId);
  await app.steps.setStepDone(plan.milestones[0].steps[0].id, true);
  await app.steps.scheduleStep(plan.looseSteps[0].id, today);

  const habitId = await app.habits.createHabit({
    name: "Read",
    weekdays: ALL_DAYS,
    startDate: addDays(today, -5),
    minimumLabel: "2 pages",
    targetLabel: "20 pages",
    timeOfDay: "07:00",
    remindersEnabled: true,
  });
  await app.habits.setHabitCompletion(habitId, addDays(today, -1), "target");
  await app.habits.setHabitCompletion(habitId, addDays(today, -2), "minimum");

  await app.tasks.createTask({
    title: "Task",
    date: today,
    time: "09:00",
    reminder: true,
  });
  await app.reflections.saveReflection(addDays(today, -1), {
    wentWell: "Good",
    struggled: "",
    learned: "",
    improveTomorrow: "",
  });
  await app.rules.addRule("Plan tomorrow");
  return { goalId };
}

describe("backup and restore", () => {
  it("restores exactly what was backed up, replacing whatever is there now", async () => {
    const app = await freshApp();
    const { goalId } = await seed(app);

    const original = await app.collect.collectBackup();
    const checked = app.validate.validateBackup(clone(original));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;

    // Change everything the backup covers, and add device only data the restore must clear.
    await app.goals.deleteGoal(goalId);
    await app.tasks.createTask({ title: "Extra", date: today });
    await app.settings.setSetting("user_name", "Someone else");
    await app.db.runAsync(
      "INSERT INTO scheduled_notifications (id, kind, fire_at, created_at) VALUES ('x', 'task', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')",
    );
    await app.db.runAsync(
      "INSERT INTO inbox_notifications (id, kind, title, created_at) VALUES ('i', 'task', 'Hello', '2026-01-01T00:00:00.000Z')",
    );

    await app.restore.restoreBackup(checked.backup);

    const after = await app.collect.collectBackup();
    expect(normalizeData(after.data)).toEqual(normalizeData(original.data));
    expect(await countRows(app.db, "scheduled_notifications")).toBe(0);
    expect(await countRows(app.db, "inbox_notifications")).toBe(0);
    expect(await app.settings.getSetting("onboarding_completed")).toBe("1");
    expect(await app.settings.getSetting("user_name")).toBe("Ada");
  });

  it("leaves everything exactly as it was if a restore fails part way", async () => {
    const app = await freshApp();
    await app.goals.createGoal({ title: "Keep me", startDate: today });
    const before = await app.collect.collectBackup();

    // A step that belongs to a goal that does not exist breaks the restore after earlier tables were already cleared.
    const broken = clone(before);
    broken.data.goals = [];
    broken.data.goal_steps = [
      {
        id: "s1",
        goal_id: "ghost",
        milestone_id: null,
        title: "x",
        notes: null,
        due_date: null,
        scheduled_date: null,
        scheduled_time: null,
        reminder_enabled: 0,
        position: 0,
        completed_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    await expect(app.restore.restoreBackup(broken)).rejects.toBeTruthy();

    const after = await app.collect.collectBackup();
    expect(normalizeData(after.data)).toEqual(normalizeData(before.data));
    expect(await countRows(app.db, "goals")).toBe(1);
  });

  it("never puts App Lock or the splash flag into a backup", async () => {
    const app = await freshApp();
    await app.settings.setSetting("user_name", "Ada");
    await app.settings.setSetting("app_lock_enabled", "1");
    await app.settings.setSetting("splash_seen", "1");

    const backup = await app.collect.collectBackup();
    expect(backup.data.settings.map((s) => s.key)).toEqual(["user_name"]);
  });
});
