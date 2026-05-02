import { Router, type Request, type Response } from "express"
import bcrypt from "bcryptjs"

import {
  findUserByEmail,
  findUserById,
  setUserPassword,
  updateUser,
} from "../data/users"
import { createRequest, REASONS } from "../data/requests"
import { requireAuth } from "../middleware/auth"
import type { WorkoutChangeReason } from "../types/request"

const router = Router()

router.use(requireAuth)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.patch("/password", (req: Request, res: Response) => {
  const claims = req.user!
  const { currentPassword, newPassword } = (req.body ?? {}) as {
    currentPassword?: unknown
    newPassword?: unknown
  }
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return res
      .status(400)
      .json({ error: "Current and new passwords are required" })
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" })
  }
  const user = findUserById(claims.id)
  if (!user) return res.status(404).json({ error: "User not found" })
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: "Current password is incorrect" })
  }
  setUserPassword(user.id, newPassword)
  return res.json({ ok: true })
})

router.patch("/email", (req: Request, res: Response) => {
  const claims = req.user!
  const { newEmail, currentPassword } = (req.body ?? {}) as {
    newEmail?: unknown
    currentPassword?: unknown
  }
  if (typeof newEmail !== "string" || !EMAIL_RE.test(newEmail)) {
    return res.status(400).json({ error: "A valid email is required" })
  }
  if (typeof currentPassword !== "string") {
    return res.status(400).json({ error: "Current password is required" })
  }
  const user = findUserById(claims.id)
  if (!user) return res.status(404).json({ error: "User not found" })
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: "Current password is incorrect" })
  }
  const existing = findUserByEmail(newEmail)
  if (existing && existing.id !== user.id) {
    return res.status(409).json({ error: "Email is already in use" })
  }
  const updated = updateUser(user.id, { email: newEmail })
  return res.json({
    user: updated && {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    },
  })
})

router.post("/requests", (req: Request, res: Response) => {
  const claims = req.user!
  const { reason, message } = (req.body ?? {}) as {
    reason?: unknown
    message?: unknown
  }
  if (
    typeof reason !== "string" ||
    !REASONS.includes(reason as WorkoutChangeReason)
  ) {
    return res.status(400).json({ error: "A valid reason is required" })
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" })
  }
  const user = findUserById(claims.id)
  if (!user) return res.status(404).json({ error: "User not found" })
  const created = createRequest({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    reason: reason as WorkoutChangeReason,
    message: message.trim(),
  })
  return res.status(201).json({ request: created })
})

export default router
