export type ProgressInput = {
  stepTotal: number;
  stepDone: number;
  bareTotal: number;
  bareDone: number;
};

export type GoalProgress = {
  total: number;
  done: number;
  fraction: number | null; // null when there is nothing to measure yet
  percent: number | null;
  label: string;
};

/**
 * How goal progress works, in one place:
 * every step is one unit, and a milestone with no steps counts as one unit you tick by hand.
 * Progress is completed units out of all units. No units means no percentage at all.
 */
export function computeProgress(input: ProgressInput): GoalProgress {
  const total = input.stepTotal + input.bareTotal;
  const done = input.stepDone + input.bareDone;
  if (total === 0)
    return {
      total: 0,
      done: 0,
      fraction: null,
      percent: null,
      label: "No steps yet",
    };
  const noun =
    input.bareTotal > 0
      ? total === 1
        ? "item"
        : "items"
      : total === 1
        ? "step"
        : "steps";
  const fraction = done / total;
  return {
    total,
    done,
    fraction,
    percent: Math.round(fraction * 100),
    label: `${done} of ${total} ${noun}`,
  };
}
