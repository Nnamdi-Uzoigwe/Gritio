import type { FocusAreaId } from "@/types/domain";
import { create } from "zustand";

export type NotificationAnswer = "granted" | "denied" | "skipped" | null;
export type TimeField = "wakeTime" | "planningTime" | "reflectionTime";
export type ReminderField = "planningReminder" | "reflectionReminder";

export type OnboardingAnswers = {
  name: string;
  focusAreas: FocusAreaId[];
  wakeTime: string;
  planningTime: string;
  reflectionTime: string;
  planningReminder: boolean;
  reflectionReminder: boolean;
};

type OnboardingState = OnboardingAnswers & {
  notificationAnswer: NotificationAnswer;
  setName: (name: string) => void;
  toggleFocusArea: (id: FocusAreaId) => void;
  clearFocusAreas: () => void;
  setTime: (field: TimeField, value: string) => void;
  setReminder: (field: ReminderField, value: boolean) => void;
  setNotificationAnswer: (answer: NotificationAnswer) => void;
  reset: () => void;
};

const initial: OnboardingAnswers & { notificationAnswer: NotificationAnswer } =
  {
    name: "",
    focusAreas: [],
    wakeTime: "06:30",
    planningTime: "07:00",
    reflectionTime: "21:00",
    planningReminder: false,
    reflectionReminder: false,
    notificationAnswer: null,
  };

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initial,
  setName: (name) => set({ name }),
  toggleFocusArea: (id) =>
    set((s) => ({
      focusAreas: s.focusAreas.includes(id)
        ? s.focusAreas.filter((x) => x !== id)
        : [...s.focusAreas, id],
    })),
  clearFocusAreas: () => set({ focusAreas: [] }),
  setTime: (field, value) =>
    set({ [field]: value } as Pick<OnboardingState, TimeField>),
  setReminder: (field, value) =>
    set({ [field]: value } as Pick<OnboardingState, ReminderField>),
  setNotificationAnswer: (notificationAnswer) => set({ notificationAnswer }),
  reset: () => set({ ...initial }),
}));
