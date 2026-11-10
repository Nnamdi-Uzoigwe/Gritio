import { getDb } from "@/db/client";
import { createGoal } from "@/db/repositories/goals";
import { createHabit, setHabitCompletion } from "@/db/repositories/habits";
import { saveReflection } from "@/db/repositories/reflections";
import { addRule } from "@/db/repositories/rules";
import { getSetting, setSetting } from "@/db/repositories/settings";
import {
    getGoalPlan,
    scheduleStep,
    setStepDone,
} from "@/db/repositories/steps";
import { createTask, setTaskDone } from "@/db/repositories/tasks";
import { requestReconcile } from "@/features/notifications/service";
import { addDays, toDateKey, weekdayOf } from "@/lib/dates";

/**
 * Development only. Fills the app with a realistic sample, for testing and for store screenshots.
 * It refuses to run on top of real data, so demo data never mixes with anything real.
 */
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const REFLECTIONS = [
  {
    wentWell: "Finished the hardest task before noon.",
    struggled: "My phone pulled me away after lunch.",
    learned: "Starting small makes starting easier.",
    improveTomorrow: "Plan the first task tonight.",
  },
  {
    wentWell: "Kept my reading going even on a busy day.",
    struggled: "",
    learned: "Two pages still count.",
    improveTomorrow: "Go to bed a little earlier.",
  },
  {
    wentWell: "A good workout and a clear head afterwards.",
    struggled: "Skipped planning in the morning.",
    learned: "",
    improveTomorrow: "",
  },
];

export async function loadDemoData(): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ c: number }>(
    "SELECT (SELECT COUNT(*) FROM goals) + (SELECT COUNT(*) FROM habits) + (SELECT COUNT(*) FROM tasks) AS c",
  );
  if ((existing?.c ?? 0) > 0)
    throw new Error(
      "Erase everything first, so demo data never mixes with real data.",
    );

  const today = toDateKey();
  const previousCelebrations = await getSetting("celebrations_enabled");
  // Loading demo data must never pop celebrations.
  await setSetting("celebrations_enabled", "0");

  try {
    if (!(await getSetting("user_name"))) await setSetting("user_name", "Ada");

    const typescript = await createGoal(
      {
        title: "Learn TypeScript",
        description: "Move from the basics to using it in a real project.",
        category: "learning",
        goalType: "outcome",
        startDate: addDays(today, -21),
        targetDate: addDays(today, 40),
        completionCriteria: "I have converted a project to TypeScript.",
      },
      {
        milestones: [
          {
            title: "Understand the fundamentals",
            steps: [
              "Learn basic types",
              "Understand interfaces and type aliases",
              "Practice functions and generics",
            ],
          },
          {
            title: "Apply TypeScript in a project",
            steps: [
              "Convert a small project",
              "Fix typing errors",
              "Review the result",
            ],
          },
        ],
        looseSteps: [],
      },
    );
    const books = await createGoal(
      {
        title: "Read 12 books this year",
        category: "reading",
        goalType: "outcome",
        startDate: addDays(today, -60),
        targetDate: `${today.slice(0, 4)}-12-31`,
      },
      {
        milestones: [
          {
            title: "Choose the list",
            steps: [
              "Pick 12 books",
              "Keep the first three where I can see them",
            ],
          },
          {
            title: "Build the habit",
            steps: ["Read at a fixed time each day", "Finish book one"],
          },
        ],
        looseSteps: [],
      },
    );
    await createGoal(
      {
        title: "Exercise consistently for three months",
        category: "health",
        goalType: "routine",
        startDate: addDays(today, -10),
        targetDate: addDays(today, 80),
      },
      {
        milestones: [
          {
            title: "Get started",
            steps: [
              "Choose activities I enjoy",
              "Schedule three sessions per week",
            ],
          },
        ],
        looseSteps: [],
      },
    );

    const tsPlan = await getGoalPlan(typescript);
    await setStepDone(tsPlan.milestones[0].steps[0].id, true);
    await setStepDone(tsPlan.milestones[0].steps[1].id, true);
    await scheduleStep(tsPlan.milestones[0].steps[2].id, today);
    const bookPlan = await getGoalPlan(books);
    await setStepDone(bookPlan.milestones[0].steps[0].id, true);

    const start = addDays(today, -30);
    const habits = [
      await createHabit({
        name: "Read for 20 minutes",
        weekdays: ALL_DAYS,
        startDate: start,
        category: "reading",
        targetLabel: "Read 20 pages",
        minimumLabel: "Read 2 pages",
        timeOfDay: "20:30",
      }),
      await createHabit({
        name: "Exercise",
        weekdays: [1, 3, 5, 6],
        startDate: start,
        category: "health",
      }),
      await createHabit({
        name: "Drink water",
        weekdays: ALL_DAYS,
        startDate: start,
      }),
      await createHabit({
        name: "Plan tomorrow",
        weekdays: [1, 2, 3, 4, 5],
        startDate: start,
        category: "productivity",
        timeOfDay: "21:00",
      }),
    ];
    const weekdays = [ALL_DAYS, [1, 3, 5, 6], ALL_DAYS, [1, 2, 3, 4, 5]];

    for (let h = 0; h < habits.length; h++) {
      for (let ago = 1; ago <= 30; ago++) {
        const date = addDays(today, -ago);
        if (!weekdays[h].includes(weekdayOf(date))) continue;
        if ((ago * 7 + h * 3) % 10 >= 8) continue; // about eight days in ten
        await setHabitCompletion(
          habits[h],
          date,
          h === 0 && ago % 5 === 0 ? "minimum" : "target",
        );
      }
    }
    await setHabitCompletion(habits[2], today, "target");

    await createTask({ title: "Send the invoice", date: today, time: "10:00" });
    const bank = await createTask({ title: "Call the bank", date: today });
    await createTask({ title: "Buy groceries", date: today, time: "17:30" });
    await createTask({ title: "Prepare slides", date: addDays(today, 1) });
    await setTaskDone(bank, true);

    for (let ago = 1; ago <= 4; ago++) {
      await saveReflection(
        addDays(today, -ago),
        REFLECTIONS[(ago - 1) % REFLECTIONS.length],
      );
    }

    await addRule("Plan tomorrow before going to bed");
    await addRule("Read every day, even if only for a few minutes");
    requestReconcile();
  } finally {
    // Wait past the debounced celebration check, then put the setting back.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await setSetting("celebrations_enabled", previousCelebrations ?? "1");
  }
}

/** Development only. Deletes every record and setting on this phone. */
export async function eraseEverything(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const table of [
      "habit_completions",
      "habit_schedules",
      "tasks",
      "goal_steps",
      "milestones",
      "goals",
      "habits",
      "reflections",
      "weekly_reviews",
      "personal_rules",
      "celebrations",
      "focus_areas",
      "scheduled_notifications",
      "inbox_notifications",
      "settings",
    ]) {
      await db.runAsync(`DELETE FROM ${table}`);
    }
  });
  requestReconcile();
}
