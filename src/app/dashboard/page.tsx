import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <DashboardContent />
    </ProtectedRoute>
  )
}
