"use client"

import { getSetupStatus } from "@/actions/setup"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface SetupGuardProps {
  children: React.ReactNode
}

/**
 * SetupGuard ensures that the setup wizard is shown on any route
 * if the website is not setup. It allows access to /setup and /api routes only.
 */
export function SetupGuard({ children }: SetupGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isComplete, setIsComplete] = useState(true)

  useEffect(() => {
    async function checkSetup() {
      try {
        const { isComplete: setupComplete } = await getSetupStatus()
        setIsComplete(setupComplete)

        // Only allow /setup and /api routes when setup is not complete
        // All other routes (including /auth/*) should redirect to /setup
        const isAllowedRoute = pathname.startsWith("/setup") || pathname.startsWith("/api")

        if (!setupComplete && !isAllowedRoute) {
          router.replace("/setup")
          return
        }
      } catch (error) {
        console.error("Error checking setup status:", error)
        // On error, assume setup is complete to avoid blocking the app
        setIsComplete(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkSetup()
  }, [pathname, router])

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return null
  }

  // If setup is not complete and we're on a protected route, don't render children
  // (the redirect will handle navigation)
  const isAllowedRoute = pathname.startsWith("/setup") || pathname.startsWith("/api")
  if (!isComplete && !isAllowedRoute) {
    return null
  }

  return <>{children}</>
}

