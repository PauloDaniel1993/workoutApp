"use client"

import { Plus } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RequestsPanel } from "@/components/trainer/requests-panel"
import { UsersPanel } from "@/components/trainer/users-panel"
import { WorkoutFormDialog } from "@/components/trainer/workout-form-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/api"
import { fetchAssignedUsers } from "@/lib/trainer"
import type { AdminUser } from "@/lib/users"

export function TrainerContent() {
  const { user } = useAuth()
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    fetchAssignedUsers()
      .then((data) => {
        if (cancelled) return
        setUsers(data)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : "Failed to load users"
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          Hey{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your users&apos; training plans and review their requests.
        </p>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Tabs defaultValue="users" className="gap-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="create">Create workout</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : (
            <UsersPanel key={`users-${reloadKey}`} users={users} />
          )}
        </TabsContent>

        <TabsContent value="create">
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Build a workout for one of your users.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              disabled={loading || users.length === 0}
            >
              <Plus /> New workout
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <RequestsPanel />
        </TabsContent>
      </Tabs>

      <WorkoutFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        users={users}
        onSaved={() => setReloadKey((n) => n + 1)}
      />
    </main>
  )
}
