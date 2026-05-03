"use client"

import { Pencil, Plus } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WeeklyCalendar } from "@/components/dashboard/weekly-calendar"
import { RequestsPanel } from "@/components/trainer/requests-panel"
import { WorkoutDetailDialog } from "@/components/trainer/workout-detail-dialog"
import { WorkoutFormDialog } from "@/components/trainer/workout-form-dialog"
import { ApiError } from "@/lib/api"
import { fetchAssignedUsers, fetchUserWorkouts, fetchWorkoutChangeRequests } from "@/lib/trainer"
import type { AdminUser, WorkoutChangeRequest } from "@/lib/users"
import { isoDate, startOfWeek, type Workout } from "@/lib/workouts"
import { useAuth } from "@/contexts/AuthContext"

export function TrainerDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = React.useState(true)
  const [usersError, setUsersError] = React.useState<string | null>(null)

  const [requests, setRequests] = React.useState<WorkoutChangeRequest[]>([])
  const [requestsLoading, setRequestsLoading] = React.useState(true)

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [weekStart, setWeekStart] = React.useState<Date>(() =>
    startOfWeek(new Date())
  )
  const [workouts, setWorkouts] = React.useState<Workout[]>([])
  const [workoutsLoading, setWorkoutsLoading] = React.useState(false)
  const [workoutsError, setWorkoutsError] = React.useState<string | null>(null)

  const [detailWorkout, setDetailWorkout] = React.useState<Workout | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [formWorkout, setFormWorkout] = React.useState<Workout | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)

  // Fetch users
  React.useEffect(() => {
    let cancelled = false
    fetchAssignedUsers()
      .then((data) => {
        if (cancelled) return
        setUsers(data)
        // Auto-select first user if none selected
        setSelectedId((prev) => prev ?? data[0]?.id ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        setUsersError(
          err instanceof ApiError ? err.message : "Failed to load users"
        )
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch requests
  React.useEffect(() => {
    let cancelled = false
    fetchWorkoutChangeRequests()
      .then((data) => {
        if (cancelled) return
        setRequests(data)
      })
      .finally(() => {
        if (!cancelled) setRequestsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch workouts for selected user
  React.useEffect(() => {
    if (!selectedId) {
      setWorkouts([])
      return
    }
    let cancelled = false
    setWorkoutsLoading(true)
    setWorkoutsError(null)
    fetchUserWorkouts(selectedId, isoDate(weekStart))
      .then((data) => {
        if (cancelled) return
        setWorkouts(data)
      })
      .catch((err) => {
        if (cancelled) return
        setWorkoutsError(
          err instanceof ApiError ? err.message : "Failed to load workouts"
        )
        setWorkouts([])
      })
      .finally(() => {
        if (!cancelled) setWorkoutsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, weekStart, reloadKey])

  // Compute pending request counts per user
  const requestCounts = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of requests) {
      if (r.status === "pending") {
        counts.set(r.userId, (counts.get(r.userId) ?? 0) + 1)
      }
    }
    return counts
  }, [requests])

  function openCreate() {
    setFormWorkout(null)
    setFormOpen(true)
  }

  function handleEdit(workout: Workout) {
    setDetailOpen(false)
    setFormWorkout(workout)
    setFormOpen(true)
  }

  function handleSaved() {
    setReloadKey((n) => n + 1)
  }

  const selectedUser = selectedId
    ? users.find((u) => u.id === selectedId) ?? null
    : null

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          Hey{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your users&apos; training plans and review their requests.
        </p>
      </header>

      {usersError ? (
        <p
          role="alert"
          className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {usersError}
        </p>
      ) : null}

      <div className="grid flex-1 gap-4 lg:grid-cols-[220px_1fr_300px]">
        {/* Left sidebar: Users list */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {usersLoading ? (
              <p className="px-4 text-sm text-muted-foreground">
                Loading users…
              </p>
            ) : users.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">
                No users assigned.
              </p>
            ) : (
              <ScrollArea className="h-full">
                <ul className="flex flex-col gap-1 px-2">
                  {users.map((u) => {
                    const active = u.id === selectedId
                    const count = requestCounts.get(u.id) ?? 0
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(u.id)}
                          className={
                            "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors " +
                            (active
                              ? "bg-muted text-foreground"
                              : "text-foreground/80 hover:bg-muted/60")
                          }
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium">{u.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                          {count > 0 ? (
                            <Badge variant="info" className="shrink-0">
                              {count}
                            </Badge>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Center: Calendar + workouts */}
        <div className="flex flex-col gap-3">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h3 className="text-base font-semibold">
              {selectedUser?.name ?? "Select a user"}
            </h3>
            <Button size="sm" onClick={openCreate} disabled={!selectedId}>
              <Plus /> New workout
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {workoutsError ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {workoutsError}
              </p>
            ) : null}

            {selectedId ? (
              <WeeklyCalendar
                weekStart={weekStart}
                workouts={workouts}
                onChangeWeek={setWeekStart}
                onSelectWorkout={(w) => {
                  setDetailWorkout(w)
                  setDetailOpen(true)
                }}
                loading={workoutsLoading}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Pick a user from the list to view their plan.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              <Pencil className="mr-1 inline size-3 align-text-bottom" />
              Tap a workout to view exercises and edit.
            </p>
          </div>
        </div>

        {/* Right sidebar: Requests */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <ScrollArea className="h-full">
              <div className="px-4">
                <RequestsPanel />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <WorkoutDetailDialog
        workout={detailWorkout}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
      />
      <WorkoutFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        users={users}
        defaultUserId={selectedId ?? undefined}
        workout={formWorkout}
        onSaved={handleSaved}
      />
    </main>
  )
}
