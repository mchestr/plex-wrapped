"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { getPlexAuthToken } from "@/lib/plex-auth"
import { checkServerAccess } from "@/actions/auth"

export function PlexCallbackPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Checking authorization...")

  useEffect(() => {
    const authenticate = async () => {
      const pinId = searchParams.get("plexPinId")

      if (!pinId) {
        setError("No PIN ID received from Plex")
        return
      }

      setStatus("Waiting for authorization...")

      // Poll for the auth token (user needs to authorize on Plex)
      const maxAttempts = 60 // 5 minutes max (5 second intervals)
      let attempts = 0

      const pollForToken = async (): Promise<void> => {
        attempts++

        try {
          const authToken = await getPlexAuthToken(pinId)

          if (authToken) {
            setStatus("Checking server access...")

            // Check if user has access to the server before signing in
            const accessCheck = await checkServerAccess(authToken)

            if (!accessCheck.hasAccess) {
              router.push("/auth/denied")
              return
            }

            setStatus("Signing you in...")

            // Sign in with NextAuth using the token
            const result = await signIn("plex", {
              authToken,
              redirect: false,
            })

            if (result?.ok) {
              router.push("/")
              router.refresh()
            } else {
              setError(result?.error || "Failed to sign in")
            }
          } else if (attempts < maxAttempts) {
            // Continue polling
            setTimeout(pollForToken, 5000) // Poll every 5 seconds
          } else {
            setError("Authorization timed out. Please try again.")
          }
        } catch (err) {
          console.error("[AUTH] - Error polling for token:", err)
          setError(err instanceof Error ? err.message : "Failed to authenticate")
        }
      }

      // Start polling
      pollForToken()
    }

    authenticate()
  }, [searchParams, router])

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="z-10 max-w-md w-full">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/50 rounded-lg p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-center mb-4 text-red-400">
              Authentication Error
            </h1>
            <p className="text-center text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="z-10 max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-cyan-400 mb-4"
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
            <p className="text-center text-slate-300 mb-2">{status}</p>
            <p className="text-center text-sm text-slate-400 mt-4">
              Please complete authorization on the Plex page if you haven&apos;t already.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

