"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/api"
import { changeEmail } from "@/lib/users"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ChangeEmailForm() {
  const { user } = useAuth()
  const [newEmail, setNewEmail] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  function validate(): string | null {
    if (!EMAIL_RE.test(newEmail)) return "Please enter a valid email"
    if (!currentPassword) return "Current password is required"
    return null
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await changeEmail(newEmail, currentPassword)
      toast.success("Email updated", `Your email is now ${newEmail}`)
      setNewEmail("")
      setCurrentPassword("")
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Failed to update email"
      setError(message)
      toast.error("Could not update email", message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="current-email">Current email</Label>
        <Input
          id="current-email"
          type="email"
          value={user?.email ?? ""}
          disabled
          readOnly
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-email">New email</Label>
        <Input
          id="new-email"
          type="email"
          autoComplete="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password-email">Current password</Label>
        <Input
          id="confirm-password-email"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-[0.8rem] font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting} className="self-start">
        {submitting ? "Updating…" : "Update email"}
      </Button>
    </form>
  )
}
