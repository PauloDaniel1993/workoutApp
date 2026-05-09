"use client"

import { ChevronDown, Plus, User } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AdminUser } from "@/lib/users"

interface ClientSelectorProps {
  clients: AdminUser[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
}

export function ClientSelector({
  clients,
  selectedId,
  onSelect,
  onAdd,
}: ClientSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const selectedClient = selectedId
    ? clients.find((c) => c.id === selectedId) ?? null
    : null

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  function handleSelect(id: string) {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Client
      </label>
      <div className="flex items-center gap-2">
        <div ref={triggerRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              "bg-card text-foreground",
              "hover:bg-muted",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            )}
          >
            <span className="min-w-0 truncate text-left">
              {selectedClient ? (
                selectedClient.name
              ) : (
                <span className="text-muted-foreground">Select a client</span>
              )}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>

          {open ? (
            <div
              ref={menuRef}
              role="listbox"
              className={cn(
                "absolute left-0 z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-lg border bg-popover shadow-lg",
                "max-h-60 overflow-y-auto"
              )}
            >
              {clients.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-6 text-center text-sm text-muted-foreground">
                  <User className="size-4 shrink-0" />
                  <span>No clients assigned</span>
                </div>
              ) : (
                clients.map((client) => {
                  const isSelected = client.id === selectedId
                  return (
                    <div
                      key={client.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(client.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleSelect(client.id)
                        }
                      }}
                      tabIndex={0}
                      className={cn(
                        "flex cursor-pointer flex-col px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "bg-muted text-foreground"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      <span className="font-medium">{client.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {client.email}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={onAdd}
          className="shrink-0"
        >
          <Plus className="size-4" />
          <span>Add Client</span>
        </Button>
      </div>
    </div>
  )
}
