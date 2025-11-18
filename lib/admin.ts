import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

/**
 * Server-side helper to check if the current user is an admin
 * Redirects to sign-in if not authenticated
 * Returns the session if admin, throws error if not admin
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  if (!session.user.isAdmin) {
    redirect("/")
  }

  return session
}

/**
 * Server-side helper to get admin status without redirecting
 * Returns null if not authenticated, false if not admin, true if admin
 */
export async function getAdminStatus(): Promise<boolean | null> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return session.user.isAdmin
}

