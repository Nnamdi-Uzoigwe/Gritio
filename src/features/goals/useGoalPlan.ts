import { getGoal } from "@/db/repositories/goals";
import { getGoalPlan } from "@/db/repositories/steps";
import type { GoalListItem } from "@/types/goals";
import type { GoalPlanView } from "@/types/steps";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

const EMPTY: GoalPlanView = { milestones: [], looseSteps: [] };

/** Loads one goal with its full plan. undefined means loading, null means not found. */
export function useGoalPlan(goalId: string) {
  const [goal, setGoal] = useState<GoalListItem | null | undefined>(undefined);
  const [plan, setPlan] = useState<GoalPlanView>(EMPTY);

  const load = useCallback(async () => {
    try {
      const [g, p] = await Promise.all([getGoal(goalId), getGoalPlan(goalId)]);
      setGoal(g);
      setPlan(p);
    } catch (error) {
      console.warn("Could not load goal", error);
      setGoal((prev) => (prev === undefined ? null : prev));
    }
  }, [goalId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { goal, plan, setPlan, load };
}
