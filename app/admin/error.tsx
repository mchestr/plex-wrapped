"use client"

import { useEffect } from "react"
import { UnauthorizedError } from "@/components/admin/shared/unauthorized-error"
import { UnauthenticatedError } from "@/components/admin/shared/unauthenticated-error"

export default function AdminError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("Admin page error:", error)
  }, [error])

  // Check if this is an unauthenticated error
  const isUnauthenticated =
    error.name === "UnauthenticatedError" ||
    error.message === "UNAUTHENTICATED" ||
    error.message.includes("Authentication required")

  if (isUnauthenticated) {
    return <UnauthenticatedError />
  }

  // Check if this is an unauthorized access error
  const isUnauthorized =
    error.name === "UnauthorizedAdminError" ||
    error.message === "UNAUTHORIZED" ||
    error.message === "FORBIDDEN" ||
    error.message.includes("Admin access required") ||
    error.message.includes("not authorized")

  if (isUnauthorized) {
    return <UnauthorizedError />
  }

  // For other errors, show a generic error page
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="relative flex items-center gap-8">
        {/* Rex mascot */}
        <div className="w-24 h-24 relative animate-bounce" style={{ animationDuration: "2s" }}>
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dinosaur body */}
            <ellipse
              cx="100"
              cy="120"
              rx="50"
              ry="40"
              fill="#4ade80"
              className="animate-pulse"
              style={{ animationDuration: "2s" }}
            />
            {/* Dinosaur head */}
            <ellipse
              cx="100"
              cy="70"
              rx="35"
              ry="30"
              fill="#22c55e"
            />
            {/* Eye */}
            <circle
              cx="90"
              cy="65"
              r="5"
              fill="#1e293b"
              className="animate-blink"
              style={{ animationDuration: "3s" }}
            />
            {/* Smile */}
            <path
              d="M 85 75 Q 100 80 115 75"
              stroke="#1e293b"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Tail */}
            <ellipse
              cx="50"
              cy="130"
              rx="25"
              ry="20"
              fill="#4ade80"
              className="animate-wiggle"
              style={{
                animationDuration: "1.5s",
                transformOrigin: "50px 130px"
              }}
            />
            {/* Legs */}
            <ellipse cx="80" cy="160" rx="12" ry="20" fill="#22c55e" />
            <ellipse cx="120" cy="160" rx="12" ry="20" fill="#22c55e" />
            {/* Spikes on back */}
            <path
              d="M 70 100 L 75 80 L 80 100"
              fill="#16a34a"
            />
            <path
              d="M 85 105 L 90 85 L 95 105"
              fill="#16a34a"
            />
            <path
              d="M 100 110 L 105 90 L 110 110"
              fill="#16a34a"
            />
            {/* Little arms */}
            <ellipse cx="75" cy="110" rx="8" ry="12" fill="#22c55e" />
            <ellipse cx="125" cy="110" rx="8" ry="12" fill="#22c55e" />
          </svg>
        </div>

        {/* 500 text */}
        <div className="text-9xl font-black text-white select-none">
          500
        </div>
      </div>
    </div>
  )
}

