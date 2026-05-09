"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { WorkoutStatusBadge } from "@/components/dashboard/workout-status-badge"
import {
  addDays,
  formatRange,
  isoDate,
  startOfWeek,
  weekDays,
  type Workout,
} from "@/lib/workouts"

interface Props {
  weekStart: Date
  workouts: Workout[]
  onChangeWeek: (next: Date) => void
  onSelectWorkout: (workout: Workout) => void
  loading?: boolean
  orientation?: "horizontal" | "vertical"
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function WeeklyCalendar({
  weekStart,
  workouts,
  onChangeWeek,
  onSelectWorkout,
  loading,
  orientation = "horizontal",
}: Props) {
  const vertical = orientation === "vertical"
  const todayIso = isoDate(new Date())
  const thisWeekIso = isoDate(startOfWeek(new Date()))
  const isThisWeek = isoDate(weekStart) === thisWeekIso

  const byDate = React.useMemo(() => {
    const map = new Map<string, Workout>()
    for (const w of workouts) map.set(w.date, w)
    return map
  }, [workouts])

  const days = weekDays(weekStart)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold">{formatRange(weekStart)}</h2>
          <p className="text-xs text-muted-foreground">
            {isThisWeek ? "This week" : "Week"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous week"
            onClick={() => onChangeWeek(addDays(weekStart, -7))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeWeek(startOfWeek(new Date()))}
            disabled={isThisWeek}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next week"
            onClick={() => onChangeWeek(addDays(weekStart, 7))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {vertical ? (
        <ul className="flex flex-col gap-2">
          {days.map((day) => {
            const dayIso = isoDate(day)
            const workout = byDate.get(dayIso)
            const isToday = dayIso === todayIso
            return (
              <li key={dayIso} className="flex items-stretch gap-3">
                <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border bg-card py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {DAY_NAMES[(day.getDay() + 6) % 7]}
                  </span>
                  <span
                    className={
                      "text-lg font-semibold leading-tight " +
                      (isToday ? "text-blue-600 dark:text-blue-400" : "")
                    }
                  >
                    {day.getDate()}
                  </span>
                </div>
                {workout ? (
                  <button
                    type="button"
                    onClick={() => onSelectWorkout(workout)}
                    className={
                      "group flex flex-1 items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left text-sm shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 " +
                      (workout.status === "today"
                        ? "border-blue-500 ring-1 ring-blue-500/30"
                        : "")
                    }
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-medium leading-tight">
                        {workout.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {workout.exercises.length} exercise
                        {workout.exercises.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <WorkoutStatusBadge status={workout.status} />
                  </button>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                    Rest day
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <ScrollArea className="w-full">
          <ul className="flex gap-3 pb-3">
            {days.map((day) => {
              const dayIso = isoDate(day)
              const workout = byDate.get(dayIso)
              const isToday = dayIso === todayIso
              return (
                <li
                  key={dayIso}
                  className="flex w-40 shrink-0 flex-col gap-2 sm:w-44"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {DAY_NAMES[(day.getDay() + 6) % 7]}
                    </span>
                    <span
                      className={
                        "text-sm font-semibold " +
                        (isToday ? "text-blue-600 dark:text-blue-400" : "")
                      }
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  {workout ? (
                    <button
                      type="button"
                      onClick={() => onSelectWorkout(workout)}
                      className={
                        "group flex h-full flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left text-sm shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 " +
                        (workout.status === "today"
                          ? "border-blue-500 ring-1 ring-blue-500/30"
                          : "")
                      }
                    >
                      <WorkoutStatusBadge status={workout.status} />
                      <span className="font-medium leading-tight">
                        {workout.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {workout.exercises.length} exercise
                        {workout.exercises.length === 1 ? "" : "s"}
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-full min-h-24 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                      Rest day
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading workouts…</p>
      ) : null}
    </section>
  )
}
