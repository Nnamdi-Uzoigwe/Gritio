export type StepItem = {
  id: string;
  goalId: string;
  milestoneId: string | null;
  title: string;
  notes: string | null;
  dueDate: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  position: number;
  completedAt: string | null;
};

export type MilestoneItem = {
  id: string;
  goalId: string;
  title: string;
  position: number;
  completedAt: string | null;
  steps: StepItem[];
};

export type GoalPlanView = {
  milestones: MilestoneItem[];
  looseSteps: StepItem[];
};

export type StepInput = {
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
};
