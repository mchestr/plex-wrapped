"use client"

import { generatePlexWrapped, getUserPlexWrapped } from "@/actions/users"
import { useEffect, useState, useCallback } from "react"
import { WrappedGeneratingAnimation } from "./wrapped-generating-animation"
import { WrappedGeneratorStatus } from "./wrapped-generator-status"
import { WrappedGeneratorPrompt } from "./wrapped-generator-prompt"
import { useWrappedPolling } from "@/hooks/use-wrapped-polling"

interface WrappedGeneratorProps {
  userId: string
}

export function WrappedGenerator({ userId }: WrappedGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [wrapped, setWrapped] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentYear = new Date().getFullYear()

  const loadWrapped = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)
    try {
      const wrappedData = await getUserPlexWrapped(userId, currentYear)
      setWrapped(wrappedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wrapped")
    } finally {
      setIsLoading(false)
    }
  }, [userId, currentYear])

  useEffect(() => {
    if (userId) {
      loadWrapped()
    } else {
      setIsLoading(false)
    }
  }, [userId, loadWrapped])

  // Poll for wrapped completion when generating
  useWrappedPolling({
    userId,
    year: currentYear,
    isGenerating,
    wrappedStatus: wrapped?.status,
    onStatusChange: (wrappedData) => {
      setWrapped(wrappedData)
      if (wrappedData?.status === "completed" || wrappedData?.status === "failed") {
        setIsGenerating(false)
      }
    },
    onError: (errorMsg) => {
      setError(errorMsg)
      setIsGenerating(false)
    },
  })

  const handleGenerate = async () => {
    if (!userId) return

    setIsGenerating(true)
    setError(null)
    try {
      const result = await generatePlexWrapped(userId, currentYear)
      if (result.success) {
        // Reload wrapped data
        await loadWrapped()
      } else {
        setError(result.error || "Failed to generate wrapped")
        setIsGenerating(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate wrapped")
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return <WrappedGeneratingAnimation year={currentYear} compact />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg
          className="animate-spin h-6 w-6 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    )
  }

  if (wrapped) {
    if (wrapped.status === "generating") {
      return <WrappedGeneratingAnimation year={currentYear} compact />
    }

    if (wrapped.status === "completed" || wrapped.status === "failed") {
      return (
        <WrappedGeneratorStatus
          status={wrapped.status}
          year={currentYear}
          onRegenerate={handleGenerate}
          isRegenerating={isGenerating}
          error={error || wrapped.error}
        />
      )
    }
  }

  return (
    <WrappedGeneratorPrompt
      year={currentYear}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      error={error}
    />
  )
}

