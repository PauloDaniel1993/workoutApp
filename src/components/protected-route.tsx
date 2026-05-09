"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { useAuth, type UserRole } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, status } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/")
      return
    }
    if (
      status === "authenticated" &&
      user &&
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      router.replace("/")
    }
  }, [status, user, allowedRoles, router])

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
