import { AdminContent } from "@/components/admin/admin-content"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  )
}
