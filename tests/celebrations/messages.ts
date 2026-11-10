import { messageFor } from "@/features/celebrations/messages";
import { goalLimitMessage, habitLimitMessage, LIMITS } from "@/lib/limits";

const KINDS = ["daily", "goal", "milestone", "streak", "review"] as const;

describe("celebration wording", () => {
  it("never changes for the same event", () => {
    for (const kind of KINDS) {
      expect(messageFor(kind, "ref-1", "Ada", 7)).toEqual(
        messageFor(kind, "ref-1", "Ada", 7),
      );
    }
  });

  it("always has a title and a message, and never leaks a missing value", () => {
    for (const kind of KINDS) {
      for (let i = 0; i < 40; i++) {
        const { title, message } = messageFor(
          kind,
          `ref${i}`,
          i % 2 === 0 ? "Ada" : null,
          7,
        );
        expect(title.length).toBeGreaterThan(0);
        expect(message.length).toBeGreaterThan(0);
        expect(`${title} ${message}`).not.toMatch(/undefined|null|NaN/);
      }
    }
  });

  it("states the streak length in streak titles", () => {
    for (let i = 0; i < 20; i++) {
      expect(
        messageFor("streak", `h:${i}`, null, 30).title.startsWith(
          "30 in a row",
        ),
      ).toBe(true);
    }
  });

  it("uses the name in some variants and never when there is no name", () => {
    const titles = Array.from(
      { length: 40 },
      (_, i) => messageFor("goal", `ref${i}`, "Ada").title,
    );
    expect(titles.some((t) => t.includes("Ada"))).toBe(true);
    const unnamed = Array.from(
      { length: 40 },
      (_, i) => messageFor("goal", `ref${i}`, null).title,
    );
    expect(unnamed.every((t) => !t.includes("Ada"))).toBe(true);
  });
});

describe("limit messages", () => {
  it("explain the limit and the way forward", () => {
    expect(LIMITS).toEqual({ maxActiveHabits: 10, maxActiveGoals: 10 });
    expect(goalLimitMessage).toBe(
      "You've reached your limit of 10 active goals. Archive or complete an existing goal to create another.",
    );
    expect(habitLimitMessage).toBe(
      "You've reached your limit of 10 active habits. Archive or remove an existing habit to create another.",
    );
  });
});
