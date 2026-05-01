import { AuthTabs } from "@/components/auth/auth-tabs"

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <AuthTabs />
      </div>
    </main>
  )
}
