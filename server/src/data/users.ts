import bcrypt from 'bcryptjs'

import { prisma } from '../lib/prisma'
import type { PublicUser, UserRole } from '../types/auth'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function findUserByEmail(email: string) {
  const target = normalizeEmail(email)
  return prisma.user.findUnique({ where: { email: target } })
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function createUser(input: {
  email: string
  name: string
  password: string
  role?: UserRole
}) {
  return prisma.user.create({
    data: {
      email: normalizeEmail(input.email),
      name: input.name.trim(),
      role: input.role ?? 'user',
      passwordHash: bcrypt.hashSync(input.password, 10),
    },
  })
}

export async function updateUser(
  id: string,
  patch: { name?: string; email?: string; role?: UserRole }
) {
  const data: Record<string, unknown> = {}
  if (patch.name !== undefined) data.name = patch.name.trim()
  if (patch.email !== undefined) data.email = normalizeEmail(patch.email)
  if (patch.role !== undefined) data.role = patch.role

  return prisma.user.update({ where: { id }, data })
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

export async function setUserPassword(id: string, password: string) {
  try {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: bcrypt.hashSync(password, 10) },
    })
    return true
  } catch {
    return false
  }
}

export async function listUsers() {
  return prisma.user.findMany()
}

export async function listUsersByRole(role: UserRole) {
  return prisma.user.findMany({ where: { role } })
}

export async function listAssignedUsers(trainerEmail: string) {
  const trainer = await prisma.user.findUnique({
    where: { email: normalizeEmail(trainerEmail) },
  })
  if (!trainer) return []

  const assignments = await prisma.trainerAssignment.findMany({
    where: { trainerId: trainer.id },
    include: { user: true },
  })
  return assignments.map((a) => a.user)
}

export async function isUserAssignedToTrainer(
  trainerEmail: string,
  userEmail: string
): Promise<boolean> {
  const trainer = await prisma.user.findUnique({
    where: { email: normalizeEmail(trainerEmail) },
  })
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(userEmail) },
  })
  if (!trainer || !user) return false

  const assignment = await prisma.trainerAssignment.findUnique({
    where: {
      trainerId_userId: {
        trainerId: trainer.id,
        userId: user.id,
      },
    },
  })
  return assignment !== null
}

export function toPublicUser(user: { id: string; email: string; name: string; role: UserRole; createdAt?: Date | string }): PublicUser {
  const createdAt = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt,
  }
}
