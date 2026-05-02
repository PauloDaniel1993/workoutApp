"use client"

import { ExternalLink, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WorkoutStatusBadge } from "@/components/dashboard/workout-status-badge"
import type { Workout } from "@/lib/workouts"

interface Props {
  workout: Workout | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (workout: Workout) => void
}

export function WorkoutDetailDialog({
  workout,
  open,
  onOpenChange,
  onEdit,
}: Props) {
  if (!workout) return <Dialog open={open} onOpenChange={onOpenChange} />

  const [y, m, d] = workout.date.split("-").map(Number)
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

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
          {workout.exercises.map((ex) => (
            <li key={ex.id} className="flex items-start gap-3 rounded-lg border p-3">
              <span
                aria-hidden
                className={
                  "mt-0.5 inline-block size-4 shrink-0 rounded-[4px] border " +
                  (ex.completed ? "border-emerald-600 bg-emerald-600" : "border-input bg-muted")
                }
              />
              <div className="min-w-0 flex-1">
                <p className={"text-sm font-medium " + (ex.completed ? "text-muted-foreground line-through" : "")}>
                  {ex.name}
                </p>
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
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onEdit(workout)}>
            <Pencil /> Edit workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
