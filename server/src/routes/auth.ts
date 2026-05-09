import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'

import { createUser, findUserByEmail, findUserById, toPublicUser } from '../data/users'
import { requireAuth, signToken } from '../middleware/auth'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {}

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) {
    return res.status(400).json({ error: 'Name is required' })
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    return res.status(409).json({ error: 'Email is already registered' })
  }

  const user = await createUser({ email, password, name: trimmedName })
  const publicUser = toPublicUser(user)
  const token = signToken(publicUser)

  return res.status(201).json({ token, user: publicUser })
})

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       400:
 *         description: Missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = await findUserByEmail(email)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const publicUser = toPublicUser(user)
  const token = signToken(publicUser)

  return res.json({ token, user: publicUser })
})

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const claims = req.user!
  const user = await findUserById(claims.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json({ user: toPublicUser(user) })
})

export default router
