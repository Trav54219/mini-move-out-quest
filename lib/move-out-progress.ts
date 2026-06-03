export type MoveOutProgress = {
  solEarned: number;
  notes: string;
  completedMilestones: string[];
};

export const emptyMoveOutProgress = (): MoveOutProgress => ({
  solEarned: 0,
  notes: "",
  completedMilestones: [],
});
