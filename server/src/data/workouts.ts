import { prisma } from '../lib/prisma'
import type { Workout, WorkoutStatus } from '../types/workout'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isoDate(d: Date): string {
  const x = startOfDay(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function inWeek(dateIso: string, weekStartIso: string): boolean {
  const start = parseIsoDate(weekStartIso)
  const end = addDays(start, 7)
  const d = parseIsoDate(dateIso)
  return d >= start && d < end
}

function computeStatus(workout: { date: string; exercises: Array<{ completed: boolean }> }): WorkoutStatus {
  const todayIso = isoDate(new Date())
  if (workout.date === todayIso) return 'today'
  if (workout.date > todayIso) return 'upcoming'
  const allDone = workout.exercises.every((e) => e.completed)
  return allDone ? 'completed' : 'missed'
}

function toApi(workout: {
  id: string
  userId: string
  date: string
  name: string
  exercises: Array<{
    id: string
    name: string
    sets: number
    reps: number
    weight: number
    youtubeUrl: string
    completed: boolean
  }>
}): Workout {
  return {
    id: workout.id,
    userId: workout.userId,
    date: workout.date,
    name: workout.name,
    exercises: workout.exercises,
    status: computeStatus(workout),
  }
}

export async function getWorkoutsForUser(
  user: { id: string },
  weekStartIso?: string
): Promise<Workout[]> {
  const where: Record<string, unknown> = { userId: user.id }
  if (weekStartIso) {
    const weekStart = parseIsoDate(weekStartIso)
    const weekEnd = addDays(weekStart, 7)
    where.date = {
      gte: isoDate(weekStart),
      lt: isoDate(weekEnd),
    }
  }

  const workouts = await prisma.workout.findMany({
    where,
    include: { exercises: true },
    orderBy: { date: 'asc' },
  })

  return workouts.map(toApi)
}

export async function getWorkoutById(
  user: { id: string },
  workoutId: string
): Promise<Workout | null> {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id },
    include: { exercises: true },
  })
  return workout ? toApi(workout) : null
}

export async function toggleExerciseCompleted(
  user: { id: string },
  workoutId: string,
  exerciseId: string,
  completed: boolean
): Promise<{ ok: true; workout: Workout } | { ok: false; status: number; error: string }> {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId: user.id },
    include: { exercises: true },
  })
  if (!workout) return { ok: false, status: 404, error: 'Workout not found' }
  if (workout.date !== isoDate(new Date())) {
    return { ok: false, status: 403, error: 'Exercises can only be updated on the workout day' }
  }
  const exercise = workout.exercises.find((e) => e.id === exerciseId)
  if (!exercise) return { ok: false, status: 404, error: 'Exercise not found' }

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { completed },
  })

  const updated = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { exercises: true },
  })

  return { ok: true, workout: toApi(updated!) }
}

export async function getWorkoutsForEmail(
  user: { id: string },
  weekStartIso?: string
): Promise<Workout[]> {
  return getWorkoutsForUser(user, weekStartIso)
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

export async function createWorkoutForUser(
  input: CreateWorkoutInput,
  userId: string
): Promise<Workout> {
  const workout = await prisma.workout.create({
    data: {
      userId,
      date: input.date,
      name: input.name,
      exercises: {
        create: input.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          youtubeUrl: e.youtubeUrl,
        })),
      },
    },
    include: { exercises: true },
  })

  return toApi(workout)
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

export async function updateWorkoutById(
  workoutId: string,
  patch: UpdateWorkoutInput,
  userId: string
): Promise<Workout | null> {
  const existing = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: { exercises: true },
  })
  if (!existing) return null

  const data: Record<string, unknown> = {}
  if (patch.date !== undefined) data.date = patch.date
  if (patch.name !== undefined) data.name = patch.name

  if (patch.exercises !== undefined) {
    const previous = new Map(existing.exercises.map((e) => [e.id, e]))
    await prisma.exercise.deleteMany({ where: { workoutId } })
    data.exercises = {
      create: patch.exercises.map((e) => {
        const prior = e.id ? previous.get(e.id) : undefined
        return {
          id: prior?.id ?? undefined,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          youtubeUrl: e.youtubeUrl,
          completed: prior?.completed ?? false,
        }
      }),
    }
  }

  await prisma.workout.update({
    where: { id: workoutId },
    data,
  })

  const updated = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { exercises: true },
  })

  return updated ? toApi(updated) : null
}

export async function countWorkouts(): Promise<number> {
  return prisma.workout.count()
}
