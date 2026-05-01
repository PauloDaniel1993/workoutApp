import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

import type { PublicUser, User } from "../types/auth"

const SEED_PASSWORD = "password123"
const seedHash = bcrypt.hashSync(SEED_PASSWORD, 10)

const users: User[] = [
  {
    id: randomUUID(),
    email: "admin@test.com",
    name: "Admin User",
    role: "admin",
    passwordHash: seedHash,
  },
  {
    id: randomUUID(),
    email: "trainer@test.com",
    name: "Trainer User",
    role: "trainer",
    passwordHash: seedHash,
  },
  {
    id: randomUUID(),
    email: "user@test.com",
    name: "John Doe",
    role: "user",
    passwordHash: seedHash,
  },
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
}): User {
  const user: User = {
    id: randomUUID(),
    email: normalizeEmail(input.email),
    name: input.name.trim(),
    role: "user",
    passwordHash: bcrypt.hashSync(input.password, 10),
  }
  users.push(user)
  return user
}

export function toPublicUser(user: User): PublicUser {
  const { id, email, name, role } = user
  return { id, email, name, role }
}
