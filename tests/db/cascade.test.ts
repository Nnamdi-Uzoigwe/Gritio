import { toDateKey } from "@/lib/dates";
import { countRows, freshApp } from "../helpers/app";

const today = toDateKey();
const plan = {
  milestones: [
    { title: "M1", steps: ["a", "b"] },
    { title: "M2", steps: ["c"] },
  ],
  looseSteps: ["d"],
};

describe("deleting goals and milestones", () => {
  it("creates a goal with its milestones and steps in one go", async () => {
    const { db, goals } = await freshApp();
    await goals.createGoal({ title: "G", startDate: today }, plan);
    expect(await countRows(db, "milestones")).toBe(2);
    expect(await countRows(db, "goal_steps")).toBe(4);
  });

  it("removes a goal with all its milestones and steps, and keeps linked tasks", async () => {
    const { db, goals, tasks } = await freshApp();
    const goalId = await goals.createGoal(
      { title: "G", startDate: today },
      plan,
    );
    const other = await goals.createGoal(
      { title: "Other", startDate: today },
      { milestones: [{ title: "X", steps: ["y"] }], looseSteps: [] },
    );
    const taskId = await tasks.createTask({
      title: "Linked task",
      date: today,
    });
    await db.runAsync(
      "UPDATE tasks SET goal_id = ? WHERE id = ?",
      goalId,
      taskId,
    );

    expect(await goals.getGoalDeleteSummary(goalId)).toEqual({
      milestones: 2,
      steps: 4,
    });
    await goals.deleteGoal(goalId);

    expect(await goals.getGoal(goalId)).toBeNull();
    expect(await goals.getGoal(other)).not.toBeNull();
    expect(await countRows(db, "milestones")).toBe(1); // only the other goal's
    expect(await countRows(db, "goal_steps")).toBe(1);

    const task = await db.getFirstAsync<{ goal_id: string | null }>(
      "SELECT goal_id FROM tasks WHERE id = ?",
      taskId,
    );
    expect(task).not.toBeNull();
    expect(task?.goal_id).toBeNull();
  });

  it("removes a milestone together with its steps only", async () => {
    const { db, goals, steps } = await freshApp();
    const goalId = await goals.createGoal(
      { title: "G", startDate: today },
      plan,
    );
    const view = await steps.getGoalPlan(goalId);

    await steps.deleteMilestone(view.milestones[0].id);
    expect(await countRows(db, "milestones")).toBe(1);
    expect(await countRows(db, "goal_steps")).toBe(2); // 'c' and the loose 'd'
  });

  it("counts goal progress from steps and manual milestone ticks", async () => {
    const { goals, steps } = await freshApp();
    const goalId = await goals.createGoal(
      { title: "G", startDate: today },
      plan,
    );
    const view = await steps.getGoalPlan(goalId);

    await steps.setStepDone(view.milestones[0].steps[0].id, true);
    await steps.setStepDone(view.looseSteps[0].id, true);
    const goal = await goals.getGoal(goalId);
    expect(goal).toMatchObject({ stepTotal: 4, stepDone: 2, bareTotal: 0 });

    const bare = await steps.addMilestone(goalId, "Empty one");
    expect((await goals.getGoal(goalId))?.bareTotal).toBe(1);
    await steps.setMilestoneDone(bare, true);
    expect((await goals.getGoal(goalId))?.bareDone).toBe(1);

    // Giving that milestone its first step turns it into a normal one and clears the manual tick.
    await steps.addStep(goalId, bare, "First step");
    expect(await goals.getGoal(goalId)).toMatchObject({
      bareTotal: 0,
      bareDone: 0,
      stepTotal: 5,
    });
  });
});
