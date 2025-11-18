export interface SetupStep {
  id: number
  title: string
  description: string
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 1,
    title: "Plex Server",
    description: "Configure your Plex server connection",
  },
  {
    id: 2,
    title: "Tautulli",
    description: "Configure your Tautulli API connection",
  },
  {
    id: 3,
    title: "Overseerr",
    description: "Configure your Overseerr API connection",
  },
  {
    id: 4,
    title: "AI Provider",
    description: "Configure OpenAI for AI features",
  },
]

