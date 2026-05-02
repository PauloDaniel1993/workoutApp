"use client"

import { Pencil, Plus } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WeeklyCalendar } from "@/components/dashboard/weekly-calendar"
import { WorkoutDetailDialog } from "@/components/trainer/workout-detail-dialog"
import { WorkoutFormDialog } from "@/components/trainer/workout-form-dialog"
import { ApiError } from "@/lib/api"
import { fetchUserWorkouts } from "@/lib/trainer"
import type { AdminUser } from "@/lib/users"
import { isoDate, startOfWeek, type Workout } from "@/lib/workouts"

interface Props {
  users: AdminUser[]
}

export function UsersPanel({ users }: Props) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    users[0]?.id ?? null
  )
  const [weekStart, setWeekStart] = React.useState<Date>(() =>
    startOfWeek(new Date())
  )
  const [workouts, setWorkouts] = React.useState<Workout[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [detailWorkout, setDetailWorkout] = React.useState<Workout | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [formWorkout, setFormWorkout] = React.useState<Workout | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)

  React.useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkouts([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchUserWorkouts(selectedId, isoDate(weekStart))
      .then((data) => {
        if (cancelled) return
        setWorkouts(data)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : "Failed to load workouts"
        setError(message)
        setWorkouts([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, weekStart, reloadKey])

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

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users assigned.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {users.map((u) => {
                const active = u.id === selectedId
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      className={
                        "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors " +
                        (active
                          ? "bg-muted text-foreground"
                          : "text-foreground/80 hover:bg-muted/60")
                      }
                    >
                      <div className="font-medium">{u.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">
            {selectedId
              ? users.find((u) => u.id === selectedId)?.name ?? "User"
              : "Select a user"}
          </h3>
          <Button size="sm" onClick={openCreate} disabled={!selectedId}>
            <Plus /> New workout
          </Button>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
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
            loading={loading}
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
    </div>
  )
}
