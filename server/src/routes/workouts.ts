import { Router, type Request, type Response } from "express"

import {
  getWorkoutById,
  getWorkoutsForUser,
  toggleExerciseCompleted,
} from "../data/workouts"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

router.get("/", (req: Request, res: Response) => {
  const claims = req.user!
  const weekStart = typeof req.query.week === "string" ? req.query.week : undefined
  if (weekStart && !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: "Invalid week parameter" })
  }
  const workouts = getWorkoutsForUser(
    { id: claims.id, email: claims.email },
    weekStart
  )
  return res.json({ workouts })
})

router.get("/:id", (req: Request, res: Response) => {
  const claims = req.user!
  const id = String(req.params.id)
  const workout = getWorkoutById({ id: claims.id, email: claims.email }, id)
  if (!workout) return res.status(404).json({ error: "Workout not found" })
  return res.json({ workout })
})

router.patch(
  "/:workoutId/exercises/:exerciseId",
  (req: Request, res: Response) => {
    const claims = req.user!
    const { completed } = (req.body ?? {}) as { completed?: unknown }
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "`completed` must be a boolean" })
    }
    const result = toggleExerciseCompleted(
      { id: claims.id, email: claims.email },
      String(req.params.workoutId),
      String(req.params.exerciseId),
      completed
    )
    if (!result.ok) return res.status(result.status).json({ error: result.error })
    return res.json({ workout: result.workout })
  }
)

export default router
