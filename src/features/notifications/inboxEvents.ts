const listeners = new Set<() => void>();

/** Lets screens refresh when new reminders land in the notification center. */
export function onInboxChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitInboxChanged(): void {
  listeners.forEach((listener) => listener());
}
