import {
    addDays,
    daysInMonth,
    describeDate,
    formatLongDate,
    formatShortDate,
    fromDateKey,
    isValidDateKey,
    monthLabel,
    nextMonday,
    startOfWeek,
    toDateKey,
    weekdayOf,
} from "@/lib/dates";
import { getGreeting } from "@/lib/greeting";
import {
    formatRelative,
    formatTime12,
    parseTime,
    toTimeString,
} from "@/lib/time";

describe("date keys", () => {
  it("formats local dates without shifting the day", () => {
    expect(toDateKey(new Date(2026, 10, 7))).toBe("2026-11-07");
    expect(toDateKey(new Date(2026, 10, 7, 23, 59))).toBe("2026-11-07");
  });

  it("round trips to local midnight", () => {
    const d = fromDateKey("2026-11-07");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([
      2026, 10, 7, 0,
    ]);
  });

  it("validates real calendar dates only", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2024-02-29")).toBe(true);
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2026-2-28")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
  });

  it("adds days across month, year and leap boundaries", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("adds days correctly across daylight saving changes", () => {
    // New York: clocks go forward on 8 March 2026 and back on 1 November 2026.
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
  });

  it("knows the weekday", () => {
    expect(weekdayOf("2026-11-07")).toBe(6); // Saturday
    expect(weekdayOf("2026-11-08")).toBe(0); // Sunday
  });

  it("weeks start on Monday", () => {
    expect(startOfWeek("2026-11-07")).toBe("2026-11-02"); // Saturday
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(startOfWeek("2026-11-02")).toBe("2026-11-02"); // Monday
  });

  it("finds the next Monday strictly after a day", () => {
    expect(nextMonday("2026-11-07")).toBe("2026-11-09");
    expect(nextMonday("2026-11-02")).toBe("2026-11-09");
  });

  it("formats readable dates", () => {
    expect(formatLongDate("2026-11-07")).toBe("Saturday, 7 November");
    expect(formatShortDate("2026-11-07")).toBe("Sat, 7 Nov");
    expect(describeDate("2026-11-07", "2026-11-07")).toBe("Today");
    expect(describeDate("2026-11-08", "2026-11-07")).toBe("Tomorrow");
    expect(describeDate("2026-11-10", "2026-11-07")).toBe("Tue, 10 Nov");
    expect(monthLabel(2026, 10)).toBe("November 2026");
  });

  it("counts days in a month", () => {
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(31);
  });
});

describe("times", () => {
  it("parses and builds 24 hour times", () => {
    expect(parseTime("09:05")).toEqual({ hour: 9, minute: 5 });
    expect(toTimeString(7, 0)).toBe("07:00");
    expect(toTimeString(13, 5)).toBe("13:05");
  });

  it("shows 12 hour times", () => {
    expect(formatTime12("00:15")).toBe("12:15 AM");
    expect(formatTime12("09:05")).toBe("9:05 AM");
    expect(formatTime12("12:00")).toBe("12:00 PM");
    expect(formatTime12("13:30")).toBe("1:30 PM");
  });

  it("describes how long ago something was", () => {
    const now = new Date("2026-11-07T12:00:00.000Z");
    expect(formatRelative("2026-11-07T11:59:45.000Z", now)).toBe("Just now");
    expect(formatRelative("2026-11-07T11:55:00.000Z", now)).toBe("5m ago");
    expect(formatRelative("2026-11-07T09:00:00.000Z", now)).toBe("3h ago");
    expect(formatRelative("2026-11-05T12:00:00.000Z", now)).toBe("2d ago");
  });
});

describe("greeting", () => {
  it("follows the time of day and uses the name only when there is one", () => {
    expect(getGreeting("Ada", new Date(2026, 10, 7, 9))).toBe(
      "Good morning, Ada.",
    );
    expect(getGreeting("Ada", new Date(2026, 10, 7, 12))).toBe(
      "Good afternoon, Ada.",
    );
    expect(getGreeting("Ada", new Date(2026, 10, 7, 17))).toBe(
      "Good evening, Ada.",
    );
    expect(getGreeting("  ", new Date(2026, 10, 7, 9))).toBe("Good morning.");
    expect(getGreeting(null, new Date(2026, 10, 7, 9))).toBe("Good morning.");
  });
});
