"use client"

import * as React from "react"

import {
  apiFetch,
  getStoredToken,
  setStoredToken,
} from "@/lib/api"

export type UserRole = "user" | "trainer" | "admin"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthResponse {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  status: "loading" | "authenticated" | "unauthenticated"
  login: (email: string, password: string) => Promise<AuthUser>
  register: (input: {
    email: string
    password: string
    name: string
  }) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [status, setStatus] = React.useState<AuthContextValue["status"]>(
    "loading"
  )

  React.useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setStatus("unauthenticated")
      return
    }
    let cancelled = false
    apiFetch<{ user: AuthUser }>("/api/auth/me", { auth: true })
      .then((data) => {
        if (cancelled) return
        setUser(data.user)
        setStatus("authenticated")
      })
      .catch(() => {
        if (cancelled) return
        setStoredToken(null)
        setUser(null)
        setStatus("unauthenticated")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = React.useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      })
      setStoredToken(data.token)
      setUser(data.user)
      setStatus("authenticated")
      return data.user
    },
    []
  )

  const register = React.useCallback(
    async (input: { email: string; password: string; name: string }) => {
      const data = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: input,
      })
      setStoredToken(data.token)
      setUser(data.user)
      setStatus("authenticated")
      return data.user
    },
    []
  )

  const logout = React.useCallback(() => {
    setStoredToken(null)
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "trainer":
      return "/trainer"
    default:
      return "/dashboard"
  }
}
