"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import type { UserRole } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/api"
import {
  createAdminUser,
  updateAdminUser,
  type AdminUser,
} from "@/lib/users"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: AdminUser | null
  onSaved: (user: AdminUser) => void
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "trainer", label: "Trainer" },
  { value: "admin", label: "Admin" },
]

const ROLE_LABEL: Record<UserRole, string> = {
  user: "User",
  trainer: "Trainer",
  admin: "Admin",
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: Props) {
  const editing = !!user
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("user")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    setPassword("")
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
    } else {
      setName("")
      setEmail("")
      setRole("user")
    }
  }, [open, user])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      let saved: AdminUser
      if (editing && user) {
        saved = await updateAdminUser(user.id, { name, email, role })
        toast.success("User updated", saved.email)
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters")
          setSubmitting(false)
          return
        }
        saved = await createAdminUser({ name, email, password, role })
        toast.success("User created", saved.email)
      }
      onSaved(saved)
      onOpenChange(false)
    } catch (e) {
      const m = e instanceof ApiError ? e.message : "Failed to save user"
      setError(m)
      toast.error("Could not save user", m)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the user's profile details."
              : "Add a new account to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!editing ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole((v ?? "user") as UserRole)}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select a role">
                  {(v) => (v ? ROLE_LABEL[v as UserRole] : "Select a role")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p role="alert" className="text-[0.8rem] font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
