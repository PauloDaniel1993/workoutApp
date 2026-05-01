"use client"

import { ExternalLink } from "lucide-react"
import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WorkoutStatusBadge } from "@/components/dashboard/workout-status-badge"
import { ApiError } from "@/lib/api"
import { patchExercise, type Workout } from "@/lib/workouts"

interface Props {
  workout: Workout | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkoutUpdated: (workout: Workout) => void
}

export function ExerciseDetailDialog({
  workout,
  open,
  onOpenChange,
  onWorkoutUpdated,
}: Props) {
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setError(null)
  }, [open])

  if (!workout) {
    return <Dialog open={open} onOpenChange={onOpenChange} />
  }

  const isToday = workout.status === "today"
  const [y, m, d] = workout.date.split("-").map(Number)
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  async function handleToggle(exerciseId: string, next: boolean) {
    if (!workout) return
    setError(null)
    setPendingId(exerciseId)
    try {
      const updated = await patchExercise(workout.id, exerciseId, next)
      onWorkoutUpdated(updated)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to update exercise"
      setError(message)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{workout.name}</DialogTitle>
            <WorkoutStatusBadge status={workout.status} />
          </div>
          <DialogDescription>{dateLabel}</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {workout.exercises.map((ex) => {
            const checkboxId = `ex-${ex.id}`
            return (
              <li
                key={ex.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {isToday ? (
                  <Checkbox
                    id={checkboxId}
                    checked={ex.completed}
                    disabled={pendingId === ex.id}
                    onCheckedChange={(checked) => handleToggle(ex.id, checked)}
                    className="mt-0.5"
                  />
                ) : (
                  <span
                    aria-hidden
                    className={
                      "mt-0.5 inline-block size-4 shrink-0 rounded-[4px] border " +
                      (ex.completed
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-input bg-muted")
                    }
                  />
                )}
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={isToday ? checkboxId : undefined}
                    className={
                      "block text-sm font-medium " +
                      (ex.completed ? "text-muted-foreground line-through" : "")
                    }
                  >
                    {ex.name}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets} × {ex.reps}
                    {ex.weight > 0 ? ` · ${ex.weight} kg` : ""}
                  </p>
                </div>
                {ex.youtubeUrl ? (
                  <a
                    href={ex.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${ex.name} demo on YouTube`}
                    className="mt-0.5 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                ) : null}
              </li>
            )
          })}
        </ul>

        {error ? (
          <p role="alert" className="text-[0.8rem] font-medium text-destructive">
            {error}
          </p>
        ) : null}
        {!isToday ? (
          <p className="text-xs text-muted-foreground">
            Read-only — exercises can only be checked off on the workout day.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
