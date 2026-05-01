import { Badge } from "@/components/ui/badge"
import type { WorkoutStatus } from "@/lib/workouts"

const LABELS: Record<WorkoutStatus, string> = {
  completed: "Completed",
  missed: "Missed",
  upcoming: "Upcoming",
  today: "Today",
}

const VARIANTS: Record<
  WorkoutStatus,
  "success" | "destructive" | "muted" | "info"
> = {
  completed: "success",
  missed: "destructive",
  upcoming: "muted",
  today: "info",
}

export function WorkoutStatusBadge({ status }: { status: WorkoutStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}
