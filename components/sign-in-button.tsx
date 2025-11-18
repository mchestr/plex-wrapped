"use client"

import { createPlexAuthUrl, createPlexPin } from "@/lib/plex-auth"
import { useEffect, useState } from "react"

interface SignInButtonProps {
  serverName: string
}

export function SignInButton({ serverName }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create a Plex PIN
      const { id, code } = await createPlexPin()

      // Create the authorization URL
      const url = await createPlexAuthUrl(id, code)
      setAuthUrl(url)

      // Show warning transition
      setShowWarning(true)

      // Wait 5 seconds then redirect (enough time to read the warning)
      setTimeout(() => {
        window.location.href = url
      }, 5000)
    } catch (err) {
      console.error("[AUTH] - Error initiating sign in:", err)
      setError(err instanceof Error ? err.message : "Failed to start authentication")
      setIsLoading(false)
      setShowWarning(false)
    }
  }

  // Reset warning if user navigates away or component unmounts
  useEffect(() => {
    return () => {
      setShowWarning(false)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {!showWarning && (
        <>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="px-12 py-6 flex justify-center items-center gap-3 text-white text-xl font-semibold rounded-xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                Preparing...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-13V7h2v2h-2zm0 4v6h2v-6h-2z" />
                </svg>
                Sign in with Plex
              </>
            )}
          </button>

          {error && (
            <div className="w-full max-w-md rounded-lg bg-red-900/30 border border-red-500/50 p-4">
              <p className="text-sm text-red-300 text-center">{error}</p>
            </div>
          )}

          {/* Muted Disclaimer Text */}
          <div className="w-full space-y-2 text-center">
            <p className="text-sm text-slate-400 leading-relaxed">
              Only subscribers on <span className="font-medium text-slate-300">{serverName}</span> will be able to generate a wrapped.
            </p>
            <p className="text-sm text-slate-400">
              No personal information will be saved or stored.
            </p>
          </div>
        </>
      )}

      {/* Device Warning Alert - Shows as transition */}
      {showWarning && (
        <div className="w-full max-w-md rounded-lg bg-purple-900/20 border border-purple-500/30 p-5">
          <div className="flex flex-col items-center gap-3 mb-4">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-purple-200 leading-relaxed text-center">
              You may see a warning, but this is only needed to match your Plex account to a <span className="font-medium text-purple-100">{serverName}</span> subscriber.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-purple-500/20">
            <svg
              className="animate-spin h-4 w-4 text-purple-400"
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
            <p className="text-sm text-purple-300/80">Redirecting to Plex...</p>
          </div>
        </div>
      )}
    </div>
  )
}

