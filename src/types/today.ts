export type CommitmentSource = "task" | "habit" | "step";

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
};
