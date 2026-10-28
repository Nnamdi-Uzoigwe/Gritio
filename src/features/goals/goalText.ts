import { formatShortDate, toDateKey } from "@/lib/dates";
import { describeTarget } from "@/lib/goalDates";
import type { GoalListItem } from "@/types/goals";

export function goalTiming(goal: GoalListItem, today: string): string {
  if (goal.status === "completed" && goal.completedAt) {
    return `Completed ${formatShortDate(toDateKey(new Date(goal.completedAt)))}`;
  }
  if (goal.status === "archived") return "Archived";
  return describeTarget(goal.targetDate, today);
}
