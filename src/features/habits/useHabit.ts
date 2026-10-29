import { getHabit } from "@/db/repositories/habits";
import type { HabitItem } from "@/types/habits";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** Loads one habit with its schedule and full history. undefined means loading, null means not found. */
export function useHabit(habitId: string) {
  const [habit, setHabit] = useState<HabitItem | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setHabit(await getHabit(habitId));
    } catch (error) {
      console.warn("Could not load habit", error);
      setHabit((prev) => (prev === undefined ? null : prev));
    }
  }, [habitId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { habit, setHabit, load };
}
