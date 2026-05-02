import { Router, type Request, type Response } from "express"

import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  listUsersByRole,
  toPublicUser,
  updateUser,
} from "../data/users"
import { countWorkouts } from "../data/workouts"
import { requireAuth, requireRole } from "../middleware/auth"
import type { UserRole } from "../types/auth"

const router = Router()

router.use(requireAuth, requireRole("admin"))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES: UserRole[] = ["user", "trainer", "admin"]

router.get("/users", (_req: Request, res: Response) => {
  const users = listUsers()
    .slice()
    .sort((a, b) => a.email.localeCompare(b.email))
    .map(toPublicUser)
  return res.json({ users })
})

router.post("/users", (req: Request, res: Response) => {
  const { email, name, password, role } = (req.body ?? {}) as {
    email?: unknown
    name?: unknown
    password?: unknown
    role?: unknown
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required" })
  }
  if (typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" })
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required" })
  }
  if (typeof role !== "string" || !ROLES.includes(role as UserRole)) {
    return res.status(400).json({ error: "A valid role is required" })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Email is already registered" })
  }
  const user = createUser({
    email,
    name: name.trim(),
    password,
    role: role as UserRole,
  })
  return res.status(201).json({ user: toPublicUser(user) })
})

router.put("/users/:id", (req: Request, res: Response) => {
  const id = String(req.params.id)
  const { email, name, role } = (req.body ?? {}) as {
    email?: unknown
    name?: unknown
    role?: unknown
  }
  const user = findUserById(id)
  if (!user) return res.status(404).json({ error: "User not found" })

  if (email !== undefined && (typeof email !== "string" || !EMAIL_RE.test(email))) {
    return res.status(400).json({ error: "A valid email is required" })
  }
  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({ error: "Name is required" })
  }
  if (role !== undefined && (typeof role !== "string" || !ROLES.includes(role as UserRole))) {
    return res.status(400).json({ error: "A valid role is required" })
  }
  if (typeof email === "string") {
    const existing = findUserByEmail(email)
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ error: "Email is already in use" })
    }
  }
  const updated = updateUser(id, {
    name: typeof name === "string" ? name : undefined,
    email: typeof email === "string" ? email : undefined,
    role: typeof role === "string" ? (role as UserRole) : undefined,
  })
  return res.json({ user: updated && toPublicUser(updated) })
})

router.delete("/users/:id", (req: Request, res: Response) => {
  const claims = req.user!
  const id = String(req.params.id)
  if (id === claims.id) {
    return res.status(400).json({ error: "You cannot delete your own account" })
  }
  const ok = deleteUser(id)
  if (!ok) return res.status(404).json({ error: "User not found" })
  return res.json({ ok: true })
})

router.get("/stats", (_req: Request, res: Response) => {
  return res.json({
    stats: {
      totalUsers: listUsers().length,
      totalEndUsers: listUsersByRole("user").length,
      totalTrainers: listUsersByRole("trainer").length,
      totalAdmins: listUsersByRole("admin").length,
      totalWorkouts: countWorkouts(),
    },
  })
})

export default router
