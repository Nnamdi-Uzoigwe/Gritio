import { countUnread } from "@/db/repositories/inbox";
import { getSetting } from "@/db/repositories/settings";
import { countOverdueTasks, deleteTask } from "@/db/repositories/tasks";
import {
  getTodayCommitments,
  rescheduleCommitment,
  setCommitmentDone,
} from "@/db/repositories/today";
import { toDateKey } from "@/lib/dates";
import type { HabitLevel } from "@/types/domain";
import type { Commitment } from "@/types/today";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";

type Status = "loading" | "ready" | "error";

export function useToday() {
  const [date, setDate] = useState(() => toDateKey());
  const [name, setName] = useState<string | null>(null);
  const [items, setItems] = useState<Commitment[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const dateRef = useRef(date);

  const load = useCallback(async () => {
    const today = toDateKey();
    try {
      const [list, overdue, unreadCount, userName] = await Promise.all([
        getTodayCommitments(today),
        countOverdueTasks(today),
        countUnread(),
        getSetting("user_name"),
      ]);
      dateRef.current = today;
      setDate(today);
      setItems(list);
      setOverdueCount(overdue);
      setUnread(unreadCount);
      setName(userName);
      setStatus("ready");
    } catch (error) {
      console.warn("Could not load today", error);
      setStatus((prev) => (prev === "ready" ? prev : "error"));
    }
  }, []);

  // Reload whenever the tab is focused, and when the app returns to the foreground (day may have changed).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") load();
    });
    return () => sub.remove();
  }, [load]);

  const toggle = useCallback(async (item: Commitment, level?: HabitLevel) => {
    const next = !item.done;
    const nextLevel: HabitLevel | null =
      next && item.source === "habit" ? (level ?? "target") : null;
    setItems((prev) =>
      prev.map((i) =>
        i.key === item.key ? { ...i, done: next, doneLevel: nextLevel } : i,
      ),
    );
    try {
      await setCommitmentDone(item, dateRef.current, next, level);
    } catch (error) {
      console.warn("Could not update commitment", error);
      setItems((prev) =>
        prev.map((i) =>
          i.key === item.key
            ? { ...i, done: item.done, doneLevel: item.doneLevel }
            : i,
        ),
      );
      Alert.alert(
        "Could not update",
        "Something went wrong. Please try again.",
      );
    }
  }, []);

  const reschedule = useCallback(
    async (item: Commitment, newDate: string) => {
      try {
        await rescheduleCommitment(item, newDate);
        await load();
      } catch (error) {
        console.warn("Could not reschedule", error);
        Alert.alert(
          "Could not move it",
          "Something went wrong. Please try again.",
        );
      }
    },
    [load],
  );

  const removeTask = useCallback(
    async (id: string) => {
      try {
        await deleteTask(id);
        await load();
      } catch (error) {
        console.warn("Could not delete task", error);
        Alert.alert(
          "Could not delete",
          "Something went wrong. Please try again.",
        );
      }
    },
    [load],
  );

  return {
    date,
    name,
    items,
    overdueCount,
    unread,
    status,
    reload: load,
    toggle,
    reschedule,
    removeTask,
  };
}
