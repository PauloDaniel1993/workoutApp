export type WorkoutChangeReason =
  | "change_exercises"
  | "change_schedule"
  | "increase_difficulty"
  | "decrease_difficulty"
  | "other"

export type RequestStatus = "pending" | "approved" | "rejected"

export interface WorkoutChangeRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  reason: WorkoutChangeReason
  message: string
  status: RequestStatus
  createdAt: string
}
