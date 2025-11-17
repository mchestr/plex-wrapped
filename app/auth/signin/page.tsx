import { getSetupStatus } from "@/actions/setup"
import { redirect } from "next/navigation"
import { SignInPageClient } from "./signin-client"

export default async function SignInPage() {
  // Check setup status server-side before rendering
  const { isComplete } = await getSetupStatus()

  if (!isComplete) {
    redirect("/setup")
  }

  return <SignInPageClient />
}

