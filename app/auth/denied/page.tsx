import { getSetupStatus } from "@/actions/setup"
import { redirect } from "next/navigation"
import { DeniedAccessPageClient } from "@/app/auth/denied/denied-client"

export const dynamic = 'force-dynamic'

export default async function DeniedAccessPage() {
  // Check setup status server-side before rendering
  const { isComplete } = await getSetupStatus()

  if (!isComplete) {
    redirect("/setup")
  }

  return <DeniedAccessPageClient />
}

