import type { FocusAreaId } from "@/types/domain";
import type { GoalType, PlanMilestone } from "@/types/goals";

export type GoalTemplate = {
  id: string;
  title: string;
  description: string;
  category: FocusAreaId;
  goalType: GoalType;
  completionCriteria: string;
  milestones: PlanMilestone[];
};

/** Bundled with the app so they work fully offline. */
export const GOAL_TEMPLATES: ReadonlyArray<GoalTemplate> = [
  {
    id: "learn-skill",
    title: "Learn a new skill",
    description:
      "Build a skill step by step, from the basics to using it for real.",
    category: "learning",
    goalType: "outcome",
    completionCriteria:
      "I can use the skill on my own to finish something real.",
    milestones: [
      {
        title: "Understand the basics",
        steps: [
          "Pick one clear learning resource",
          "Learn the core concepts",
          "Write notes in my own words",
        ],
      },
      {
        title: "Practice regularly",
        steps: [
          "Set a weekly practice time",
          "Complete three practice exercises",
          "Review what is still unclear",
        ],
      },
      {
        title: "Apply it",
        steps: [
          "Choose a small real project",
          "Build it",
          "Reflect on what I learned",
        ],
      },
    ],
  },
  {
    id: "learn-typescript",
    title: "Learn TypeScript",
    description:
      "Move from the fundamentals to using TypeScript in a real project.",
    category: "learning",
    goalType: "outcome",
    completionCriteria:
      "I have converted a project to TypeScript and can explain my typing choices.",
    milestones: [
      {
        title: "Understand the fundamentals",
        steps: [
          "Learn basic types",
          "Understand interfaces and type aliases",
          "Practice functions and generics",
        ],
      },
      {
        title: "Apply TypeScript in a project",
        steps: [
          "Convert a small project to TypeScript",
          "Fix typing errors",
          "Review the completed implementation",
        ],
      },
    ],
  },
  {
    id: "read-books",
    title: "Read 12 books this year",
    description: "One book a month, with a reading habit that lasts.",
    category: "reading",
    goalType: "outcome",
    completionCriteria: "I have finished 12 books.",
    milestones: [
      {
        title: "Choose the list",
        steps: ["Pick 12 books", "Keep the first three where I can see them"],
      },
      {
        title: "Build the habit",
        steps: ["Read at a fixed time each day", "Finish book one"],
      },
      {
        title: "Keep the pace",
        steps: ["Finish book six", "Finish book twelve"],
      },
    ],
  },
  {
    id: "exercise",
    title: "Exercise consistently for three months",
    description: "Make movement a normal part of the week.",
    category: "health",
    goalType: "routine",
    completionCriteria: "I have exercised regularly for three months.",
    milestones: [
      {
        title: "Get started",
        steps: [
          "Choose activities I enjoy",
          "Schedule three sessions per week",
          "Complete the first full week",
        ],
      },
      {
        title: "Build momentum",
        steps: ["Finish month one", "Finish month two"],
      },
      {
        title: "Make it stick",
        steps: ["Finish month three", "Decide how to continue"],
      },
    ],
  },
  {
    id: "personal-project",
    title: "Complete a personal project",
    description: "Take an idea all the way to something finished.",
    category: "productivity",
    goalType: "project",
    completionCriteria:
      "The project is finished and I have shared or shipped it.",
    milestones: [
      {
        title: "Define it",
        steps: ["Write down what done looks like", "Break it into parts"],
      },
      {
        title: "Build it",
        steps: ["Finish the first working version", "Fix the biggest problems"],
      },
      { title: "Finish it", steps: ["Review the result", "Share or ship it"] },
    ],
  },
  {
    id: "save-money",
    title: "Save a specific amount",
    description: "Set a clear number and a simple plan to reach it.",
    category: "finance",
    goalType: "outcome",
    completionCriteria: "My savings have reached the amount I set.",
    milestones: [
      {
        title: "Set the target",
        steps: [
          "Decide the amount and the date",
          "Work out the monthly amount",
        ],
      },
      {
        title: "Make room",
        steps: ["Review my regular spending", "Set up a regular transfer"],
      },
      {
        title: "Stay on track",
        steps: ["Check progress each month", "Reach the target"],
      },
    ],
  },
  {
    id: "morning-routine",
    title: "Develop a regular morning routine",
    description: "Start each day the same simple way.",
    category: "routines",
    goalType: "routine",
    completionCriteria:
      "I follow my morning routine most days without forcing it.",
    milestones: [
      {
        title: "Design it",
        steps: [
          "Decide the three things I want each morning",
          "Choose a wake up time",
        ],
      },
      {
        title: "Practice",
        steps: ["Follow it for one week", "Adjust what felt hard"],
      },
      {
        title: "Settle in",
        steps: ["Follow it for three weeks", "Keep it going for a month"],
      },
    ],
  },
];

export function templateStepCount(template: GoalTemplate): number {
  return template.milestones.reduce((sum, m) => sum + m.steps.length, 0);
}
