export type NotificationText = { title: string; body: string };

/** Bundled, calm wording. Never guilt. Variants are picked deterministically so a reminder's text never churns. */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++)
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(list: readonly T[], seed: string): T {
  return list[hash(seed) % list.length];
}

const HABIT_BODIES = [
  "A small step counts.",
  "Whenever you are ready.",
  "Showing up is the habit.",
  "Keep it simple today.",
];
const TASK_BODIES = [
  "Your reminder is here.",
  "A good moment to get it done.",
  "Ready when you are.",
];

export function planningContent(): NotificationText {
  return {
    title: "Plan your day",
    body: "Two minutes now saves an hour later.",
  };
}

export function reflectionContent(): NotificationText {
  return { title: "Evening reflection", body: "What went well today?" };
}

export function habitContent(
  id: string,
  name: string,
  targetLabel: string | null,
): NotificationText {
  return {
    title: `Time for ${name}`,
    body: targetLabel ?? pick(HABIT_BODIES, id),
  };
}

export function taskContent(id: string, title: string): NotificationText {
  return { title, body: pick(TASK_BODIES, id) };
}

export function stepContent(
  title: string,
  goalTitle: string,
): NotificationText {
  return { title, body: `From ${goalTitle}` };
}
