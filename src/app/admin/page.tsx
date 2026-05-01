import { RolePage } from "@/components/role-page"

export default function AdminPage() {
  return (
    <RolePage
      title="Admin Dashboard"
      description="Welcome — you are signed in as an admin."
      allowedRoles={["admin"]}
    />
  )
}
