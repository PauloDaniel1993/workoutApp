import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'

import {
  findUserByEmail,
  findUserById,
  setUserPassword,
  updateUser,
} from '../data/users'
import { createRequest, getRequestsForUser, REASONS } from '../data/requests'
import { requireAuth } from '../middleware/auth'
import type { WorkoutChangeReason } from '../types/request'

const router = Router()

router.use(requireAuth)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @openapi
 * /users/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 */
router.patch('/password', async (req: Request, res: Response) => {
  const claims = req.user!
  const { currentPassword, newPassword } = (req.body ?? {}) as {
    currentPassword?: unknown
    newPassword?: unknown
  }
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res
      .status(400)
      .json({ error: 'Current and new passwords are required' })
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: 'New password must be at least 6 characters' })
  }
  const user = await findUserById(claims.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  await setUserPassword(user.id, newPassword)
  return res.json({ ok: true })
})

/**
 * @openapi
 * /users/email:
 *   patch:
 *     tags: [Users]
 *     summary: Change email address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newEmail, currentPassword]
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               currentPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Current password is incorrect
 *       409:
 *         description: Email already in use
 */
router.patch('/email', async (req: Request, res: Response) => {
  const claims = req.user!
  const { newEmail, currentPassword } = (req.body ?? {}) as {
    newEmail?: unknown
    currentPassword?: unknown
  }
  if (typeof newEmail !== 'string' || !EMAIL_RE.test(newEmail)) {
    return res.status(400).json({ error: 'A valid email is required' })
  }
  if (typeof currentPassword !== 'string') {
    return res.status(400).json({ error: 'Current password is required' })
  }
  const user = await findUserById(claims.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  const existing = await findUserByEmail(newEmail)
  if (existing && existing.id !== user.id) {
    return res.status(409).json({ error: 'Email is already in use' })
  }
  const updated = await updateUser(user.id, { email: newEmail })
  return res.json({
    user: updated && {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    },
  })
})

/**
 * @openapi
 * /users/requests:
 *   get:
 *     tags: [Users]
 *     summary: Get workout change requests for the current user
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
 */
router.get('/requests', async (req: Request, res: Response) => {
  const claims = req.user!
  const userRequests = await getRequestsForUser(claims.email)
  return res.json({ requests: userRequests })
})

/**
 * @openapi
 * /users/requests:
 *   post:
 *     tags: [Users]
 *     summary: Submit a workout change request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason, message]
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [too_easy, too_hard, injury, schedule, other]
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 request:
 *                   $ref: '#/components/schemas/WorkoutChangeRequest'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.post('/requests', async (req: Request, res: Response) => {
  const claims = req.user!
  const { reason, message } = (req.body ?? {}) as {
    reason?: unknown
    message?: unknown
  }
  if (
    typeof reason !== 'string' ||
    !REASONS.includes(reason as WorkoutChangeReason)
  ) {
    return res.status(400).json({ error: 'A valid reason is required' })
  }
  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' })
  }
  const user = await findUserById(claims.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const created = await createRequest({
    userId: user.id,
    reason: reason as WorkoutChangeReason,
    message: message.trim(),
  })
  return res.status(201).json({ request: created })
})

export default router
