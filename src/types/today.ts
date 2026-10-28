import type { HabitLevel } from "./domain";

export type CommitmentSource = "task" | "habit" | "step";

export type HabitLevels = { minimum: string | null; target: string | null };

/** One row on the Today screen, regardless of which table it came from. */
export type Commitment = {
  key: string; // `${source}:${id}`, unique across sources
  source: CommitmentSource;
  id: string;
  title: string;
  description: string | null;
  time: string | null; // "HH:mm"
  done: boolean;
  goalTitle: string | null;
  /** Habits only: the optional minimum and target versions. */
  levels: HabitLevels | null;
  /** Habits only: which version was completed. */
  doneLevel: HabitLevel | null;
};
