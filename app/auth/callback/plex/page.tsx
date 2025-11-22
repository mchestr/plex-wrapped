import { getSetupStatus } from "@/actions/setup"
import { redirect } from "next/navigation"
import { PlexCallbackPageClient } from "@/app/auth/callback/plex/callback-client"

export const dynamic = 'force-dynamic'

export default async function PlexCallbackPage() {
  // Check setup status server-side before rendering
  const { isComplete } = await getSetupStatus()

  if (!isComplete) {
    redirect("/setup")
  }

  return <PlexCallbackPageClient />
}

