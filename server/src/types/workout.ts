export type WorkoutStatus = "completed" | "missed" | "upcoming" | "today"

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  youtubeUrl: string
  completed: boolean
}

export interface StoredWorkout {
  id: string
  userEmail: string
  date: string
  name: string
  exercises: Exercise[]
}

export interface Workout extends Omit<StoredWorkout, "userEmail"> {
  userId: string
  status: WorkoutStatus
}
