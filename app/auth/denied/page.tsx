import { getSetupStatus } from "@/actions/setup"
import { redirect } from "next/navigation"
import { DeniedAccessPageClient } from "./denied-client"

export default async function DeniedAccessPage() {
  // Check setup status server-side before rendering
  const { isComplete } = await getSetupStatus()

  if (!isComplete) {
    redirect("/setup")
  }

  return <DeniedAccessPageClient />
}

