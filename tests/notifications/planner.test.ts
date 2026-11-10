import { NOTIFICATION_CONFIG } from "@/features/notifications/config";
import type {
    PlannerHabit,
    PlannerInput,
} from "@/features/notifications/planner";
import { planNotifications } from "@/features/notifications/planner";
import type { NotificationPrefs } from "@/features/notifications/prefs";

// Saturday 10 October 2026, 08:00 local time.
const now = new Date(2026, 9, 10, 8, 0, 0);

const basePrefs: NotificationPrefs = {
  masterEnabled: true,
  planningEnabled: false,
  planningTime: "07:00",
  reflectionEnabled: false,
  reflectionTime: "21:00",
  habitRemindersEnabled: true,
  taskRemindersEnabled: true,
};

const habit = (
  id: string,
  extra: Partial<PlannerHabit> = {},
): PlannerHabit => ({
  id,
  name: "Read",
  targetLabel: null,
  startDate: "2026-10-01",
  time: "09:00",
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  completedDates: [],
  ...extra,
});

function run(
  overrides: Partial<NotificationPrefs>,
  data: Partial<Pick<PlannerInput, "tasks" | "steps" | "habits">> = {},
) {
  return planNotifications({
    now,
    prefs: { ...basePrefs, ...overrides },
    tasks: [],
    steps: [],
    habits: [],
    ...data,
  });
}

describe("reminder planner", () => {
  it("plans nothing when reminders are switched off", () => {
    const plan = run(
      { masterEnabled: false, planningEnabled: true },
      { habits: [habit("h1")] },
    );
    expect(plan).toEqual([]);
  });

  it("plans the two daily reminders as repeating ones", () => {
    const plan = run({ planningEnabled: true, reflectionEnabled: true });
    expect(plan.map((p) => p.id)).toEqual([
      "gritio:planning:daily",
      "gritio:reflection:daily",
    ]);
    expect(plan[0].repeat).toEqual({ hour: 7, minute: 0 });
    expect(plan[1].repeat).toEqual({ hour: 21, minute: 0 });
    expect(plan[0].title).toBe("Plan your day");
  });

  it("keeps tasks inside the window and skips times that have already passed", () => {
    const task = (id: string, date: string, time: string) => ({
      id,
      title: id.toUpperCase(),
      date,
      time,
    });
    const plan = run(
      {},
      {
        tasks: [
          task("a", "2026-10-10", "09:00"), // later today: kept
          task("b", "2026-10-10", "07:30"), // already passed: skipped
          task("c", "2026-10-11", "09:00"), // tomorrow: kept
          task("d", "2026-10-17", "09:00"), // beyond the 7 day window: skipped
          task("e", "2026-10-16", "23:00"), // last moment of the window: kept
        ],
      },
    );
    expect(plan.map((p) => p.id)).toEqual([
      "gritio:task:a",
      "gritio:task:c",
      "gritio:task:e",
    ]);
  });

  it("skips today for a habit that is already done today", () => {
    const plan = run(
      {},
      { habits: [habit("d", { completedDates: ["2026-10-10"] })] },
    );
    expect(plan).toHaveLength(6);
    expect(plan[0].id).toBe("gritio:habit:d:2026-10-11");
    expect(plan[0].title).toBe("Time for Read");
  });

  it("only plans habits on their scheduled weekdays and after they start", () => {
    expect(
      run({}, { habits: [habit("w", { weekdays: [1] })] }).map((p) => p.id),
    ).toEqual(["gritio:habit:w:2026-10-12"]);
    expect(
      run({}, { habits: [habit("f", { startDate: "2026-10-14" })] }),
    ).toHaveLength(3);
  });

  it("never exceeds the cap, and keeps the soonest reminders", () => {
    const habits = Array.from({ length: 10 }, (_, i) => habit(`h${i}`));
    const plan = run({}, { habits });
    expect(plan).toHaveLength(NOTIFICATION_CONFIG.maxOneOff);
    expect(plan.filter((p) => p.id.endsWith(":2026-10-10"))).toHaveLength(10);
  });

  it("keeps the daily reminders outside the cap", () => {
    const habits = Array.from({ length: 10 }, (_, i) => habit(`h${i}`));
    const plan = run(
      { planningEnabled: true, reflectionEnabled: true },
      { habits },
    );
    expect(plan.filter((p) => p.repeat !== null)).toHaveLength(2);
    expect(plan.filter((p) => p.repeat === null)).toHaveLength(
      NOTIFICATION_CONFIG.maxOneOff,
    );
  });

  it("respects the separate habit and task switches", () => {
    const data = {
      habits: [habit("h1")],
      tasks: [{ id: "a", title: "A", date: "2026-10-10", time: "09:00" }],
    };
    expect(
      run({ habitRemindersEnabled: false }, data).map((p) => p.kind),
    ).toEqual(["task"]);
    expect(
      run({ taskRemindersEnabled: false }, data).every(
        (p) => p.kind === "habit",
      ),
    ).toBe(true);
  });

  it("words step reminders with the goal name", () => {
    const plan = run(
      {},
      {
        steps: [
          {
            id: "s1",
            title: "Practice generics",
            goalTitle: "Learn TypeScript",
            date: "2026-10-10",
            time: "18:00",
          },
        ],
      },
    );
    expect(plan[0]).toMatchObject({
      id: "gritio:step:s1",
      title: "Practice generics",
      body: "From Learn TypeScript",
    });
  });

  it("is stable: the same data always produces the same reminders and wording", () => {
    const data = {
      habits: [habit("h1")],
      tasks: [{ id: "a", title: "A", date: "2026-10-11", time: "09:00" }],
    };
    expect(run({}, data)).toEqual(run({}, data));
  });

  it("uses the target wording for a habit reminder when there is one", () => {
    const plan = run(
      {},
      { habits: [habit("h1", { targetLabel: "Read 20 pages" })] },
    );
    expect(plan[0].body).toBe("Read 20 pages");
  });
});
