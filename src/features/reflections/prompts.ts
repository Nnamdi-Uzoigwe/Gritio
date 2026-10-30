export type ReflectionKey =
  | "wentWell"
  | "struggled"
  | "learned"
  | "improveTomorrow";
export type ReflectionValues = Record<ReflectionKey, string>;

export const REFLECTION_KEYS: ReadonlyArray<ReflectionKey> = [
  "wentWell",
  "struggled",
  "learned",
  "improveTomorrow",
];

export const EMPTY_REFLECTION: ReflectionValues = {
  wentWell: "",
  struggled: "",
  learned: "",
  improveTomorrow: "",
};

export const REFLECTION_PROMPTS: Record<
  ReflectionKey,
  { short: string; today: string; other: string; placeholder: string }
> = {
  wentWell: {
    short: "Went well",
    today: "What went well today?",
    other: "What went well that day?",
    placeholder: "Wins, big or small",
  },
  struggled: {
    short: "Struggled with",
    today: "What did you struggle with?",
    other: "What did you struggle with?",
    placeholder: "No judgement, just notice it",
  },
  learned: {
    short: "Learned",
    today: "What did you learn?",
    other: "What did you learn?",
    placeholder: "Something new, even a small thing",
  },
  improveTomorrow: {
    short: "Improve next",
    today: "What is one thing you want to improve tomorrow?",
    other: "What is one thing you would improve next time?",
    placeholder: "One small, doable thing",
  },
};

/** The first answer that has any text, used as a preview in lists. */
export function firstAnswer(
  values: ReflectionValues,
): { key: ReflectionKey; text: string } | null {
  for (const key of REFLECTION_KEYS) {
    const text = values[key].trim();
    if (text) return { key, text };
  }
  return null;
}
