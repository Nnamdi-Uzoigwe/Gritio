import { computeProgress } from "@/lib/progress";
import {
    computeDayStats,
    describePeriod,
    eachDay,
    habitRates,
    periodFor,
    shiftPeriod,
    summarize,
    trendPoints,
    type RawHabit,
} from "@/lib/progressStats";

describe("goal progress", () => {
  it("counts every step as one", () => {
    const p = computeProgress({
      stepTotal: 9,
      stepDone: 4,
      bareTotal: 0,
      bareDone: 0,
    });
    expect(p).toMatchObject({
      total: 9,
      done: 4,
      percent: 44,
      label: "4 of 9 steps",
    });
  });

  it("shows no percentage until there is something to measure", () => {
    const p = computeProgress({
      stepTotal: 0,
      stepDone: 0,
      bareTotal: 0,
      bareDone: 0,
    });
    expect(p).toMatchObject({
      total: 0,
      fraction: null,
      percent: null,
      label: "No steps yet",
    });
  });

  it("counts a milestone with no steps as one item you tick yourself", () => {
    const p = computeProgress({
      stepTotal: 3,
      stepDone: 3,
      bareTotal: 1,
      bareDone: 0,
    });
    expect(p).toMatchObject({
      total: 4,
      done: 3,
      percent: 75,
      label: "3 of 4 items",
    });
  });

  it("uses singular wording for one step", () => {
    expect(
      computeProgress({ stepTotal: 1, stepDone: 0, bareTotal: 0, bareDone: 0 })
        .label,
    ).toBe("0 of 1 step");
  });
});

// Week of Monday 5 October 2026, "today" is Saturday the 10th.
const today = "2026-10-10";
const habit: RawHabit = {
  id: "h1",
  name: "Read",
  status: "active",
  startDate: "2026-10-01",
  archivedDate: null,
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  completionDates: ["2026-10-05", "2026-10-06"],
};
const tasks = [
  { id: "t1", title: "a", date: "2026-10-05", done: true, postponedCount: 0 },
  { id: "t2", title: "b", date: "2026-10-05", done: false, postponedCount: 1 },
  { id: "t3", title: "c", date: "2026-10-10", done: true, postponedCount: 0 },
  { id: "t4", title: "d", date: "2026-10-10", done: false, postponedCount: 0 },
  { id: "t5", title: "e", date: "2026-10-10", done: false, postponedCount: 0 },
  { id: "t6", title: "f", date: "2026-10-11", done: false, postponedCount: 0 },
];
const steps = [
  {
    id: "s1",
    title: "step",
    goalId: "g1",
    scheduledDate: "2026-10-06",
    done: true,
  },
];

describe("day statistics", () => {
  const days = computeDayStats({
    from: "2026-10-05",
    to: "2026-10-11",
    today,
    tasks,
    habits: [habit],
    steps,
  });

  it("covers every day of the period", () => {
    expect(eachDay("2026-10-05", "2026-10-11")).toHaveLength(7);
    expect(days.map((d) => d.date)[0]).toBe("2026-10-05");
    expect(days).toHaveLength(7);
  });

  it("combines tasks, habits and goal steps per day", () => {
    const by = Object.fromEntries(days.map((d) => [d.date, d]));
    expect(by["2026-10-05"]).toMatchObject({ total: 3, done: 2 });
    expect(by["2026-10-06"]).toMatchObject({ total: 2, done: 2 });
    expect(by["2026-10-07"]).toMatchObject({ total: 1, done: 0 });
    expect(by["2026-10-10"]).toMatchObject({ total: 4, done: 1 });
  });

  it("does not measure days that have not happened", () => {
    expect(days[6]).toMatchObject({
      date: "2026-10-11",
      isFuture: true,
      total: 0,
      done: 0,
    });
  });

  it("never lets an unfinished today lower the numbers", () => {
    const s = summarize(days, today);
    // Past days: 8 commitments, 4 done. Today only counts the 1 thing already finished.
    expect(s).toMatchObject({ total: 9, done: 5, percent: 56 });
  });

  it("reports a trend only when both periods have data", () => {
    const current = summarize(days, today);
    const earlier = { total: 10, done: 4, fraction: 0.4, percent: 40 };
    expect(trendPoints(current, earlier)).toBe(16);
    expect(
      trendPoints(current, {
        total: 0,
        done: 0,
        fraction: null,
        percent: null,
      }),
    ).toBeNull();
  });
});

describe("habit rates", () => {
  it("counts passed scheduled days, and today only once done", () => {
    const [rate] = habitRates([habit], "2026-10-05", "2026-10-11", today);
    expect(rate).toMatchObject({ id: "h1", scheduled: 5, completed: 2 });
  });

  it("stops counting an archived habit from the day it was archived", () => {
    const [rate] = habitRates(
      [{ ...habit, status: "archived", archivedDate: "2026-10-08" }],
      "2026-10-05",
      "2026-10-11",
      today,
    );
    expect(rate).toMatchObject({ archived: true, scheduled: 3, completed: 2 });
  });
});

describe("periods", () => {
  it("builds weeks Monday to Sunday and whole months", () => {
    expect(periodFor("week", "2026-10-08")).toMatchObject({
      from: "2026-10-05",
      to: "2026-10-11",
    });
    expect(periodFor("month", "2026-10-08")).toMatchObject({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("moves between periods, including across a year", () => {
    expect(shiftPeriod(periodFor("week", "2026-10-08"), -1)).toMatchObject({
      from: "2026-09-28",
      to: "2026-10-04",
    });
    expect(shiftPeriod(periodFor("month", "2026-01-15"), -1)).toMatchObject({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("labels the current period", () => {
    const info = describePeriod(periodFor("week", "2026-10-08"), "2026-10-08");
    expect(info).toMatchObject({ label: "This week", isCurrent: true });
  });
});
