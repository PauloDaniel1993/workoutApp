import { apiFetch } from "@/lib/api"
import type { AdminUser, WorkoutChangeRequest } from "@/lib/users"
import type { Workout } from "@/lib/workouts"

export interface ExerciseInput {
  id?: string
  name: string
  sets: number
  reps: number
  weight: number
  youtubeUrl: string
}

export async function fetchAssignedUsers(): Promise<AdminUser[]> {
  const data = await apiFetch<{ users: AdminUser[] }>("/api/trainer/users", {
    auth: true,
  })
  return data.users
}

export async function fetchUserWorkouts(
  userId: string,
  weekStartIso?: string
): Promise<Workout[]> {
  const qs = weekStartIso ? `?week=${encodeURIComponent(weekStartIso)}` : ""
  const data = await apiFetch<{ workouts: Workout[] }>(
    `/api/trainer/users/${userId}/workouts${qs}`,
    { auth: true }
  )
  return data.workouts
}

export async function createTrainerWorkout(input: {
  userId: string
  date: string
  name: string
  exercises: ExerciseInput[]
}): Promise<Workout> {
  const data = await apiFetch<{ workout: Workout }>("/api/trainer/workouts", {
    method: "POST",
    body: input,
    auth: true,
  })
  return data.workout
}

export async function updateTrainerWorkout(
  id: string,
  input: { userId: string; date?: string; name?: string; exercises?: ExerciseInput[] }
): Promise<Workout> {
  const data = await apiFetch<{ workout: Workout }>(
    `/api/trainer/workouts/${id}`,
    { method: "PUT", body: input, auth: true }
  )
  return data.workout
}

export async function fetchWorkoutChangeRequests(): Promise<
  WorkoutChangeRequest[]
> {
  const data = await apiFetch<{ requests: WorkoutChangeRequest[] }>(
    "/api/trainer/requests",
    { auth: true }
  )
  return data.requests
}
