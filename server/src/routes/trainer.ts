import { Router, type Request, type Response } from "express"

import {
  findUserById,
  isUserAssignedToTrainer,
  listAssignedUsers,
  toPublicUser,
} from "../data/users"
import {
  createWorkoutForUser,
  getWorkoutsForEmail,
  updateWorkoutById,
} from "../data/workouts"
import { listRequests } from "../data/requests"
import { requireAuth, requireRole } from "../middleware/auth"

const router = Router()

router.use(requireAuth, requireRole("trainer"))

router.get("/users", (req: Request, res: Response) => {
  const claims = req.user!
  const users = listAssignedUsers(claims.email).map(toPublicUser)
  return res.json({ users })
})

router.get("/users/:userId/workouts", (req: Request, res: Response) => {
  const claims = req.user!
  const target = findUserById(String(req.params.userId))
  if (!target) return res.status(404).json({ error: "User not found" })
  if (!isUserAssignedToTrainer(claims.email, target.email)) {
    return res.status(403).json({ error: "User is not assigned to you" })
  }
  const weekStart = typeof req.query.week === "string" ? req.query.week : undefined
  if (weekStart && !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: "Invalid week parameter" })
  }
  const workouts = getWorkoutsForEmail(
    { id: target.id, email: target.email },
    weekStart
  )
  return res.json({ workouts })
})

interface ExerciseInput {
  id?: string
  name: string
  sets: number
  reps: number
  weight: number
  youtubeUrl: string
}

function isExerciseInput(value: unknown): value is ExerciseInput {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    typeof v.sets === "number" &&
    typeof v.reps === "number" &&
    typeof v.weight === "number" &&
    typeof v.youtubeUrl === "string"
  )
}

router.post("/workouts", (req: Request, res: Response) => {
  const claims = req.user!
  const { userId, date, name, exercises } = (req.body ?? {}) as {
    userId?: unknown
    date?: unknown
    name?: unknown
    exercises?: unknown
  }
  if (typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" })
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "A valid date (YYYY-MM-DD) is required" })
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Workout name is required" })
  }
  if (!Array.isArray(exercises) || exercises.length === 0 || !exercises.every(isExerciseInput)) {
    return res.status(400).json({ error: "At least one valid exercise is required" })
  }
  const target = findUserById(userId)
  if (!target) return res.status(404).json({ error: "User not found" })
  if (!isUserAssignedToTrainer(claims.email, target.email)) {
    return res.status(403).json({ error: "User is not assigned to you" })
  }
  const workout = createWorkoutForUser(
    { userEmail: target.email, date, name: name.trim(), exercises },
    target.id
  )
  return res.status(201).json({ workout })
})

router.put("/workouts/:id", (req: Request, res: Response) => {
  const claims = req.user!
  const { name, date, exercises, userId } = (req.body ?? {}) as {
    name?: unknown
    date?: unknown
    exercises?: unknown
    userId?: unknown
  }
  if (typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" })
  }
  const target = findUserById(userId)
  if (!target) return res.status(404).json({ error: "User not found" })
  if (!isUserAssignedToTrainer(claims.email, target.email)) {
    return res.status(403).json({ error: "User is not assigned to you" })
  }
  if (date !== undefined && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return res.status(400).json({ error: "Invalid date" })
  }
  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({ error: "Invalid name" })
  }
  if (
    exercises !== undefined &&
    (!Array.isArray(exercises) || exercises.length === 0 || !exercises.every(isExerciseInput))
  ) {
    return res.status(400).json({ error: "Invalid exercises" })
  }
  const updated = updateWorkoutById(
    String(req.params.id),
    {
      name: typeof name === "string" ? name.trim() : undefined,
      date: typeof date === "string" ? date : undefined,
      exercises: Array.isArray(exercises) ? (exercises as ExerciseInput[]) : undefined,
    },
    target.id
  )
  if (!updated) return res.status(404).json({ error: "Workout not found" })
  return res.json({ workout: updated })
})

router.get("/requests", (_req: Request, res: Response) => {
  return res.json({ requests: listRequests() })
})

export default router
