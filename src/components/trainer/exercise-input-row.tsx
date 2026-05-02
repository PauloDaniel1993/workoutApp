"use client"

import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ExerciseInput } from "@/lib/trainer"

interface Props {
  index: number
  exercise: ExerciseInput
  onChange: (next: ExerciseInput) => void
  onRemove: () => void
  removable: boolean
}

export function ExerciseInputRow({
  index,
  exercise,
  onChange,
  onRemove,
  removable,
}: Props) {
  function patch<K extends keyof ExerciseInput>(key: K, value: ExerciseInput[K]) {
    onChange({ ...exercise, [key]: value })
  }
  const idPrefix = `ex-${index}`

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exercise {index + 1}
        </span>
        {removable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove exercise"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={exercise.name}
            onChange={(e) => patch("name", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-sets`}>Sets</Label>
          <Input
            id={`${idPrefix}-sets`}
            type="number"
            min={1}
            value={exercise.sets}
            onChange={(e) => patch("sets", Number(e.target.value) || 0)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-reps`}>Reps</Label>
          <Input
            id={`${idPrefix}-reps`}
            type="number"
            min={1}
            value={exercise.reps}
            onChange={(e) => patch("reps", Number(e.target.value) || 0)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-weight`}>Weight (kg)</Label>
          <Input
            id={`${idPrefix}-weight`}
            type="number"
            min={0}
            step="0.5"
            value={exercise.weight}
            onChange={(e) => patch("weight", Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-6">
          <Label htmlFor={`${idPrefix}-youtube`}>YouTube URL</Label>
          <Input
            id={`${idPrefix}-youtube`}
            type="url"
            placeholder="https://www.youtube.com/…"
            value={exercise.youtubeUrl}
            onChange={(e) => patch("youtubeUrl", e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
