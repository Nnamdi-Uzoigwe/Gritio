import { addDays, toDateKey } from "@/lib/dates";
import { countRows, freshApp } from "../helpers/app";

const today = toDateKey();
const start = addDays(today, -10);
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

describe("habit completions", () => {
  it("keeps one completion per day however often it is recorded", async () => {
    const { db, habits } = await freshApp();
    const id = await habits.createHabit({
      name: "Read",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    const day = addDays(today, -1);

    await habits.setHabitCompletion(id, day, "target");
    await habits.setHabitCompletion(id, day, "target");
    expect(await countRows(db, "habit_completions")).toBe(1);
  });

  it("changes the level of a day instead of adding another", async () => {
    const { habits } = await freshApp();
    const id = await habits.createHabit({
      name: "Read",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    const day = addDays(today, -1);

    await habits.setHabitCompletion(id, day, "target");
    await habits.setHabitCompletion(id, day, "minimum");
    const habit = await habits.getHabit(id);
    expect(habit?.completions).toEqual([{ date: day, level: "minimum" }]);
  });

  it("removes a completion when asked", async () => {
    const { habits } = await freshApp();
    const id = await habits.createHabit({
      name: "Read",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    const day = addDays(today, -1);

    await habits.setHabitCompletion(id, day, "target");
    await habits.setHabitCompletion(id, day, null);
    expect((await habits.getHabit(id))?.completions).toEqual([]);
  });

  it("refuses days before the habit started and days that have not started", async () => {
    const { habits } = await freshApp();
    const id = await habits.createHabit({
      name: "Read",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    await expect(
      habits.setHabitCompletion(id, addDays(start, -1), "target"),
    ).rejects.toMatchObject({ name: "ValidationError" });
    await expect(
      habits.setHabitCompletion(id, addDays(today, 1), "target"),
    ).rejects.toMatchObject({ name: "ValidationError" });
  });

  it("keeps history when the schedule changes", async () => {
    const { habits } = await freshApp();
    const id = await habits.createHabit({
      name: "Read",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    await habits.setHabitCompletion(id, addDays(today, -1), "target");
    await habits.setHabitCompletion(id, addDays(today, -2), "target");

    await habits.updateHabit(id, {
      name: "Read",
      weekdays: [1],
      startDate: start,
    });
    const habit = await habits.getHabit(id);
    expect(habit?.weekdays).toEqual([1]);
    expect(habit?.completions).toHaveLength(2);
  });

  it("keeps history when a habit is archived and restored", async () => {
    const { habits } = await freshApp();
    const id = await habits.createHabit({
      name: "Read",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    await habits.setHabitCompletion(id, addDays(today, -1), "target");

    await habits.archiveHabit(id);
    expect((await habits.getHabit(id))?.completions).toHaveLength(1);
    await habits.restoreHabit(id);
    expect((await habits.getHabit(id))?.status).toBe("active");
  });

  it("deletes a habit together with its schedule and history, and nothing else", async () => {
    const { db, habits } = await freshApp();
    const keep = await habits.createHabit({
      name: "Keep",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    const drop = await habits.createHabit({
      name: "Drop",
      weekdays: ALL_DAYS,
      startDate: start,
    });
    await habits.setHabitCompletion(keep, addDays(today, -1), "target");
    await habits.setHabitCompletion(drop, addDays(today, -1), "target");

    await habits.deleteHabit(drop);
    expect(await countRows(db, "habits")).toBe(1);
    expect(await countRows(db, "habit_completions")).toBe(1);
    expect(await countRows(db, "habit_schedules")).toBe(7);
  });
});
