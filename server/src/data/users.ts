import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

import type { PublicUser, User, UserRole } from "../types/auth"

const SEED_PASSWORD = "password123"
const seedHash = bcrypt.hashSync(SEED_PASSWORD, 10)

const users: User[] = [
  {
    id: randomUUID(),
    email: "admin@test.com",
    name: "Admin User",
    role: "admin",
    passwordHash: seedHash,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    email: "trainer@test.com",
    name: "Trainer User",
    role: "trainer",
    passwordHash: seedHash,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    email: "user@test.com",
    name: "John Doe",
    role: "user",
    passwordHash: seedHash,
    createdAt: new Date().toISOString(),
  },
]

const trainerAssignments: Array<{ trainerEmail: string; userEmail: string }> = [
  { trainerEmail: "trainer@test.com", userEmail: "user@test.com" },
]

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function findUserByEmail(email: string): User | undefined {
  const target = normalizeEmail(email)
  return users.find((u) => u.email === target)
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function createUser(input: {
  email: string
  name: string
  password: string
  role?: UserRole
}): User {
  const user: User = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    name: input.name.trim(),
    role: input.role ?? "user",
    passwordHash: bcrypt.hashSync(input.password, 10),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  return user
}

export function updateUser(
  id: string,
  patch: { name?: string; email?: string; role?: UserRole }
): User | undefined {
  const user = findUserById(id)
  if (!user) return undefined
  if (patch.name !== undefined) user.name = patch.name.trim()
  if (patch.email !== undefined) user.email = normalizeEmail(patch.email)
  if (patch.role !== undefined) user.role = patch.role
  return user
}

export function deleteUser(id: string): boolean {
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return false
  users.splice(idx, 1)
  return true
}

export function setUserPassword(id: string, password: string): boolean {
  const user = findUserById(id)
  if (!user) return false
  user.passwordHash = bcrypt.hashSync(password, 10)
  return true
}

export function listUsers(): User[] {
  return users.slice()
}

export function listUsersByRole(role: UserRole): User[] {
  return users.filter((u) => u.role === role)
}

export function listAssignedUsers(trainerEmail: string): User[] {
  const target = normalizeEmail(trainerEmail)
  const assigned = trainerAssignments
    .filter((a) => a.trainerEmail === target)
    .map((a) => a.userEmail)
  return users.filter((u) => assigned.includes(u.email))
}

export function isUserAssignedToTrainer(
  trainerEmail: string,
  userEmail: string
): boolean {
  const t = normalizeEmail(trainerEmail)
  const u = normalizeEmail(userEmail)
  return trainerAssignments.some(
    (a) => a.trainerEmail === t && a.userEmail === u
  )
}

export function toPublicUser(user: User): PublicUser {
  const { id, email, name, role, createdAt } = user
  return { id, email, name, role, createdAt }
}
