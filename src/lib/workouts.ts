import { apiFetch } from "@/lib/api"

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

export interface Workout {
  id: string
  userId: string
  date: string
  name: string
  status: WorkoutStatus
  exercises: Exercise[]
}

export async function fetchWorkouts(weekStartIso?: string): Promise<Workout[]> {
  const qs = weekStartIso ? `?week=${encodeURIComponent(weekStartIso)}` : ""
  const data = await apiFetch<{ workouts: Workout[] }>(
    `/api/workouts${qs}`,
    { auth: true }
  )
  return data.workouts
}

export async function patchExercise(
  workoutId: string,
  exerciseId: string,
  completed: boolean
): Promise<Workout> {
  const data = await apiFetch<{ workout: Workout }>(
    `/api/workouts/${workoutId}/exercises/${exerciseId}`,
    { method: "PATCH", body: { completed }, auth: true }
  )
  return data.workout
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function isoDate(d: Date): string {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, "0")
  const day = String(x.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(x, diff)
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function formatRange(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  return `${fmt(weekStart)} – ${fmt(end)}`
}
