import type { FocusAreaId, GoalStatus } from "@/types/domain";
import type { GoalType } from "@/types/goals";
import { FOCUS_AREAS } from "./focusAreas";

export const FOCUS_AREA_IDS: ReadonlySet<string> = new Set(
  FOCUS_AREAS.map((a) => a.id),
);

export function isFocusAreaId(value: string | null): value is FocusAreaId {
  return value !== null && FOCUS_AREA_IDS.has(value);
}

export const GOAL_TYPE_OPTIONS: ReadonlyArray<{
  id: GoalType;
  label: string;
  hint: string;
}> = [
  { id: "outcome", label: "Outcome", hint: "A result you want to reach." },
  { id: "project", label: "Project", hint: "Something you build or finish." },
  {
    id: "routine",
    label: "Routine",
    hint: "A pattern you want to settle into.",
  },
];

export function isGoalType(value: string | null): value is GoalType {
  return GOAL_TYPE_OPTIONS.some((o) => o.id === value);
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};
