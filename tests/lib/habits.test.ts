import { isScheduledOn, summarizeSchedule } from "@/lib/habitDays";
import { countRecentMisses, nextScheduledDate } from "@/lib/habitRecovery";
import { computeHabitStats, STREAK_MILESTONES } from "@/lib/habitStats";
import { eachDay } from "@/lib/progressStats";

const DAILY = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

// October 2026: the 1st is a Thursday, the 5th a Monday, the 10th a Saturday.
const base = { startDate: "2026-10-01", today: "2026-10-10" };

describe("streaks and consistency", () => {
  it("has nothing to count before anything is done", () => {
    const s = computeHabitStats({
      ...base,
      weekdays: DAILY,
      completionDates: [],
    });
    expect(s).toMatchObject({
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      windowCompleted: 0,
    });
    expect(s.windowScheduled).toBe(9); // nine days have passed, today is not counted until done
  });

  it("keeps a run alive while today is still open", () => {
    const s = computeHabitStats({
      ...base,
      weekdays: DAILY,
      completionDates: eachDay("2026-10-06", "2026-10-09"),
    });
    expect(s).toMatchObject({
      currentStreak: 4,
      bestStreak: 4,
      totalCompletions: 4,
      windowScheduled: 9,
      windowCompleted: 4,
    });
    expect(s.streakMilestoneToday).toBeNull();
  });

  it("counts today once it is done", () => {
    const s = computeHabitStats({
      ...base,
      weekdays: DAILY,
      completionDates: eachDay("2026-10-06", "2026-10-10"),
    });
    expect(s).toMatchObject({
      currentStreak: 5,
      bestStreak: 5,
      windowScheduled: 10,
      windowCompleted: 5,
    });
  });

  it("flags a streak milestone on the day it lands", () => {
    expect(STREAK_MILESTONES).toContain(7);
    const s = computeHabitStats({
      ...base,
      weekdays: DAILY,
      completionDates: eachDay("2026-10-04", "2026-10-10"),
    });
    expect(s.currentStreak).toBe(7);
    expect(s.streakMilestoneToday).toBe(7);
  });

  it("never lets days the habit is not scheduled break a streak", () => {
    const done = [
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ];
    const s = computeHabitStats({
      ...base,
      weekdays: WEEKDAYS,
      completionDates: done,
    });
    expect(s).toMatchObject({
      currentStreak: 7,
      bestStreak: 7,
      totalCompletions: 7,
      windowScheduled: 7,
      windowCompleted: 7,
    });
  });

  it("ends a run at a scheduled day that was not done, but remembers the best run", () => {
    const done = [
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
      "2026-10-06",
      "2026-10-08",
      "2026-10-09",
    ];
    const s = computeHabitStats({
      ...base,
      weekdays: WEEKDAYS,
      completionDates: done,
    });
    expect(s.currentStreak).toBe(2);
    expect(s.bestStreak).toBe(4);
  });

  it("keeps a recent run when earlier days were not done", () => {
    const s = computeHabitStats({
      ...base,
      weekdays: DAILY,
      completionDates: ["2026-10-07", "2026-10-08", "2026-10-09"],
    });
    expect(s).toMatchObject({ currentStreak: 3, bestStreak: 3 });
  });

  it("measures nothing for a habit that has not started yet", () => {
    const s = computeHabitStats({
      weekdays: DAILY,
      startDate: "2026-10-20",
      completionDates: [],
      today: "2026-10-10",
    });
    expect(s).toMatchObject({
      currentStreak: 0,
      bestStreak: 0,
      windowScheduled: 0,
      windowCompleted: 0,
    });
  });

  it("only looks at the last 30 days for consistency", () => {
    const s = computeHabitStats({
      weekdays: DAILY,
      startDate: "2026-08-01",
      completionDates: [],
      today: "2026-10-10",
    });
    expect(s.windowScheduled).toBe(29); // 11 September to 9 October
  });
});

describe("schedules", () => {
  it("summarizes schedules in plain words", () => {
    expect(summarizeSchedule(DAILY)).toBe("Every day");
    expect(summarizeSchedule(WEEKDAYS)).toBe("Weekdays");
    expect(summarizeSchedule([6, 0])).toBe("Weekends");
    expect(summarizeSchedule([1, 3, 5])).toBe("Mon, Wed, Fri");
    expect(summarizeSchedule([0, 2])).toBe("Tue, Sun");
  });

  it("schedules from the start date on the chosen weekdays", () => {
    const monday = { weekdays: [1], startDate: "2026-11-02" };
    expect(isScheduledOn(monday, "2026-11-02")).toBe(true);
    expect(isScheduledOn(monday, "2026-11-09")).toBe(true);
    expect(isScheduledOn(monday, "2026-10-26")).toBe(false); // before it started
    expect(isScheduledOn(monday, "2026-11-03")).toBe(false); // wrong weekday
  });
});

describe("recovery helpers", () => {
  it("counts scheduled days without a completion in the last week", () => {
    const habit = { weekdays: DAILY, startDate: "2026-10-01" };
    expect(
      countRecentMisses(habit, ["2026-10-09", "2026-10-07"], "2026-10-10"),
    ).toBe(5);
  });

  it("finds the next scheduled day", () => {
    const monday = { weekdays: [1], startDate: "2026-10-01" };
    expect(nextScheduledDate(monday, "2026-11-07")).toBe("2026-11-09");
    expect(nextScheduledDate(monday, "2026-11-09", true)).toBe("2026-11-09");
    expect(nextScheduledDate(monday, "2026-11-09", false)).toBe("2026-11-16");
  });
});
