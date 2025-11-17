import { getUserPlexWrapped } from "@/actions/users"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface UseWrappedPollingProps {
  userId: string
  year: number
  isGenerating: boolean
  wrappedStatus?: string | null
  onStatusChange: (wrapped: any) => void
  onError: (error: string) => void
}

/**
 * Hook to poll for wrapped completion status
 */
export function useWrappedPolling({
  userId,
  year,
  isGenerating,
  wrappedStatus,
  onStatusChange,
  onError,
}: UseWrappedPollingProps) {
  const router = useRouter()

  useEffect(() => {
    if (!userId || (!isGenerating && wrappedStatus !== "generating")) {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const wrappedData = await getUserPlexWrapped(userId, year)
        onStatusChange(wrappedData)

        if (wrappedData?.status === "completed") {
          clearInterval(pollInterval)
          // Navigate to wrapped page
          router.push("/wrapped")
        } else if (wrappedData?.status === "failed") {
          clearInterval(pollInterval)
          onError(wrappedData.error || "Failed to generate wrapped")
        }
      } catch (err) {
        console.error("Error polling wrapped status:", err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [userId, isGenerating, wrappedStatus, year, router, onStatusChange, onError])
}

