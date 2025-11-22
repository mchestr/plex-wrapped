"use client"

import { completeOnboarding } from "@/actions/onboarding"
import { ONBOARDING_STEPS } from "@/types/onboarding"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FinalStep, HowItWorksStep, ProfileStep, WelcomeStep } from "./onboarding-steps"
import { SpaceBackground } from "@/components/setup/setup-wizard/space-background"
import { SuccessAnimation } from "@/components/setup/setup-wizard/success-animation"
import { FinalSuccessAnimation } from "@/components/setup/setup-wizard/final-success-animation"

interface OnboardingWizardProps {
  currentStep: number
}

export function OnboardingWizard({ currentStep: initialStep }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showFinalSuccess, setShowFinalSuccess] = useState(false)

  const handleStepComplete = () => {
    const isFinalStep = currentStep === ONBOARDING_STEPS.length
    if (isFinalStep) {
      setShowFinalSuccess(true)
    } else if (currentStep < ONBOARDING_STEPS.length) {
      setShowSuccess(true)
    }
  }

  const handleSuccessComplete = () => {
    setShowSuccess(false)
    setCurrentStep(currentStep + 1)
  }

  const handleFinalSuccessComplete = async () => {
    // Mark onboarding as complete in the database
    await completeOnboarding()
    // Redirect to home page
    router.push("/")
    router.refresh()
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onComplete={handleStepComplete} />
      case 2:
        return <ProfileStep onComplete={handleStepComplete} onBack={handleBack} />
      case 3:
        return <HowItWorksStep onComplete={handleStepComplete} onBack={handleBack} />
      case 4:
        return <FinalStep onComplete={handleStepComplete} onBack={handleBack} />
      default:
        return <div className="text-white">Step {currentStep} - Coming soon</div>
    }
  }

  return (
    <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      <SpaceBackground />

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
        {showFinalSuccess && <FinalSuccessAnimation onComplete={handleFinalSuccessComplete} />}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome to Plex Wrapped
          </h1>
          <p className="text-slate-300 text-lg">Let&apos;s get you started</p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <nav aria-label="Progress">
            <ol className="flex items-start gap-4">
              {ONBOARDING_STEPS.map((step, index) => (
                <li key={step.id} className="relative flex-1">
                  {index !== ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`absolute top-4 left-8 right-0 h-0.5 transition-colors duration-300 ${
                        step.id < currentStep
                          ? "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                          : "bg-slate-700/50"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex flex-col items-start">
                    <div className="flex items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                          step.id < currentStep
                            ? "border-cyan-400 bg-gradient-to-br from-cyan-400 to-purple-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                            : step.id === currentStep
                            ? "border-cyan-400 bg-transparent shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                            : "border-slate-600 bg-slate-800/50"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <svg
                            className="h-5 w-5 text-slate-900"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              step.id === currentStep
                                ? "text-cyan-400"
                                : "text-slate-400"
                            }`}
                          >
                            {step.id}
                          </span>
                        )}
                      </motion.div>
                    </div>
                    <div className="mt-2 min-w-0">
                      <p
                        className={`text-sm font-medium transition-colors ${
                          step.id <= currentStep
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900/90 border border-cyan-400/20 shadow-2xl rounded-lg p-6"
            style={{ backdropFilter: "blur(8px)" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

