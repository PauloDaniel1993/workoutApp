import { Router, type Request, type Response } from 'express'

import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  listUsersByRole,
  toPublicUser,
  updateUser,
} from '../data/users'
import { countWorkouts } from '../data/workouts'
import { requireAuth, requireRole } from '../middleware/auth'
import type { UserRole } from '../types/auth'

const router = Router()

router.use(requireAuth, requireRole('admin'))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES: UserRole[] = ['user', 'trainer', 'admin']

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
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
 *         description: Not an admin
 */
router.get('/users', async (_req: Request, res: Response) => {
  const users = (await listUsers())
    .sort((a, b) => a.email.localeCompare(b.email))
    .map(toPublicUser)
  return res.json({ users })
})

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, trainer, admin]
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post('/users', async (req: Request, res: Response) => {
  const { email, name, password, role } = (req.body ?? {}) as {
    email?: unknown
    name?: unknown
    password?: unknown
    role?: unknown
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res
      .status(400)
      .json({ error: 'Password must be at least 6 characters' })
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' })
  }
  if (typeof role !== 'string' || !ROLES.includes(role as UserRole)) {
    return res.status(400).json({ error: 'A valid role is required' })
  }
  const existing = await findUserByEmail(email)
  if (existing) {
    return res.status(409).json({ error: 'Email is already registered' })
  }
  const user = await createUser({
    email,
    name: name.trim(),
    password,
    role: role as UserRole,
  })
  return res.status(201).json({ user: toPublicUser(user) })
})

/**
 * @openapi
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a user
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, trainer, admin]
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const { email, name, role } = (req.body ?? {}) as {
    email?: unknown
    name?: unknown
    role?: unknown
  }
  const user = await findUserById(id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (email !== undefined && (typeof email !== 'string' || !EMAIL_RE.test(email))) {
    return res.status(400).json({ error: 'A valid email is required' })
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Name is required' })
  }
  if (role !== undefined && (typeof role !== 'string' || !ROLES.includes(role as UserRole))) {
    return res.status(400).json({ error: 'A valid role is required' })
  }
  if (typeof email === 'string') {
    const existing = await findUserByEmail(email)
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: 'Email is already in use' })
    }
  }
  const updated = await updateUser(id, {
    name: typeof name === 'string' ? name : undefined,
    email: typeof email === 'string' ? email : undefined,
    role: typeof role === 'string' ? (role as UserRole) : undefined,
  })
  return res.json({ user: updated && toPublicUser(updated) })
})

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user
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
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: Cannot delete yourself
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  const claims = req.user!
  const id = String(req.params.id)
  if (id === claims.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' })
  }
  const ok = await deleteUser(id)
  if (!ok) return res.status(404).json({ error: 'User not found' })
  return res.json({ ok: true })
})

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalEndUsers:
 *                       type: integer
 *                     totalTrainers:
 *                       type: integer
 *                     totalAdmins:
 *                       type: integer
 *                     totalWorkouts:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not an admin
 */
router.get('/stats', async (_req: Request, res: Response) => {
  const [users, endUsers, trainers, admins, totalWorkouts] = await Promise.all([
    listUsers(),
    listUsersByRole('user'),
    listUsersByRole('trainer'),
    listUsersByRole('admin'),
    countWorkouts(),
  ])

  return res.json({
    stats: {
      totalUsers: users.length,
      totalEndUsers: endUsers.length,
      totalTrainers: trainers.length,
      totalAdmins: admins.length,
      totalWorkouts,
    },
  })
})

export default router
