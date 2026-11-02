import { create } from "zustand";

type LockState = {
  /** False until the saved setting has been read, so content never flashes before the lock decides. */
  loaded: boolean;
  enabled: boolean;
  locked: boolean;
  init: (enabled: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setLocked: (locked: boolean) => void;
};

export const useLockStore = create<LockState>((set) => ({
  loaded: false,
  enabled: false,
  locked: false,
  // A cold start is always locked when App Lock is on.
  init: (enabled) => set({ loaded: true, enabled, locked: enabled }),
  setEnabled: (enabled) =>
    set(enabled ? { enabled } : { enabled, locked: false }),
  setLocked: (locked) => set({ locked }),
}));
