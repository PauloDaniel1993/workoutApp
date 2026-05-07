import { prisma } from '../lib/prisma'
import type { RequestStatus, WorkoutChangeReason } from '../types/request'

export const REASONS: WorkoutChangeReason[] = [
  'change_exercises',
  'change_schedule',
  'increase_difficulty',
  'decrease_difficulty',
  'other',
]

export async function listRequests() {
  return prisma.workoutChangeRequest.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createRequest(input: {
  userId: string
  reason: WorkoutChangeReason
  message: string
}) {
  return prisma.workoutChangeRequest.create({
    data: {
      userId: input.userId,
      reason: input.reason,
      message: input.message,
    },
  })
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
) {
  try {
    return await prisma.workoutChangeRequest.update({
      where: { id },
      data: { status },
    })
  } catch {
    return undefined
  }
}

export async function getRequestsForUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (!user) return []

  return prisma.workoutChangeRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
}
