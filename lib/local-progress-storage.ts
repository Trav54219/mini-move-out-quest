import { DEFAULT_ACTIVE_TASK_ID } from "@/lib/financial-targets";
import {
  emptyMoveOutProgress,
  type MoveOutProgress,
} from "@/lib/move-out-progress";

const STORAGE_KEY = "move-out-quest-progress";

export function loadLocalProgress(): MoveOutProgress {
  if (typeof window === "undefined") return emptyMoveOutProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMoveOutProgress();
    const parsed = JSON.parse(raw) as Partial<MoveOutProgress>;
    return {
      solEarned: Number(parsed.solEarned) || 0,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      completedMilestones: Array.isArray(parsed.completedMilestones)
        ? parsed.completedMilestones.filter((id) => typeof id === "string")
        : [],
      activeTaskId:
        typeof parsed.activeTaskId === "string"
          ? parsed.activeTaskId
          : DEFAULT_ACTIVE_TASK_ID,
    };
  } catch {
    return emptyMoveOutProgress();
  }
}

export function saveLocalProgress(progress: MoveOutProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
