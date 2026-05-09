"use client"

import { useAuth, type UserRole } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/protected-route"

interface RolePageProps {
  title: string
  description: string
  allowedRoles: UserRole[]
}

function RolePageContent({ title, description }: Omit<RolePageProps, "allowedRoles">) {
  const { user } = useAuth()
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl space-y-2 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {user ? (
          <p className="pt-4 text-sm">
            Signed in as <span className="font-medium">{user.name}</span> —{" "}
            <span className="uppercase tracking-wide">{user.role}</span>
          </p>
        ) : null}
      </div>
    </main>
  )
}

export function RolePage(props: RolePageProps) {
  return (
    <ProtectedRoute allowedRoles={props.allowedRoles}>
      <RolePageContent title={props.title} description={props.description} />
    </ProtectedRoute>
  )
}
