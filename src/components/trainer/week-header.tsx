"use client"

import { Bell, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WeekNavigation } from "@/components/trainer/week-navigation"
import { formatRange } from "@/lib/workouts"

interface WeekHeaderProps {
  clientName: string
  weekStart: Date
  onChangeWeek: (next: Date) => void
  requestsCount: number
  onAddWorkout: () => void
  onOpenRequests: () => void
}

export function WeekHeader({
  clientName,
  weekStart,
  onChangeWeek,
  requestsCount,
  onAddWorkout,
  onOpenRequests,
}: WeekHeaderProps) {
  return (
    <div className="border-b border-border pb-4 mb-1">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{clientName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenRequests}>
            <Bell aria-hidden="true" />
            Requests
            {requestsCount > 0 && (
              <Badge variant="info">{requestsCount}</Badge>
            )}
          </Button>
          <Button variant="default" size="sm" onClick={onAddWorkout}>
            <Plus aria-hidden="true" />
            Add Workout
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {formatRange(weekStart)}
      </p>

      <div className="mt-2">
        <WeekNavigation weekStart={weekStart} onChangeWeek={onChangeWeek} />
      </div>
    </div>
  )
}
