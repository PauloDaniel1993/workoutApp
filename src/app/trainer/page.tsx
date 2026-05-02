import { ProtectedRoute } from "@/components/protected-route"
import { TrainerContent } from "@/components/trainer/trainer-content"

export default function TrainerPage() {
  return (
    <ProtectedRoute allowedRoles={["trainer"]}>
      <TrainerContent />
    </ProtectedRoute>
  )
}
