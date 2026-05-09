import { Router, type Request, type Response } from 'express'

import {
  getWorkoutById,
  getWorkoutsForUser,
  toggleExerciseCompleted,
} from '../data/workouts'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

/**
 * @openapi
 * /workouts:
 *   get:
 *     tags: [Workouts]
 *     summary: Get workouts for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Week start date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of workouts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workouts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Invalid week parameter
 *       401:
 *         description: Not authenticated
 */
router.get('/', async (req: Request, res: Response) => {
  const claims = req.user!
  const weekStart = typeof req.query.week === 'string' ? req.query.week : undefined
  if (weekStart && !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: 'Invalid week parameter' })
  }
  const workouts = await getWorkoutsForUser(
    { id: claims.id },
    weekStart
  )
  return res.json({ workouts })
})

/**
 * @openapi
 * /workouts/{id}:
 *   get:
 *     tags: [Workouts]
 *     summary: Get a workout by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workout:
 *                   $ref: '#/components/schemas/Workout'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Workout not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  const claims = req.user!
  const id = String(req.params.id)
  const workout = await getWorkoutById({ id: claims.id }, id)
  if (!workout) return res.status(404).json({ error: 'Workout not found' })
  return res.json({ workout })
})

/**
 * @openapi
 * /workouts/{workoutId}/exercises/{exerciseId}:
 *   patch:
 *     tags: [Workouts]
 *     summary: Toggle exercise completion status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [completed]
 *             properties:
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated workout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workout:
 *                   $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Workout or exercise not found
 */
router.patch(
  '/:workoutId/exercises/:exerciseId',
  async (req: Request, res: Response) => {
    const claims = req.user!
    const { completed } = (req.body ?? {}) as { completed?: unknown }
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: '`completed` must be a boolean' })
    }
    const result = await toggleExerciseCompleted(
      { id: claims.id },
      String(req.params.workoutId),
      String(req.params.exerciseId),
      completed
    )
    if (!result.ok) return res.status(result.status).json({ error: result.error })
    return res.json({ workout: result.workout })
  }
)

export default router
