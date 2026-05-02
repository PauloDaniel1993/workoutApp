import { randomUUID } from "crypto"

import type {
  Exercise,
  StoredWorkout,
  Workout,
  WorkoutStatus,
} from "../types/workout"

const YOUTUBE: Record<string, string> = {
  "Bench Press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  Squat: "https://www.youtube.com/watch?v=ultWZbUMPL8",
  Deadlift: "https://www.youtube.com/watch?v=op9kVnSo6Qk",
  "Shoulder Press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
  "Bicep Curl": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  "Lat Pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "Leg Press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
  Plank: "https://www.youtube.com/watch?v=ASdvN_XEl_c",
  "Running (treadmill)": "https://www.youtube.com/watch?v=brFHyOtTwH4",
  Lunges: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
}

interface ExerciseSeed {
  name: string
  sets: number
  reps: number
  weight: number
}

function ex(name: string, sets: number, reps: number, weight: number): ExerciseSeed {
  return { name, sets, reps, weight }
}

const TEMPLATES: Record<string, ExerciseSeed[]> = {
  "Upper Body": [
    ex("Bench Press", 4, 8, 60),
    ex("Shoulder Press", 3, 10, 30),
    ex("Lat Pulldown", 3, 12, 45),
    ex("Bicep Curl", 3, 12, 12),
  ],
  "Leg Day": [
    ex("Squat", 4, 8, 80),
    ex("Leg Press", 4, 10, 120),
    ex("Lunges", 3, 12, 20),
    ex("Plank", 3, 1, 0),
  ],
  Cardio: [
    ex("Running (treadmill)", 1, 1, 0),
    ex("Plank", 3, 1, 0),
    ex("Lunges", 3, 15, 0),
  ],
  "Pull Day": [
    ex("Deadlift", 4, 6, 100),
    ex("Lat Pulldown", 4, 10, 50),
    ex("Bicep Curl", 3, 12, 14),
  ],
  "Push Day": [
    ex("Bench Press", 4, 8, 65),
    ex("Shoulder Press", 4, 10, 32),
    ex("Plank", 3, 1, 0),
  ],
  "Full Body": [
    ex("Squat", 3, 10, 70),
    ex("Bench Press", 3, 10, 55),
    ex("Deadlift", 3, 8, 90),
    ex("Plank", 3, 1, 0),
  ],
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isoDate(d: Date): string {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, "0")
  const day = String(x.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(x, diff)
}

function buildExercises(template: ExerciseSeed[], allCompleted: boolean): Exercise[] {
  return template.map((t, i) => ({
    id: randomUUID(),
    name: t.name,
    sets: t.sets,
    reps: t.reps,
    weight: t.weight,
    youtubeUrl: YOUTUBE[t.name] ?? "",
    completed: allCompleted ? true : i < Math.floor(template.length / 2),
  }))
}

interface WeekPlan {
  offsetWeeks: number
  schedule: Array<{ dayOffset: number; name: keyof typeof TEMPLATES; outcome: "done" | "missed" | "future" }>
}

function buildPlans(todayOffset: number): WeekPlan[] {
  const past = [
    { name: "Push Day" as const, outcome: "done" as const },
    { name: "Pull Day" as const, outcome: "missed" as const },
    { name: "Cardio" as const, outcome: "done" as const },
  ]
  const future = [
    { name: "Leg Day" as const, outcome: "future" as const },
    { name: "Upper Body" as const, outcome: "future" as const },
  ]

  const currentSchedule: WeekPlan["schedule"] = []
  let pastIdx = 0
  for (let d = 0; d < todayOffset; d++) {
    if (d % 2 === 0 && pastIdx < past.length) {
      currentSchedule.push({ dayOffset: d, ...past[pastIdx++] })
    }
  }
  currentSchedule.push({ dayOffset: todayOffset, name: "Full Body", outcome: "done" })
  let futureIdx = 0
  for (let d = todayOffset + 1; d < 7; d++) {
    if (d % 2 === (todayOffset + 1) % 2 && futureIdx < future.length) {
      currentSchedule.push({ dayOffset: d, ...future[futureIdx++] })
    }
  }

  return [
    {
      offsetWeeks: -1,
      schedule: [
        { dayOffset: 0, name: "Upper Body", outcome: "done" },
        { dayOffset: 2, name: "Leg Day", outcome: "missed" },
        { dayOffset: 4, name: "Cardio", outcome: "done" },
      ],
    },
    { offsetWeeks: 0, schedule: currentSchedule },
    {
      offsetWeeks: 1,
      schedule: [
        { dayOffset: 0, name: "Push Day", outcome: "future" },
        { dayOffset: 2, name: "Pull Day", outcome: "future" },
        { dayOffset: 4, name: "Leg Day", outcome: "future" },
        { dayOffset: 6, name: "Full Body", outcome: "future" },
      ],
    },
  ]
}


const SEED_EMAIL = "user@test.com"

function buildSeedWorkouts(): StoredWorkout[] {
  const today = startOfDay(new Date())
  const thisWeekStart = startOfWeek(today)
  const todayOffset = Math.round(
    (today.getTime() - thisWeekStart.getTime()) / (24 * 60 * 60 * 1000)
  )
  const plans = buildPlans(todayOffset)
  const out: StoredWorkout[] = []

  for (const plan of plans) {
    const weekStart = addDays(thisWeekStart, plan.offsetWeeks * 7)
    for (const item of plan.schedule) {
      const date = addDays(weekStart, item.dayOffset)
      const allCompleted = item.outcome === "done"
      out.push({
        id: randomUUID(),
        userEmail: SEED_EMAIL,
        date: isoDate(date),
        name: item.name,
        exercises: buildExercises(TEMPLATES[item.name], allCompleted),
      })
    }
  }
  return out
}

const workouts: StoredWorkout[] = buildSeedWorkouts()

function computeStatus(workout: StoredWorkout): WorkoutStatus {
  const todayIso = isoDate(new Date())
  if (workout.date === todayIso) return "today"
  if (workout.date > todayIso) return "upcoming"
  const allDone = workout.exercises.every((e) => e.completed)
  return allDone ? "completed" : "missed"
}

function toApi(workout: StoredWorkout, userId: string): Workout {
  return {
    id: workout.id,
    userId,
    date: workout.date,
    name: workout.name,
    exercises: workout.exercises,
    status: computeStatus(workout),
  }
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function inWeek(dateIso: string, weekStartIso: string): boolean {
  const start = parseIsoDate(weekStartIso)
  const end = addDays(start, 7)
  const d = parseIsoDate(dateIso)
  return d >= start && d < end
}

export function getWorkoutsForUser(
  user: { id: string; email: string },
  weekStartIso?: string
): Workout[] {
  return workouts
    .filter((w) => w.userEmail === user.email.toLowerCase())
    .filter((w) => (weekStartIso ? inWeek(w.date, weekStartIso) : true))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => toApi(w, user.id))
}

export function getWorkoutById(
  user: { id: string; email: string },
  workoutId: string
): Workout | null {
  const found = workouts.find(
    (w) => w.id === workoutId && w.userEmail === user.email.toLowerCase()
  )
  return found ? toApi(found, user.id) : null
}

export function toggleExerciseCompleted(
  user: { id: string; email: string },
  workoutId: string,
  exerciseId: string,
  completed: boolean
): { ok: true; workout: Workout } | { ok: false; status: number; error: string } {
  const workout = workouts.find(
    (w) => w.id === workoutId && w.userEmail === user.email.toLowerCase()
  )
  if (!workout) return { ok: false, status: 404, error: "Workout not found" }
  if (workout.date !== isoDate(new Date())) {
    return { ok: false, status: 403, error: "Exercises can only be updated on the workout day" }
  }
  const exercise = workout.exercises.find((e) => e.id === exerciseId)
  if (!exercise) return { ok: false, status: 404, error: "Exercise not found" }
  exercise.completed = completed
  return { ok: true, workout: toApi(workout, user.id) }
}

export function getWorkoutsForEmail(
  user: { id: string; email: string },
  weekStartIso?: string
): Workout[] {
  return workouts
    .filter((w) => w.userEmail === user.email.toLowerCase())
    .filter((w) => (weekStartIso ? inWeek(w.date, weekStartIso) : true))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => toApi(w, user.id))
}

export interface CreateWorkoutInput {
  userEmail: string
  date: string
  name: string
  exercises: Array<{
    name: string
    sets: number
    reps: number
    weight: number
    youtubeUrl: string
  }>
}

export function createWorkoutForUser(
  input: CreateWorkoutInput,
  userId: string
): Workout {
  const stored: StoredWorkout = {
    id: randomUUID(),
    userEmail: input.userEmail.toLowerCase(),
    date: input.date,
    name: input.name,
    exercises: input.exercises.map((e) => ({
      id: randomUUID(),
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      weight: e.weight,
      youtubeUrl: e.youtubeUrl,
      completed: false,
    })),
  }
  workouts.push(stored)
  return toApi(stored, userId)
}

export interface UpdateWorkoutInput {
  date?: string
  name?: string
  exercises?: Array<{
    id?: string
    name: string
    sets: number
    reps: number
    weight: number
    youtubeUrl: string
  }>
}

export function updateWorkoutById(
  workoutId: string,
  patch: UpdateWorkoutInput,
  userId: string
): Workout | null {
  const stored = workouts.find((w) => w.id === workoutId)
  if (!stored) return null
  if (patch.date !== undefined) stored.date = patch.date
  if (patch.name !== undefined) stored.name = patch.name
  if (patch.exercises !== undefined) {
    const previous = new Map(stored.exercises.map((e) => [e.id, e]))
    stored.exercises = patch.exercises.map((e) => {
      const prior = e.id ? previous.get(e.id) : undefined
      return {
        id: prior?.id ?? randomUUID(),
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        youtubeUrl: e.youtubeUrl,
        completed: prior?.completed ?? false,
      }
    })
  }
  return toApi(stored, userId)
}

export function countWorkouts(): number {
  return workouts.length
}
