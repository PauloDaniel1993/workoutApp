"use client"

import { Search } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api"
import {
  assignUser,
  fetchOtherAssignedUsers,
  fetchUnassignedUsers,
} from "@/lib/trainer"
import type { AdminUser } from "@/lib/users"
import type { OtherAssignedUser } from "@/lib/trainer"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}

export function AssignUserDialog({ open, onOpenChange, onAssigned }: Props) {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [assigning, setAssigning] = React.useState<Set<string>>(new Set())

  const [otherUsers, setOtherUsers] = React.useState<OtherAssignedUser[]>([])
  const [otherLoading, setOtherLoading] = React.useState(false)
  const [otherError, setOtherError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setOtherUsers([])
      setOtherError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchUnassignedUsers()
      .then((data) => {
        if (cancelled) return
        setUsers(data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof ApiError ? err.message : "Failed to load users"
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    setOtherLoading(true)
    setOtherError(null)
    fetchOtherAssignedUsers()
      .then((data) => {
        if (cancelled) return
        setOtherUsers(data)
      })
      .catch((err) => {
        if (cancelled) return
        setOtherError(
          err instanceof ApiError ? err.message : "Failed to load other users"
        )
      })
      .finally(() => {
        if (!cancelled) setOtherLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  async function handleAssign(userId: string) {
    setAssigning((prev) => new Set(prev).add(userId))
    try {
      await assignUser(userId)
      toast.success("User assigned")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setOtherUsers((prev) => prev.filter((u) => u.id !== userId))
      onAssigned()
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Failed to assign user"
      toast.error("Could not assign user", message)
    } finally {
      setAssigning((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Search and assign users to your training roster.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading users…
            </p>
          ) : error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search.trim()
                ? "No users match your search."
                : "No unassigned users available."}
            </p>
          ) : (
            <ul className="flex flex-col gap-1 pr-2">
              {filtered.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {u.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(u.id)}
                    disabled={assigning.has(u.id)}
                  >
                    {assigning.has(u.id) ? "Assigning…" : "Assign"}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {!loading && (
            <>
              <Separator className="my-3" />
              <div className="pr-2">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned to other trainers
                </h4>
                {otherLoading ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Loading…
                  </p>
                ) : otherError ? (
                  <p className="text-xs text-destructive">{otherError}</p>
                ) : otherUsers.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No users assigned to other trainers.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {otherUsers.map((u) => (
                      <li
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/60"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {u.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </div>
                          {u.userAssignments.length > 0 && (
                            <div className="truncate text-xs text-muted-foreground">
                              Trainer: {u.userAssignments[0].trainer.name}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAssign(u.id)}
                          disabled={assigning.has(u.id)}
                        >
                          {assigning.has(u.id) ? "Assigning…" : "Assign"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
