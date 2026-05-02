"use client"

import { Plus } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExerciseInputRow } from "@/components/trainer/exercise-input-row"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api"
import {
  createTrainerWorkout,
  updateTrainerWorkout,
  type ExerciseInput,
} from "@/lib/trainer"
import type { AdminUser } from "@/lib/users"
import { isoDate, type Workout } from "@/lib/workouts"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: AdminUser[]
  defaultUserId?: string
  workout?: Workout | null
  onSaved: (workout: Workout) => void
}

function newExercise(): ExerciseInput {
  return { name: "", sets: 3, reps: 10, weight: 0, youtubeUrl: "" }
}

export function WorkoutFormDialog({
  open,
  onOpenChange,
  users,
  defaultUserId,
  workout,
  onSaved,
}: Props) {
  const editing = !!workout
  const [userId, setUserId] = React.useState<string>("")
  const [date, setDate] = React.useState<string>(isoDate(new Date()))
  const [name, setName] = React.useState<string>("")
  const [exercises, setExercises] = React.useState<ExerciseInput[]>([
    newExercise(),
  ])
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    if (workout) {
      setUserId(workout.userId)
      setDate(workout.date)
      setName(workout.name)
      setExercises(
        workout.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          youtubeUrl: e.youtubeUrl,
        }))
      )
    } else {
      setUserId(defaultUserId ?? users[0]?.id ?? "")
      setDate(isoDate(new Date()))
      setName("")
      setExercises([newExercise()])
    }
  }, [open, workout, defaultUserId, users])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) return setError("Select a user")
    if (!name.trim()) return setError("Workout name is required")
    if (exercises.length === 0) return setError("Add at least one exercise")
    for (const ex of exercises) {
      if (!ex.name.trim()) return setError("Each exercise needs a name")
      if (!ex.sets || !ex.reps) return setError("Sets and reps are required")
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload = { userId, date, name: name.trim(), exercises }
      const saved = editing && workout
        ? await updateTrainerWorkout(workout.id, payload)
        : await createTrainerWorkout(payload)
      toast.success(
        editing ? "Workout updated" : "Workout created",
        `${saved.name} on ${saved.date}`
      )
      onSaved(saved)
      onOpenChange(false)
    } catch (e) {
      const m = e instanceof ApiError ? e.message : "Failed to save workout"
      setError(m)
      toast.error("Could not save workout", m)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedUser = users.find((u) => u.id === userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit workout" : "Create workout"}</DialogTitle>
          <DialogDescription>
            {editing ? "Adjust the exercises for this workout." : "Plan a new workout for one of your users."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="workout-user">User</Label>
              <Select
                value={userId}
                onValueChange={(v) => setUserId(String(v ?? ""))}
                disabled={editing}
              >
                <SelectTrigger id="workout-user">
                  <SelectValue placeholder="Select a user">
                    {(v) =>
                      v
                        ? users.find((u) => u.id === v)?.name ?? selectedUser?.name ?? "Select a user"
                        : "Select a user"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workout-date">Date</Label>
              <Input
                id="workout-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workout-name">Workout name</Label>
              <Input
                id="workout-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Push Day"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {exercises.map((ex, i) => (
              <ExerciseInputRow
                key={ex.id ?? `new-${i}`}
                index={i}
                exercise={ex}
                onChange={(next) =>
                  setExercises((prev) => prev.map((p, idx) => (idx === i ? next : p)))
                }
                onRemove={() =>
                  setExercises((prev) => prev.filter((_, idx) => idx !== i))
                }
                removable={exercises.length > 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExercises((prev) => [...prev, newExercise()])}
              className="self-start"
            >
              <Plus /> Add exercise
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-[0.8rem] font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create workout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
