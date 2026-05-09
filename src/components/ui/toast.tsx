"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const toastManager = ToastPrimitive.createToastManager()

interface ToastOptions {
  title: string
  description?: string
  type?: "success" | "error" | "info"
  duration?: number
}

export const toast = {
  success(title: string, description?: string) {
    toastManager.add({ title, description, type: "success" })
  },
  error(title: string, description?: string) {
    toastManager.add({ title, description, type: "error" })
  },
  info(title: string, description?: string) {
    toastManager.add({ title, description, type: "info" })
  },
  show(opts: ToastOptions) {
    toastManager.add({
      title: opts.title,
      description: opts.description,
      type: opts.type ?? "info",
      timeout: opts.duration,
    })
  },
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()
  return toasts.map((t) => {
    const tone =
      t.type === "success"
        ? "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100"
        : t.type === "error"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-border bg-background text-foreground"
    return (
      <ToastPrimitive.Root
        key={t.id}
        toast={t}
        className={cn(
          "group pointer-events-auto relative w-72 rounded-lg border p-3 pr-8 shadow-md outline-none",
          "data-[starting-style]:translate-x-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-x-2 data-[ending-style]:opacity-0",
          "transition-all duration-200",
          tone
        )}
      >
        <ToastPrimitive.Title className="text-sm font-semibold leading-tight" />
        {t.description ? (
          <ToastPrimitive.Description className="mt-0.5 text-xs opacity-90" />
        ) : null}
        <ToastPrimitive.Close
          aria-label="Close"
          className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-md text-current/70 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    )
  })
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 outline-none">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}
