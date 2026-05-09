"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError } from "@/lib/api"
import { fetchWorkoutChangeRequests, updateRequestStatus } from "@/lib/trainer"
import {
  WORKOUT_CHANGE_REASONS,
  type WorkoutChangeReason,
  type WorkoutChangeRequest,
} from "@/lib/users"

const REASON_LABEL: Record<WorkoutChangeReason, string> = Object.fromEntries(
  WORKOUT_CHANGE_REASONS.map((r) => [r.value, r.label])
) as Record<WorkoutChangeReason, string>

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function sortRequests(list: WorkoutChangeRequest[]): WorkoutChangeRequest[] {
  return [...list].sort((a, b) => {
    const order = { pending: 0, approved: 1, rejected: 2 } as const
    const diff = order[a.status] - order[b.status]
    if (diff !== 0) return diff
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function RequestsPanel() {
  const [requests, setRequests] = React.useState<WorkoutChangeRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetchWorkoutChangeRequests()
      .then((data) => {
        if (cancelled) return
        setRequests(sortRequests(data))
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

  async function handleStatusUpdate(id: string, status: "approved" | "rejected") {
    setSubmitting(id)
    try {
      const updated = await updateRequestStatus(id, status)
      setRequests((prev) => sortRequests(prev.map((r) => (r.id === id ? updated : r))))
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to update request"
      setError(message)
    } finally {
      setSubmitting(null)
    }
  }

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
      {requests.map((r) => {
        const isPending = r.status === "pending"
        const isSubmitting = submitting === r.id

        return (
          <Card
            key={r.id}
            size="sm"
            className={!isPending ? "opacity-60" : undefined}
          >
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{r.userName}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <Badge variant="info">{REASON_LABEL[r.reason]}</Badge>
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "success"
                        : r.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                    className={
                      r.status === "pending"
                        ? "border-amber-500/50 text-amber-700 dark:text-amber-300"
                        : undefined
                    }
                  >
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {r.userEmail} · {formatTime(r.createdAt)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{r.message}</p>
              {isPending ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    disabled={isSubmitting}
                    onClick={() => handleStatusUpdate(r.id, "approved")}
                  >
                    {isSubmitting ? "…" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                    disabled={isSubmitting}
                    onClick={() => handleStatusUpdate(r.id, "rejected")}
                  >
                    {isSubmitting ? "…" : "Reject"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
