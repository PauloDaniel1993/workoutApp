"use client"

import { Settings } from "lucide-react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth, type UserRole } from "@/contexts/AuthContext"

const NAV_LINKS: Record<UserRole, { href: string; label: string }[]> = {
  user: [{ href: "/dashboard", label: "Workouts" }],
  trainer: [{ href: "/trainer", label: "Trainer" }],
  admin: [{ href: "/admin", label: "Admin" }],
}

export function Header() {
  const { user, status, logout } = useAuth()
  const links = user ? NAV_LINKS[user.role] : []

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold">
            Exercise
          </Link>
          {status === "authenticated" ? (
            <nav className="flex items-center gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {status === "authenticated" && user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}{" "}
                <span className="text-xs uppercase tracking-wide">
                  ({user.role})
                </span>
              </span>
              {user.role === "user" ? (
                <Link
                  href="/dashboard/settings"
                  aria-label="Settings"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon-sm",
                  })}
                >
                  <Settings />
                </Link>
              ) : null}
              <ThemeToggle />
              <Button size="sm" variant="outline" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <ThemeToggle />
          )}
        </div>
      </div>
    </header>
  )
}
