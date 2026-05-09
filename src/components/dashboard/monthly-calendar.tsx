"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { WorkoutStatusBadge } from "@/components/dashboard/workout-status-badge"
import {
  formatMonth,
  isoDate,
  monthGrid,
  startOfMonth,
  type Workout,
} from "@/lib/workouts"

interface Props {
  monthStart: Date
  workouts: Workout[]
  onChangeMonth: (next: Date) => void
  onSelectWorkout: (workout: Workout) => void
  loading?: boolean
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function MonthlyCalendar({
  monthStart,
  workouts,
  onChangeMonth,
  onSelectWorkout,
  loading,
}: Props) {
  const todayIso = isoDate(new Date())
  const thisMonthIso = isoDate(startOfMonth(new Date()))
  const isThisMonth = isoDate(monthStart) === thisMonthIso

  const byDate = React.useMemo(() => {
    const map = new Map<string, Workout>()
    for (const w of workouts) map.set(w.date, w)
    return map
  }, [workouts])

  const grid = monthGrid(monthStart)
  const currentMonth = monthStart.getMonth()
  const currentYear = monthStart.getFullYear()

  function goToPrevMonth() {
    onChangeMonth(new Date(currentYear, currentMonth - 1, 1))
  }

  function goToNextMonth() {
    onChangeMonth(new Date(currentYear, currentMonth + 1, 1))
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold">{formatMonth(monthStart)}</h2>
          <p className="text-xs text-muted-foreground">
            {isThisMonth ? "This month" : "Month"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={goToPrevMonth}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeMonth(startOfMonth(new Date()))}
            disabled={isThisMonth}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={goToNextMonth}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="bg-card px-1 py-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {name}
          </div>
        ))}

        {grid.map((day) => {
          const dayIso = isoDate(day)
          const workout = byDate.get(dayIso)
          const isToday = dayIso === todayIso
          const inMonth = day.getMonth() === currentMonth && day.getFullYear() === currentYear

          return (
            <div
              key={dayIso}
              className={
                "flex min-h-20 flex-col gap-0.5 bg-card p-1 transition-colors " +
                (!inMonth ? "bg-muted/30" : "")
              }
            >
              <span
                className={
                  "self-end text-xs font-semibold leading-none px-1 py-0.5 " +
                  (isToday
                    ? "rounded-full bg-blue-600 text-white"
                    : !inMonth
                      ? "text-muted-foreground/40"
                      : "")
                }
              >
                {day.getDate()}
              </span>
              {workout ? (
                <button
                  type="button"
                  onClick={() => onSelectWorkout(workout)}
                  className={
                    "flex flex-1 flex-col justify-between rounded-md border p-1.5 text-left text-[10px] leading-tight outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 " +
                    (workout.status === "today"
                      ? "border-blue-500 ring-1 ring-blue-500/30"
                      : "border-transparent")
                  }
                >
                  <span className="font-medium">{workout.name}</span>
                  <WorkoutStatusBadge status={workout.status} />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading workouts…</p>
      ) : null}
    </section>
  )
}
