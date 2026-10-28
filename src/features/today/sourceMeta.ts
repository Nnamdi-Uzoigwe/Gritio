import type { IconName } from "@/lib/focusAreas";
import type { Commitment } from "@/types/today";

export function sourceMeta(item: Commitment): {
  label: string;
  icon: IconName;
} {
  if (item.source === "habit")
    return { label: "Habit", icon: "repeat-outline" };
  if (item.source === "step")
    return { label: item.goalTitle ?? "Goal step", icon: "flag-outline" };
  return { label: item.goalTitle ?? "Task", icon: "checkbox-outline" };
}
