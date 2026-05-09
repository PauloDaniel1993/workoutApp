"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { Workout } from "@/lib/workouts"

interface WeeklyStatsProps {
  workouts: Workout[]
  requestsCount: number
}

interface StatItem {
  label: string
  count: number
  accent: string
}

export function WeeklyStats({
  workouts,
  requestsCount,
}: WeeklyStatsProps) {
  const stats = React.useMemo<StatItem[]>(() => {
    const completed = workouts.filter(
      (w) => w.status === "completed" || w.status === "today"
    ).length
    const missed = workouts.filter((w) => w.status === "missed").length
    const planned = workouts.filter((w) => w.status === "upcoming").length
    const rest = 7 - workouts.length

    return [
      { label: "Completed", count: completed, accent: "border-emerald-500" },
      { label: "Missed", count: missed, accent: "border-red-500" },
      { label: "Planned", count: planned, accent: "border-indigo-500" },
      { label: "Rest", count: rest, accent: "border-slate-400" },
      { label: "Requests", count: requestsCount, accent: "border-amber-500" },
    ]
  }, [workouts, requestsCount])

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((item) => (
        <div
          key={item.label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border bg-card/50 px-3 py-2 text-sm",
            "border-l-2",
            item.accent
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </span>
          <span className="text-base font-bold tabular-nums">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  )
}
