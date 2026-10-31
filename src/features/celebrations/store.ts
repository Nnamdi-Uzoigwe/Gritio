import { create } from "zustand";

export type CelebrationKind =
  | "daily"
  | "goal"
  | "milestone"
  | "streak"
  | "review";

export type CelebrationAction = {
  label: string;
  target:
    | { type: "progress" }
    | { type: "goal"; id: string }
    | { type: "habit"; id: string };
};

export type Celebration = {
  id: string;
  kind: CelebrationKind;
  title: string;
  message: string;
  summary: string | null;
  action: CelebrationAction | null;
};

type CelebrationState = {
  queue: Celebration[];
  enqueue: (celebration: Celebration) => void;
  dismiss: () => void;
};

export const useCelebrationStore = create<CelebrationState>((set) => ({
  queue: [],
  enqueue: (celebration) =>
    set((state) =>
      state.queue.some((c) => c.id === celebration.id)
        ? state
        : { queue: [...state.queue, celebration] },
    ),
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
