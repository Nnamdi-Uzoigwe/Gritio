import { computeProgress } from "@/lib/progress";
import type { GoalListItem } from "@/types/goals";
import { Alert } from "react-native";

/** Completing is always allowed (some goals are judged by you), but we ask when items remain. */
export function confirmComplete(
  goal: GoalListItem,
  onConfirm: () => void,
): void {
  const progress = computeProgress(goal);
  const open = progress.total - progress.done;
  if (open <= 0) {
    onConfirm();
    return;
  }
  Alert.alert(
    "Mark this goal as complete?",
    `${open} ${open === 1 ? "item is" : "items are"} still open. Complete it anyway if the goal is truly met.`,
    [
      { text: "Not yet", style: "cancel" },
      { text: "Mark complete", onPress: onConfirm },
    ],
  );
}
