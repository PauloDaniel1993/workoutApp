"use client"

import * as React from "react"

import { ExerciseDetailDialog } from "@/components/dashboard/exercise-detail-dialog"
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar"
import { WeeklyCalendar } from "@/components/dashboard/weekly-calendar"
import { useAuth } from "@/contexts/AuthContext"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ApiError } from "@/lib/api"
import {
  fetchWorkouts,
  isoDate,
  monthGrid,
  startOfMonth,
  startOfWeek,
  type Workout,
} from "@/lib/workouts"

export function DashboardContent() {
  const { user } = useAuth()
  const isLargeScreen = useMediaQuery("(min-width: 1024px)")
  const [weekStart, setWeekStart] = React.useState<Date>(() =>
    startOfWeek(new Date())
  )
  const [monthStart, setMonthStart] = React.useState<Date>(() =>
    startOfMonth(new Date())
  )
  const [workouts, setWorkouts] = React.useState<Workout[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    if (isLargeScreen) {
      const grid = monthGrid(monthStart)
      const weekStarts: string[] = []
      for (let i = 0; i < 42; i += 7) {
        weekStarts.push(isoDate(grid[i]))
      }
      Promise.all(weekStarts.map((ws) => fetchWorkouts(ws)))
        .then((results) => {
          if (cancelled) return
          const merged = results.flat()
          const deduped = Array.from(
            new Map(merged.map((w) => [w.id, w])).values()
          )
          setWorkouts(deduped)
        })
        .catch((err) => {
          if (cancelled) return
          const message =
            err instanceof ApiError ? err.message : "Failed to load workouts"
          setError(message)
          setWorkouts([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } else {
      fetchWorkouts(isoDate(weekStart))
        .then((data) => {
          if (cancelled) return
          setWorkouts(data)
        })
        .catch((err) => {
          if (cancelled) return
          const message =
            err instanceof ApiError ? err.message : "Failed to load workouts"
          setError(message)
          setWorkouts([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }
    return () => {
      cancelled = true
    }
  }, [weekStart, monthStart, isLargeScreen])

  const selected = React.useMemo(
    () => workouts.find((w) => w.id === selectedId) ?? null,
    [workouts, selectedId]
  )

  function handleSelect(workout: Workout) {
    setSelectedId(workout.id)
    setDialogOpen(true)
  }

  function handleWorkoutUpdated(updated: Workout) {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          Hey{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLargeScreen
            ? "Here is your monthly training plan. Tap a workout to see the details."
            : "Here is your weekly training plan. Tap a workout to see the details."}
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {isLargeScreen ? (
        <MonthlyCalendar
          monthStart={monthStart}
          workouts={workouts}
          onChangeMonth={setMonthStart}
          onSelectWorkout={handleSelect}
          loading={loading}
        />
      ) : (
        <WeeklyCalendar
          weekStart={weekStart}
          workouts={workouts}
          onChangeWeek={setWeekStart}
          onSelectWorkout={handleSelect}
          loading={loading}
          orientation="vertical"
        />
      )}

      <ExerciseDetailDialog
        workout={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onWorkoutUpdated={handleWorkoutUpdated}
      />
    </main>
  )
}
