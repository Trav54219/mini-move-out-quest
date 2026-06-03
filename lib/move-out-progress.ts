import { DEFAULT_ACTIVE_TASK_ID } from "@/lib/financial-targets";

export type MoveOutProgress = {
  solEarned: number;
  notes: string;
  completedMilestones: string[];
  /** Line-item id you are actively working toward. */
  activeTaskId: string;
};

export const emptyMoveOutProgress = (): MoveOutProgress => ({
  solEarned: 0,
  notes: "",
  completedMilestones: [],
  activeTaskId: DEFAULT_ACTIVE_TASK_ID,
});
