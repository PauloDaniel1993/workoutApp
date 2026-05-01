import { RolePage } from "@/components/role-page"

export default function TrainerPage() {
  return (
    <RolePage
      title="Trainer Dashboard"
      description="Welcome — you are signed in as a trainer."
      allowedRoles={["trainer"]}
    />
  )
}
