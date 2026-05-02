"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError } from "@/lib/api"
import { fetchWorkoutChangeRequests } from "@/lib/trainer"
import {
  WORKOUT_CHANGE_REASONS,
  type WorkoutChangeReason,
  type WorkoutChangeRequest,
} from "@/lib/users"

const REASON_LABEL: Record<WorkoutChangeReason, string> = Object.fromEntries(
  WORKOUT_CHANGE_REASONS.map((r) => [r.value, r.label])
) as Record<WorkoutChangeReason, string>

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function RequestsPanel() {
  const [requests, setRequests] = React.useState<WorkoutChangeRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetchWorkoutChangeRequests()
      .then((data) => {
        if (cancelled) return
        setRequests(data)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : "Failed to load requests"
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading requests…</p>
  }
  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    )
  }
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No workout change requests yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => (
        <Card key={r.id} size="sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{r.userName}</CardTitle>
              <Badge variant="info">{REASON_LABEL[r.reason]}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {r.userEmail} · {formatTime(r.createdAt)}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{r.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
