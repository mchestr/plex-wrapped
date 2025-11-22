"use client"

import { getOnboardingStatus } from "@/actions/onboarding"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface OnboardingGuardProps {
  children: React.ReactNode
}

/**
 * OnboardingGuard ensures that new users complete onboarding before accessing the app.
 * It allows access to /onboarding, /auth, /api, and /setup routes only.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isComplete, setIsComplete] = useState(true)

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const { isComplete: onboardingComplete } = await getOnboardingStatus()
        setIsComplete(onboardingComplete)

        // Allow onboarding, auth, api, and setup routes
        const isAllowedRoute =
          pathname.startsWith("/onboarding") ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api") ||
          pathname.startsWith("/setup") ||
          pathname.startsWith("/invite")

        if (!onboardingComplete && !isAllowedRoute) {
          router.replace("/onboarding")
          return
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
        // On error, assume complete to avoid blocking the app
        setIsComplete(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkOnboarding()
  }, [pathname, router])

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return null
  }

  // If onboarding is not complete and we're on a protected route, don't render children
  // (the redirect will handle navigation)
  const isAllowedRoute =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/invite")
  if (!isComplete && !isAllowedRoute) {
    return null
  }

  return <>{children}</>
}

