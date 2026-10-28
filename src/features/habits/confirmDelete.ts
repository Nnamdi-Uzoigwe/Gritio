import { getHabitDeleteSummary } from "@/db/repositories/habits";
import { Alert } from "react-native";

type Options = {
  canArchive: boolean;
  onArchive: () => void;
  onDelete: () => void;
};

/** Says exactly what will be lost, and offers Archive as the gentler option. */
export async function confirmDeleteHabit(
  habitId: string,
  options: Options,
): Promise<void> {
  let completions = 0;
  try {
    completions = (await getHabitDeleteSummary(habitId)).completions;
  } catch (error) {
    console.warn("Could not read habit history", error);
  }
  const detail =
    completions > 0
      ? ` This also deletes ${completions} recorded ${completions === 1 ? "completion" : "completions"}.`
      : "";

  Alert.alert("Delete this habit?", `This cannot be undone.${detail}`, [
    { text: "Cancel", style: "cancel" },
    ...(options.canArchive
      ? [{ text: "Archive instead", onPress: options.onArchive }]
      : []),
    {
      text: "Delete",
      style: "destructive" as const,
      onPress: options.onDelete,
    },
  ]);
}
