import { Router, type Request, type Response } from 'express'

import {
  findUserById,
  isUserAssignedToTrainer,
  listAssignedUsers,
  toPublicUser,
} from '../data/users'
import {
  createWorkoutForUser,
  getWorkoutsForEmail,
  updateWorkoutById,
} from '../data/workouts'
import { listRequests, updateRequestStatus } from '../data/requests'
import type { RequestStatus } from '../types/request'
import { requireAuth, requireRole } from '../middleware/auth'

const router = Router()

router.use(requireAuth, requireRole('trainer'))

/**
 * @openapi
 * /trainer/users:
 *   get:
 *     tags: [Trainer]
 *     summary: List users assigned to the trainer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicUser'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a trainer
 */
router.get('/users', async (req: Request, res: Response) => {
  const claims = req.user!
  const users = (await listAssignedUsers(claims.email)).map(toPublicUser)
  return res.json({ users })
})

/**
 * @openapi
 * /trainer/users/{userId}/workouts:
 *   get:
 *     tags: [Trainer]
 *     summary: Get workouts for an assigned user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *       403:
 *         description: User not assigned to you
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/workouts', async (req: Request, res: Response) => {
  const claims = req.user!
  const target = await findUserById(String(req.params.userId))
  if (!target) return res.status(404).json({ error: 'User not found' })
  const assigned = await isUserAssignedToTrainer(claims.email, target.email)
  if (!assigned) {
    return res.status(403).json({ error: 'User is not assigned to you' })
  }
  const weekStart = typeof req.query.week === 'string' ? req.query.week : undefined
  if (weekStart && !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: 'Invalid week parameter' })
  }
  const workouts = await getWorkoutsForEmail(
    { id: target.id },
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
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === 'string' &&
    v.name.trim().length > 0 &&
    typeof v.sets === 'number' &&
    typeof v.reps === 'number' &&
    typeof v.weight === 'number' &&
    typeof v.youtubeUrl === 'string'
  )
}

/**
 * @openapi
 * /trainer/workouts:
 *   post:
 *     tags: [Trainer]
 *     summary: Create a workout for an assigned user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, date, name, exercises]
 *             properties:
 *               userId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               name:
 *                 type: string
 *               exercises:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ExerciseInput'
 *     responses:
 *       201:
 *         description: Workout created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workout:
 *                   $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Validation error
 *       403:
 *         description: User not assigned to you
 *       404:
 *         description: User not found
 */
router.post('/workouts', async (req: Request, res: Response) => {
  const claims = req.user!
  const { userId, date, name, exercises } = (req.body ?? {}) as {
    userId?: unknown
    date?: unknown
    name?: unknown
    exercises?: unknown
  }
  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' })
  }
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required' })
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Workout name is required' })
  }
  if (!Array.isArray(exercises) || exercises.length === 0 || !exercises.every(isExerciseInput)) {
    return res.status(400).json({ error: 'At least one valid exercise is required' })
  }
  const target = await findUserById(userId)
  if (!target) return res.status(404).json({ error: 'User not found' })
  const assigned = await isUserAssignedToTrainer(claims.email, target.email)
  if (!assigned) {
    return res.status(403).json({ error: 'User is not assigned to you' })
  }
  const workout = await createWorkoutForUser(
    { userEmail: target.email, date, name: name.trim(), exercises },
    target.id
  )
  return res.status(201).json({ workout })
})

/**
 * @openapi
 * /trainer/workouts/{id}:
 *   put:
 *     tags: [Trainer]
 *     summary: Update a workout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               exercises:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ExerciseInput'
 *     responses:
 *       200:
 *         description: Workout updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workout:
 *                   $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Validation error
 *       403:
 *         description: User not assigned to you
 *       404:
 *         description: User or workout not found
 */
router.put('/workouts/:id', async (req: Request, res: Response) => {
  const claims = req.user!
  const { name, date, exercises, userId } = (req.body ?? {}) as {
    name?: unknown
    date?: unknown
    exercises?: unknown
    userId?: unknown
  }
  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' })
  }
  const target = await findUserById(userId)
  if (!target) return res.status(404).json({ error: 'User not found' })
  const assigned = await isUserAssignedToTrainer(claims.email, target.email)
  if (!assigned) {
    return res.status(403).json({ error: 'User is not assigned to you' })
  }
  if (date !== undefined && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return res.status(400).json({ error: 'Invalid date' })
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Invalid name' })
  }
  if (
    exercises !== undefined &&
    (!Array.isArray(exercises) || exercises.length === 0 || !exercises.every(isExerciseInput))
  ) {
    return res.status(400).json({ error: 'Invalid exercises' })
  }
  const updated = await updateWorkoutById(
    String(req.params.id),
    {
      name: typeof name === 'string' ? name.trim() : undefined,
      date: typeof date === 'string' ? date : undefined,
      exercises: Array.isArray(exercises) ? (exercises as ExerciseInput[]) : undefined,
    },
    target.id
  )
  if (!updated) return res.status(404).json({ error: 'Workout not found' })
  return res.json({ workout: updated })
})

const VALID_REQUEST_STATUSES: RequestStatus[] = ['approved', 'rejected']

/**
 * @openapi
 * /trainer/requests/{id}:
 *   patch:
 *     tags: [Trainer]
 *     summary: Approve or reject a workout change request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Request updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request:
 *                   $ref: '#/components/schemas/WorkoutChangeRequest'
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Request not found
 */
router.patch('/requests/:id', async (req: Request, res: Response) => {
  const { status } = (req.body ?? {}) as { status?: unknown }
  if (
    typeof status !== 'string' ||
    !VALID_REQUEST_STATUSES.includes(status as RequestStatus)
  ) {
    return res
      .status(400)
      .json({ error: 'Status must be "approved" or "rejected"' })
  }
  const updated = await updateRequestStatus(String(req.params.id), status as RequestStatus)
  if (!updated) return res.status(404).json({ error: 'Request not found' })
  return res.json({ request: updated })
})

/**
 * @openapi
 * /trainer/requests:
 *   get:
 *     tags: [Trainer]
 *     summary: List all workout change requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkoutChangeRequest'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a trainer
 */
router.get('/requests', async (_req: Request, res: Response) => {
  const requests = await listRequests()
  return res.json({ requests })
})

export default router
