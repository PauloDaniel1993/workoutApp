import { Router, type Request, type Response } from "express"
import bcrypt from "bcryptjs"

import { createUser, findUserByEmail, findUserById, toPublicUser } from "../data/users"
import { requireAuth, signToken } from "../middleware/auth"

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post("/register", (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {}

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required" })
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" })
  }
  const trimmedName = typeof name === "string" ? name.trim() : ""
  if (!trimmedName) {
    return res.status(400).json({ error: "Name is required" })
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Email is already registered" })
  }

  const user = createUser({ email, password, name: trimmedName })
  const publicUser = toPublicUser(user)
  const token = signToken(publicUser)

  return res.status(201).json({ token, user: publicUser })
})

router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body ?? {}

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" })
  }

  const user = findUserByEmail(email)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" })
  }

  const publicUser = toPublicUser(user)
  const token = signToken(publicUser)

  return res.json({ token, user: publicUser })
})

router.get("/me", requireAuth, (req: Request, res: Response) => {
  const claims = req.user!
  const user = findUserById(claims.id)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }
  return res.json({ user: toPublicUser(user) })
})

export default router
