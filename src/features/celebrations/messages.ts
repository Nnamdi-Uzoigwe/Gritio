import type { CelebrationKind } from "./store";

type Text = { title: string; message: string };
type Variant = (name: string | null, streak: number) => Text;

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++)
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Bundled wording. A variant is chosen by a stable hash of the event, so the same event never changes
 * its words, but different events read differently.
 */
const VARIANTS: Record<CelebrationKind, Variant[]> = {
  daily: [
    (name) => ({
      title: name ? `Well done, ${name}.` : "A full day, done.",
      message: "All today's commitments are complete.",
    }),
    () => ({
      title: "Today's list is clear.",
      message: "You did what you said you would. Enjoy the rest of your day.",
    }),
    () => ({
      title: "Done, all of it.",
      message:
        "Small things, finished one by one. That is how consistency is built.",
    }),
    () => ({
      title: "One step closer.",
      message: "One step closer to the person you're working to become.",
    }),
  ],
  goal: [
    () => ({
      title: "Goal completed!",
      message:
        "You followed through. Take a moment to appreciate the progress you've made.",
    }),
    (name) => ({
      title: name ? `You did it, ${name}.` : "You did it.",
      message:
        "This started as an idea, and you turned it into something finished.",
    }),
    () => ({
      title: "Finished.",
      message: "Every step you took got you here. Well earned.",
    }),
  ],
  milestone: [
    () => ({
      title: "Milestone reached.",
      message: "A real piece of the goal is now behind you.",
    }),
    () => ({
      title: "Another stage complete.",
      message: "You are building momentum, one milestone at a time.",
    }),
    () => ({
      title: "Nicely done.",
      message:
        "That milestone is yours. The next one is closer than it was this morning.",
    }),
  ],
  streak: [
    (_name, streak) => ({
      title: `${streak} in a row.`,
      message: "You keep showing up, and that is exactly how a habit forms.",
    }),
    (_name, streak) => ({
      title: `${streak} in a row.`,
      message: "Quiet, steady consistency. It adds up more than you think.",
    }),
    (name, streak) => ({
      title: name ? `${streak} in a row, ${name}.` : `${streak} in a row.`,
      message: "This is what following through looks like, one day at a time.",
    }),
  ],
  review: [
    () => ({
      title: "Week reviewed.",
      message: "Looking back is how you move forward with purpose.",
    }),
    () => ({
      title: "Review complete.",
      message: "You took time to learn from the week. That counts for a lot.",
    }),
  ],
};

export function messageFor(
  kind: CelebrationKind,
  ref: string,
  name: string | null,
  streak = 0,
): Text {
  const list = VARIANTS[kind];
  return list[hash(ref) % list.length](name, streak);
}
