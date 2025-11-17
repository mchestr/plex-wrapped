"use client"

import { generatePlexWrapped } from "@/actions/users"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ConfirmModal } from "./confirm-modal"

interface RegenerateWrappedButtonProps {
  userId: string
  year?: number
  onSuccess?: () => void
}

export function RegenerateWrappedButton({
  userId,
  year = new Date().getFullYear(),
  onSuccess,
}: RegenerateWrappedButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const router = useRouter()

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)
    setShowSuccess(false)

    try {
      const result = await generatePlexWrapped(userId, year)
      if (result.success) {
        onSuccess?.()
        // Force refresh to show updated status
        router.refresh()

        // Show success flash indicator
        setShowSuccess(true)
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)
      } else {
        setError(result.error || "Failed to regenerate wrapped")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate wrapped")
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isRegenerating}
          className={`px-2 py-1 text-white text-xs font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 justify-center ${
            showSuccess
              ? "bg-green-600 hover:bg-green-700 animate-pulse"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
          title="Regenerate wrapped"
        >
          {isRegenerating ? (
            <>
              <svg
                className="animate-spin h-3 w-3"
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
              <span>...</span>
            </>
          ) : showSuccess ? (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </>
          )}
        </button>
        {error && (
          <span className="text-xs text-red-400 truncate" title={error}>
            {error}
          </span>
        )}
        {showSuccess && !error && (
          <span className="text-xs text-green-400 truncate animate-pulse">
            Started!
          </span>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleRegenerate}
        title="Regenerate Wrapped"
        message={`Are you sure you want to regenerate the ${year} wrapped for this user? This will overwrite the existing wrapped.`}
        confirmText="Regenerate"
        cancelText="Cancel"
      />
    </>
  )
}

