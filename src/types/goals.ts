import type { FocusAreaId, GoalStatus } from "./domain";

export type GoalType = "outcome" | "project" | "routine";

export type GoalInput = {
  title: string;
  description?: string | null;
  category?: FocusAreaId | null;
  goalType?: GoalType | null;
  startDate: string;
  targetDate?: string | null;
  completionCriteria?: string | null;
};

export type PlanMilestone = { title: string; steps: string[] };
export type GoalPlan = { milestones: PlanMilestone[]; looseSteps: string[] };

export type GoalListItem = {
  id: string;
  title: string;
  description: string | null;
  category: FocusAreaId | null;
  goalType: GoalType | null;
  status: GoalStatus;
  startDate: string;
  targetDate: string | null;
  completionCriteria: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  milestoneCount: number;
  stepTotal: number;
  stepDone: number;
  bareTotal: number;
  bareDone: number;
};
