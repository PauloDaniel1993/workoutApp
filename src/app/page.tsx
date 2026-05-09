"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { AuthTabs } from "@/components/auth/auth-tabs"
import { dashboardPathForRole, useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const { user, status } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(dashboardPathForRole(user.role))
    }
  }, [status, user, router])

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <AuthTabs />
      </div>
    </main>
  )
}
