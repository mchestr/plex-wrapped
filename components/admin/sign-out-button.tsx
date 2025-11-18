"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 border border-slate-600 rounded-md text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
    >
      Sign Out
    </button>
  )
}

