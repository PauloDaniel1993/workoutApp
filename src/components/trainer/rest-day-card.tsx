"use client"

import { cn } from "@/lib/utils"
import { startOfDay } from "@/lib/workouts"

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

interface RestDayCardProps {
  day: Date
}

export function RestDayCard({ day }: RestDayCardProps) {
  const isToday =
    startOfDay(day).getTime() === startOfDay(new Date()).getTime()
  const dayIndex = (day.getDay() + 6) % 7
  const dayName = DAY_NAMES[dayIndex]
  const dayNumber = day.getDate()

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 p-4"
      )}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {dayName}
        </span>
        <span
          className={cn(
            "text-lg font-bold leading-tight",
            isToday ? "text-blue-600 dark:text-blue-400" : "text-foreground"
          )}
        >
          {dayNumber}
        </span>
      </div>
      <span className="text-sm font-medium text-muted-foreground">
        Rest Day
      </span>
      <span className="text-xs text-muted-foreground/60">
        No workout scheduled
      </span>
    </div>
  )
}
