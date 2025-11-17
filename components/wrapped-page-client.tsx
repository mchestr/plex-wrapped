"use client"

import { getUserPlexWrapped } from "@/actions/users"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { WrappedGeneratingAnimation } from "./wrapped-generating-animation"

interface WrappedPageClientProps {
  userId: string
  year: number
  initialStatus: string
}

export function WrappedPageClient({ userId, year, initialStatus }: WrappedPageClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    if (status !== "generating") {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const wrappedData = await getUserPlexWrapped(userId, year)
        setStatus(wrappedData?.status || "generating")

        if (wrappedData?.status === "completed") {
          clearInterval(pollInterval)
          // Refresh the page to show the completed wrapped
          router.refresh()
        } else if (wrappedData?.status === "failed") {
          clearInterval(pollInterval)
          // Refresh to show error state
          router.refresh()
        }
      } catch (err) {
        console.error("Error polling wrapped status:", err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [userId, year, status, router])

  if (status === "generating") {
    return <WrappedGeneratingAnimation year={year} />
  }

  return null
}

