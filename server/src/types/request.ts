export type WorkoutChangeReason =
  | "change_exercises"
  | "change_schedule"
  | "increase_difficulty"
  | "decrease_difficulty"
  | "other"

export interface WorkoutChangeRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  reason: WorkoutChangeReason
  message: string
  createdAt: string
}
