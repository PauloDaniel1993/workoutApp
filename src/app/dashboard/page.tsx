import { RolePage } from "@/components/role-page"

export default function DashboardPage() {
  return (
    <RolePage
      title="User Dashboard"
      description="Welcome — you are signed in as a user."
      allowedRoles={["user"]}
    />
  )
}
