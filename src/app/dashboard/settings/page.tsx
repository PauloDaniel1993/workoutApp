import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChangeEmailForm } from "@/components/settings/change-email-form"
import { ChangePasswordForm } from "@/components/settings/change-password-form"
import { WorkoutRequestForm } from "@/components/settings/workout-request-form"
import { ProtectedRoute } from "@/components/protected-route"

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and request workout changes.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Use a strong password you don&apos;t use elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Change email</CardTitle>
            <CardDescription>
              We&apos;ll use this address for sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangeEmailForm />
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Request a workout change</CardTitle>
            <CardDescription>
              Send a note to your trainer with what you&apos;d like to adjust.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkoutRequestForm />
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  )
}
