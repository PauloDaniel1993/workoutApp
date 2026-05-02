export type UserRole = "user" | "trainer" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  passwordHash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt?: string
}

export interface JwtPayload {
  id: string
  email: string
  name: string
  role: UserRole
}
