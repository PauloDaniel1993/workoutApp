"use client"

import { Eye, Pencil, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WorkoutStatusBadge } from "@/components/dashboard/workout-status-badge"
import { startOfDay, type Workout } from "@/lib/workouts"

interface WorkoutCardProps {
  day: Date
  workout: Workout
  onView: () => void
  onEdit: () => void
  onReschedule?: () => void
}

export function WorkoutCard({
  day,
  workout,
  onView,
  onEdit,
  onReschedule,
}: WorkoutCardProps) {
  const isToday =
    startOfDay(day).getTime() === startOfDay(new Date()).getTime()
  const isMissed = workout.status === "missed"
  const dayName = day
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase()
  const dayNumber = day.getDate()
  const exerciseCount = workout.exercises.length

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm",
        "hover:border-primary/30 hover:shadow-md transition-all",
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        isToday && "border-primary/30 ring-1 ring-primary/20"
      )}
    >
      {/* Day name + number */}
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

      {/* Workout name */}
      <h3 className="font-medium text-foreground">{workout.name}</h3>

      {/* Status badge */}
      <div>
        <WorkoutStatusBadge status={workout.status} />
      </div>

      {/* Exercise count */}
      <p className="text-sm text-muted-foreground">
        {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
      </p>

      {/* Missed explanation */}
      {isMissed && (
        <p className="text-xs text-muted-foreground">
          Client did not complete
        </p>
      )}

      {/* Action buttons */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        {isMissed && onReschedule ? (
          <Button variant="outline" size="sm" onClick={onReschedule}>
            <RotateCcw aria-hidden="true" />
            Reschedule
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye aria-hidden="true" />
            View
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </Button>
      </div>
    </div>
  )
}
