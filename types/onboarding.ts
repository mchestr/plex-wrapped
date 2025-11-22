export interface OnboardingStep {
  id: number
  title: string
  description: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome",
    description: "Get started with Plex Wrapped",
  },
  {
    id: 2,
    title: "Your Profile",
    description: "Tell us about yourself",
  },
  {
    id: 3,
    title: "How It Works",
    description: "Learn about Plex Wrapped features",
  },
  {
    id: 4,
    title: "You're All Set!",
    description: "Start exploring your wrapped",
  },
]

