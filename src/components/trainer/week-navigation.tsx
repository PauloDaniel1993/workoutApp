"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { addDays, isoDate, startOfWeek } from "@/lib/workouts"

interface WeekNavigationProps {
  weekStart: Date
  onChangeWeek: (next: Date) => void
}

export function WeekNavigation({ weekStart, onChangeWeek }: WeekNavigationProps) {
  const isThisWeek = isoDate(weekStart) === isoDate(startOfWeek(new Date()))

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Previous week"
        onClick={() => onChangeWeek(addDays(weekStart, -7))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChangeWeek(startOfWeek(new Date()))}
        disabled={isThisWeek}
      >
        This week
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next week"
        onClick={() => onChangeWeek(addDays(weekStart, 7))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}
