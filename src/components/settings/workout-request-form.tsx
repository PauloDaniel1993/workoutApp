"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api"
import {
  submitWorkoutChangeRequest,
  WORKOUT_CHANGE_REASONS,
  type WorkoutChangeReason,
} from "@/lib/users"

const REASON_LABEL: Record<WorkoutChangeReason, string> = Object.fromEntries(
  WORKOUT_CHANGE_REASONS.map((r) => [r.value, r.label])
) as Record<WorkoutChangeReason, string>

export function WorkoutRequestForm() {
  const [reason, setReason] = React.useState<WorkoutChangeReason>(
    "change_exercises"
  )
  const [message, setMessage] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) {
      setError("Please describe what you'd like to change")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await submitWorkoutChangeRequest(reason, message.trim())
      toast.success(
        "Request sent",
        "Your trainer will review your request shortly."
      )
      setMessage("")
      setReason("change_exercises")
    } catch (e) {
      const m = e instanceof ApiError ? e.message : "Failed to send request"
      setError(m)
      toast.error("Could not send request", m)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request-reason">Reason</Label>
        <Select
          value={reason}
          onValueChange={(v) => setReason(v as WorkoutChangeReason)}
        >
          <SelectTrigger id="request-reason">
            <SelectValue placeholder="Select a reason">
              {(v) =>
                v ? REASON_LABEL[v as WorkoutChangeReason] : "Select a reason"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {WORKOUT_CHANGE_REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request-message">Message</Label>
        <Textarea
          id="request-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Tell your trainer what you'd like to change…"
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-[0.8rem] font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting} className="self-start">
        {submitting ? "Sending…" : "Send request"}
      </Button>
    </form>
  )
}
