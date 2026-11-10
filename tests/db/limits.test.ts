import { toDateKey } from "@/lib/dates";
import { freshApp } from "../helpers/app";

const today = toDateKey();
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const goalInput = (n: number) => ({ title: `Goal ${n}`, startDate: today });
const habitInput = (n: number) => ({
  name: `Habit ${n}`,
  weekdays: ALL_DAYS,
  startDate: today,
});

describe("active goal limit", () => {
  it("allows 10 active goals and refuses the 11th with a clear message", async () => {
    const { goals } = await freshApp();
    for (let i = 1; i <= 10; i++) await goals.createGoal(goalInput(i));
    await expect(goals.createGoal(goalInput(11))).rejects.toMatchObject({
      name: "LimitError",
      message: expect.stringContaining("10 active goals"),
    });
    expect(await goals.countActiveGoals()).toBe(10);
  });

  it("holds even when many goals are created at the same instant", async () => {
    const { goals } = await freshApp();
    const results = await Promise.allSettled(
      Array.from({ length: 15 }, (_, i) => goals.createGoal(goalInput(i))),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(5);
    expect(await goals.countActiveGoals()).toBe(10);
  });

  it("does not count archived or completed goals", async () => {
    const { goals } = await freshApp();
    const ids: string[] = [];
    for (let i = 1; i <= 10; i++)
      ids.push(await goals.createGoal(goalInput(i)));
    await goals.archiveGoal(ids[0]);
    await goals.completeGoal(ids[1]);
    expect(await goals.countActiveGoals()).toBe(8);

    await goals.createGoal(goalInput(11));
    await goals.createGoal(goalInput(12));
    expect(await goals.countActiveGoals()).toBe(10);
    expect(await goals.listGoals("archived")).toHaveLength(1);
    expect(await goals.listGoals("completed")).toHaveLength(1);
  });

  it("refuses to restore or reopen a goal when the limit is full", async () => {
    const { goals } = await freshApp();
    const ids: string[] = [];
    for (let i = 1; i <= 10; i++)
      ids.push(await goals.createGoal(goalInput(i)));

    await goals.archiveGoal(ids[0]);
    await goals.completeGoal(ids[1]);
    await goals.createGoal(goalInput(11));
    await goals.createGoal(goalInput(12));
    expect(await goals.countActiveGoals()).toBe(10);

    await expect(goals.restoreGoal(ids[0])).rejects.toMatchObject({
      name: "LimitError",
    });
    await expect(goals.reopenGoal(ids[1])).rejects.toMatchObject({
      name: "LimitError",
    });
    expect((await goals.getGoal(ids[0]))?.status).toBe("archived");
    expect((await goals.getGoal(ids[1]))?.status).toBe("completed");
  });
});

describe("active habit limit", () => {
  it("allows 10 active habits and refuses the 11th", async () => {
    const { habits } = await freshApp();
    for (let i = 1; i <= 10; i++) await habits.createHabit(habitInput(i));
    await expect(habits.createHabit(habitInput(11))).rejects.toMatchObject({
      name: "LimitError",
      message: expect.stringContaining("10 active habits"),
    });
    expect(await habits.countActiveHabits()).toBe(10);
  });

  it("holds under simultaneous creation", async () => {
    const { habits } = await freshApp();
    const results = await Promise.allSettled(
      Array.from({ length: 15 }, (_, i) => habits.createHabit(habitInput(i))),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    expect(await habits.countActiveHabits()).toBe(10);
  });

  it("does not count archived habits, and a full limit blocks restoring one", async () => {
    const { habits } = await freshApp();
    const ids: string[] = [];
    for (let i = 1; i <= 10; i++)
      ids.push(await habits.createHabit(habitInput(i)));

    await habits.archiveHabit(ids[0]);
    expect(await habits.countActiveHabits()).toBe(9);
    await habits.createHabit(habitInput(11));
    expect(await habits.countActiveHabits()).toBe(10);

    await expect(habits.restoreHabit(ids[0])).rejects.toMatchObject({
      name: "LimitError",
    });
    expect((await habits.getHabit(ids[0]))?.status).toBe("archived");
  });
});
