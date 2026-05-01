export type UserRole = "user" | "trainer" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  passwordHash: string
}

export interface PublicUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface JwtPayload {
  id: string
  email: string
  name: string
  role: UserRole
}
