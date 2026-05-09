"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { UserFormDialog } from "@/components/admin/user-form-dialog"
import { useAuth, type UserRole } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/api"
import {
  deleteAdminUser,
  fetchAdminStats,
  fetchAdminUsers,
  type AdminStats,
  type AdminUser,
} from "@/lib/users"

const ROLE_VARIANT: Record<UserRole, "info" | "muted" | "destructive"> = {
  admin: "destructive",
  trainer: "info",
  user: "muted",
}

function formatDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AdminContent() {
  const { user: me } = useAuth()
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [stats, setStats] = React.useState<AdminStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<AdminUser | null>(
    null
  )
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    Promise.all([fetchAdminUsers(), fetchAdminStats()])
      .then(([u, s]) => {
        if (cancelled) return
        setUsers(u)
        setStats(s)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : "Failed to load admin data"
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function openCreate() {
    setEditingUser(null)
    setFormOpen(true)
  }

  function openEdit(u: AdminUser) {
    setEditingUser(u)
    setFormOpen(true)
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteAdminUser(pendingDelete.id)
      toast.success("User deleted", pendingDelete.email)
      setPendingDelete(null)
      setReloadKey((n) => n + 1)
    } catch (e) {
      const m = e instanceof ApiError ? e.message : "Failed to delete user"
      toast.error("Could not delete user", m)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage users and view system-wide stats.
        </p>
      </header>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats?.totalEndUsers ?? 0} loading={loading} />
        <StatCard label="Trainers" value={stats?.totalTrainers ?? 0} loading={loading} />
        <StatCard label="Admins" value={stats?.totalAdmins ?? 0} loading={loading} />
        <StatCard label="Workouts" value={stats?.totalWorkouts ?? 0} loading={loading} />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>All accounts in the system.</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus /> New user
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isMe = me?.id === u.id
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Edit ${u.name}`}
                            onClick={() => openEdit(u)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            aria-label={`Delete ${u.name}`}
                            disabled={isMe}
                            onClick={() => setPendingDelete(u)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSaved={() => setReloadKey((n) => n + 1)}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This permanently removes ${pendingDelete.name} (${pendingDelete.email}).`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number
  loading: boolean
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{loading ? "—" : value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
