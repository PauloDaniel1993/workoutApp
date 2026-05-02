import { apiFetch } from "@/lib/api"
import type { UserRole, AuthUser } from "@/contexts/AuthContext"

export interface AdminUser extends AuthUser {
  createdAt?: string
}

export const WORKOUT_CHANGE_REASONS = [
  { value: "change_exercises", label: "Change exercises" },
  { value: "change_schedule", label: "Change schedule" },
  { value: "increase_difficulty", label: "Increase difficulty" },
  { value: "decrease_difficulty", label: "Decrease difficulty" },
  { value: "other", label: "Other" },
] as const

export type WorkoutChangeReason =
  (typeof WORKOUT_CHANGE_REASONS)[number]["value"]

export interface WorkoutChangeRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  reason: WorkoutChangeReason
  message: string
  createdAt: string
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiFetch("/api/users/password", {
    method: "PATCH",
    body: { currentPassword, newPassword },
    auth: true,
  })
}

export async function changeEmail(
  newEmail: string,
  currentPassword: string
): Promise<AdminUser> {
  const data = await apiFetch<{ user: AdminUser }>("/api/users/email", {
    method: "PATCH",
    body: { newEmail, currentPassword },
    auth: true,
  })
  return data.user
}

export async function submitWorkoutChangeRequest(
  reason: WorkoutChangeReason,
  message: string
): Promise<WorkoutChangeRequest> {
  const data = await apiFetch<{ request: WorkoutChangeRequest }>(
    "/api/users/requests",
    { method: "POST", body: { reason, message }, auth: true }
  )
  return data.request
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users", {
    auth: true,
  })
  return data.users
}

export async function createAdminUser(input: {
  email: string
  name: string
  password: string
  role: UserRole
}): Promise<AdminUser> {
  const data = await apiFetch<{ user: AdminUser }>("/api/admin/users", {
    method: "POST",
    body: input,
    auth: true,
  })
  return data.user
}

export async function updateAdminUser(
  id: string,
  input: { email?: string; name?: string; role?: UserRole }
): Promise<AdminUser> {
  const data = await apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}`, {
    method: "PUT",
    body: input,
    auth: true,
  })
  return data.user
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiFetch(`/api/admin/users/${id}`, { method: "DELETE", auth: true })
}

export interface AdminStats {
  totalUsers: number
  totalEndUsers: number
  totalTrainers: number
  totalAdmins: number
  totalWorkouts: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const data = await apiFetch<{ stats: AdminStats }>("/api/admin/stats", {
    auth: true,
  })
  return data.stats
}
