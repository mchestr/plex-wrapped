import { redirect } from "next/navigation"
import { getSetupStatus } from "@/actions/setup"
import { SetupWizard } from "@/components/setup-wizard/setup-wizard"

export default async function SetupPage() {
  const { isComplete, currentStep } = await getSetupStatus()

  if (isComplete) {
    redirect("/")
  }

  return <SetupWizard currentStep={currentStep} />
}

