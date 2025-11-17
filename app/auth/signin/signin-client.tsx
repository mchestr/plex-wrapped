"use client"

import { useState } from "react"
import { createPlexPin, createPlexAuthUrl } from "@/lib/plex-auth"

export function SignInPageClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create a Plex PIN
      const { id, code } = await createPlexPin()

      // Create the authorization URL
      const authUrl = await createPlexAuthUrl(id, code)

      // Redirect to Plex authorization page
      window.location.href = authUrl
    } catch (err) {
      console.error("[AUTH] - Error initiating sign in:", err)
      setError(err instanceof Error ? err.message : "Failed to start authentication")
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="z-10 max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">
            Sign in to Plex Wrapped
          </h1>
          <p className="text-center text-slate-400 mb-8">
            Sign in with your Plex account to access the admin dashboard
          </p>

          {error && (
            <div className="mb-6 rounded-md bg-red-900/30 border border-red-500/50 p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Redirecting to Plex...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
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

          <p className="mt-6 text-xs text-center text-slate-400">
            You will be redirected to Plex to authorize this application
          </p>
        </div>
      </div>
    </main>
  )
}

