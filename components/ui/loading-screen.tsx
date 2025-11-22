import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

interface LoadingScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

export function LoadingScreen({ className, message = "Loading...", ...props }: LoadingScreenProps) {
  return (
    <div className={cn("min-h-[50vh] flex flex-col items-center justify-center gap-4", className)} {...props}>
      <LoadingSpinner size="lg" />
      {message && <p className="text-slate-400 animate-pulse">{message}</p>}
    </div>
  )
}

