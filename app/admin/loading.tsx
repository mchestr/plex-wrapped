import { LoadingScreen } from "@/components/ui/loading-screen"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <LoadingScreen message="Loading Admin Dashboard..." />
    </div>
  )
}
