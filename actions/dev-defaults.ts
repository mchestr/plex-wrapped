"use server"

export async function getDevDefaults() {
  // Only expose in development
  if (process.env.NODE_ENV !== "development") {
    return {
      plex: null,
      tautulli: null,
      overseerr: null,
      sonarr: null,
      radarr: null,
      llmProvider: null,
    }
  }

  const plexDefaults: Partial<{
    name: string
    url: string
    token: string
  }> = {}

  const tautulliDefaults: Partial<{
    name: string
    url: string
    apiKey: string
  }> = {}

  const overseerrDefaults: Partial<{
    name: string
    url: string
    apiKey: string
  }> = {}

  const llmProviderDefaults: Partial<{
    provider: "openai"
    apiKey: string
    model: string
  }> = {}

  // Plex defaults
  if (process.env.DEV_PLEX_NAME) plexDefaults.name = process.env.DEV_PLEX_NAME
  if (process.env.DEV_PLEX_URL) plexDefaults.url = process.env.DEV_PLEX_URL
  if (process.env.DEV_PLEX_TOKEN) plexDefaults.token = process.env.DEV_PLEX_TOKEN

  // Tautulli defaults
  if (process.env.DEV_TAUTULLI_NAME) tautulliDefaults.name = process.env.DEV_TAUTULLI_NAME
  if (process.env.DEV_TAUTULLI_URL) tautulliDefaults.url = process.env.DEV_TAUTULLI_URL
  if (process.env.DEV_TAUTULLI_API_KEY) tautulliDefaults.apiKey = process.env.DEV_TAUTULLI_API_KEY

  // Overseerr defaults
  if (process.env.DEV_OVERSEERR_NAME) overseerrDefaults.name = process.env.DEV_OVERSEERR_NAME
  if (process.env.DEV_OVERSEERR_URL) overseerrDefaults.url = process.env.DEV_OVERSEERR_URL
  if (process.env.DEV_OVERSEERR_API_KEY) overseerrDefaults.apiKey = process.env.DEV_OVERSEERR_API_KEY

  if (process.env.DEV_LLM_PROVIDER) llmProviderDefaults.provider = process.env.DEV_LLM_PROVIDER as "openai"
  if (process.env.DEV_LLM_API_KEY) llmProviderDefaults.apiKey = process.env.DEV_LLM_API_KEY
  if (process.env.DEV_LLM_MODEL) llmProviderDefaults.model = process.env.DEV_LLM_MODEL

  const sonarrDefaults: Partial<{
    name: string
    url: string
    apiKey: string
  }> = {}

  const radarrDefaults: Partial<{
    name: string
    url: string
    apiKey: string
  }> = {}

  // Sonarr defaults
  if (process.env.DEV_SONARR_NAME) sonarrDefaults.name = process.env.DEV_SONARR_NAME
  if (process.env.DEV_SONARR_URL) sonarrDefaults.url = process.env.DEV_SONARR_URL
  if (process.env.DEV_SONARR_API_KEY) sonarrDefaults.apiKey = process.env.DEV_SONARR_API_KEY

  // Radarr defaults
  if (process.env.DEV_RADARR_NAME) radarrDefaults.name = process.env.DEV_RADARR_NAME
  if (process.env.DEV_RADARR_URL) radarrDefaults.url = process.env.DEV_RADARR_URL
  if (process.env.DEV_RADARR_API_KEY) radarrDefaults.apiKey = process.env.DEV_RADARR_API_KEY

  return {
    plex: Object.keys(plexDefaults).length > 0 ? plexDefaults : null,
    tautulli: Object.keys(tautulliDefaults).length > 0 ? tautulliDefaults : null,
    overseerr: Object.keys(overseerrDefaults).length > 0 ? overseerrDefaults : null,
    sonarr: Object.keys(sonarrDefaults).length > 0 ? sonarrDefaults : null,
    radarr: Object.keys(radarrDefaults).length > 0 ? radarrDefaults : null,
    llmProvider: Object.keys(llmProviderDefaults).length > 0 ? llmProviderDefaults : null,
  }
}

