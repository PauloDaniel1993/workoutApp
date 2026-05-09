import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type StatusType =
  | "completed"
  | "missed"
  | "planned"
  | "rest"
  | "needs_review"

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      status: {
        completed: "bg-emerald-500/15 text-emerald-400",
        missed: "bg-red-500/15 text-red-400",
        planned: "bg-indigo-500/15 text-indigo-400",
        rest: "bg-slate-500/15 text-slate-400",
        needs_review: "bg-amber-500/15 text-amber-400",
      },
    },
    defaultVariants: {
      status: "planned",
    },
  }
)

const STATUS_LABELS: Record<StatusType, string> = {
  completed: "Completed",
  missed: "Missed",
  planned: "Planned",
  rest: "Rest",
  needs_review: "Needs Review",
}

interface StatusBadgeProps
  extends Omit<React.ComponentProps<"span">, "children">,
    VariantProps<typeof statusBadgeVariants> {
  status: StatusType
  label?: string
}

function StatusBadge({
  className,
  status,
  label,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {label ?? STATUS_LABELS[status]}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants }
