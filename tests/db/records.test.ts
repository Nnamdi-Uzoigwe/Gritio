import { addDays, startOfWeek, toDateKey } from "@/lib/dates";
import { freshApp } from "../helpers/app";

const today = toDateKey();
const blank = { wentWell: "", struggled: "", learned: "", improveTomorrow: "" };

describe("weekly reviews", () => {
  it("only accepts weeks that start on a Monday and have already started", async () => {
    const { reviews } = await freshApp();
    const thisWeek = startOfWeek(today);
    await expect(
      reviews.saveReview(addDays(thisWeek, 1), { notes: "", priorities: [] }),
    ).rejects.toMatchObject({
      name: "ValidationError",
    });
    await expect(
      reviews.saveReview(addDays(thisWeek, 7), { notes: "", priorities: [] }),
    ).rejects.toMatchObject({
      name: "ValidationError",
    });
  });

  it("keeps the first completion time when a review is edited, and limits priorities to three", async () => {
    const { reviews } = await freshApp();
    const week = startOfWeek(today);

    await reviews.saveReview(week, {
      notes: "First",
      priorities: ["a", "b", "c", "d", "e"],
    });
    const first = await reviews.getReview(week);
    expect(first?.priorities).toEqual(["a", "b", "c"]);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await reviews.saveReview(week, { notes: "Second", priorities: [] });
    const second = await reviews.getReview(week);
    expect(second?.notes).toBe("Second");
    expect(second?.priorities).toEqual([]);
    expect(second?.completedAt).toBe(first?.completedAt);
  });
});

describe("reflections", () => {
  it("saves, edits and removes a day, and never stores an empty entry", async () => {
    const { reflections } = await freshApp();
    const day = addDays(today, -1);

    expect(
      await reflections.saveReflection(day, { ...blank, wentWell: "Good" }),
    ).toBe("saved");
    expect((await reflections.getReflection(day))?.values.wentWell).toBe(
      "Good",
    );

    expect(await reflections.saveReflection(day, blank)).toBe("removed");
    expect(await reflections.getReflection(day)).toBeNull();
    expect(await reflections.saveReflection(day, blank)).toBe("removed"); // nothing to remove is fine
  });

  it("refuses days that have not started", async () => {
    const { reflections } = await freshApp();
    await expect(
      reflections.saveReflection(addDays(today, 1), {
        ...blank,
        wentWell: "x",
      }),
    ).rejects.toMatchObject({
      name: "ValidationError",
    });
  });
});

describe("tasks", () => {
  it("requires a title and a time for a reminder", async () => {
    const { tasks } = await freshApp();
    await expect(
      tasks.createTask({ title: "  ", date: today }),
    ).rejects.toMatchObject({ name: "ValidationError" });
    await expect(
      tasks.createTask({ title: "T", date: today, reminder: true }),
    ).rejects.toMatchObject({
      name: "ValidationError",
    });
    await expect(
      tasks.createTask({
        title: "T",
        date: today,
        time: "09:00",
        reminder: true,
      }),
    ).resolves.toEqual(expect.any(String));
  });

  it("counts a postponement, and moving overdue tasks does not count as one", async () => {
    const { db, tasks } = await freshApp();
    const id = await tasks.createTask({ title: "T", date: today });
    await tasks.postponeTask(id, addDays(today, 1));
    const row = await db.getFirstAsync<{
      postponed_count: number;
      date: string;
    }>("SELECT postponed_count, date FROM tasks WHERE id = ?", id);
    expect(row).toEqual({ postponed_count: 1, date: addDays(today, 1) });

    await tasks.moveTasksToDate([id], today);
    const after = await db.getFirstAsync<{
      postponed_count: number;
      date: string;
    }>("SELECT postponed_count, date FROM tasks WHERE id = ?", id);
    expect(after).toEqual({ postponed_count: 1, date: today });
  });
});
