import { randomUUID } from "crypto"

import type {
  WorkoutChangeReason,
  WorkoutChangeRequest,
} from "../types/request"
import { findUserByEmail } from "./users"

export const REASONS: WorkoutChangeReason[] = [
  "change_exercises",
  "change_schedule",
  "increase_difficulty",
  "decrease_difficulty",
  "other",
]

const requests: WorkoutChangeRequest[] = []

function seed() {
  const user = findUserByEmail("user@test.com")
  if (!user) return
  const now = Date.now()
  requests.push(
    {
      id: randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      reason: "increase_difficulty",
      message: "Squats feel too easy at this weight — can we bump it up?",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: randomUUID(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      reason: "change_schedule",
      message: "Could we move leg day to Saturday going forward?",
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    }
  )
}

seed()

export function listRequests(): WorkoutChangeRequest[] {
  return requests
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createRequest(input: {
  userId: string
  userEmail: string
  userName: string
  reason: WorkoutChangeReason
  message: string
}): WorkoutChangeRequest {
  const req: WorkoutChangeRequest = {
    id: randomUUID(),
    userId: input.userId,
    userEmail: input.userEmail.toLowerCase(),
    userName: input.userName,
    reason: input.reason,
    message: input.message,
    createdAt: new Date().toISOString(),
  }
  requests.push(req)
  return req
}
