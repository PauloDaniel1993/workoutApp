"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export function Header() {
  const { user, status, logout } = useAuth()

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold">
          Exercise
        </Link>
        <div className="flex items-center gap-3">
          {status === "authenticated" && user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.name}{" "}
                <span className="text-xs uppercase tracking-wide">
                  ({user.role})
                </span>
              </span>
              <Button size="sm" variant="outline" onClick={logout}>
                Log out
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
