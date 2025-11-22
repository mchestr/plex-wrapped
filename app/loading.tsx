import { LoadingScreen } from "@/components/ui/loading-screen"

export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <LoadingScreen message="Loading Plex Manager..." />
    </main>
  )
}

