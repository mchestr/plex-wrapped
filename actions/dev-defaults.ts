"use server"

export async function getDevDefaults() {
  // Only expose in development
  if (process.env.NODE_ENV !== "development") {
    return {
      plex: null,
      tautulli: null,
      overseerr: null,
      llmProvider: null,
    }
  }

  const plexDefaults: Partial<{
    name: string
    hostname: string
    port: number
    protocol: "http" | "https"
    token: string
  }> = {}

  const tautulliDefaults: Partial<{
    name: string
    hostname: string
    port: number
    protocol: "http" | "https"
    apiKey: string
  }> = {}

  const overseerrDefaults: Partial<{
    name: string
    hostname: string
    port: number
    protocol: "http" | "https"
    apiKey: string
  }> = {}

  const llmProviderDefaults: Partial<{
    provider: "openai" | "openrouter"
    apiKey: string
    model: string
  }> = {}

  // Only include values that are actually set
  if (process.env.DEV_PLEX_NAME) plexDefaults.name = process.env.DEV_PLEX_NAME
  if (process.env.DEV_PLEX_HOSTNAME) plexDefaults.hostname = process.env.DEV_PLEX_HOSTNAME
  if (process.env.DEV_PLEX_PORT) plexDefaults.port = parseInt(process.env.DEV_PLEX_PORT, 10)
  if (process.env.DEV_PLEX_PROTOCOL) plexDefaults.protocol = process.env.DEV_PLEX_PROTOCOL as "http" | "https"
  if (process.env.DEV_PLEX_TOKEN) plexDefaults.token = process.env.DEV_PLEX_TOKEN

  if (process.env.DEV_TAUTULLI_NAME) tautulliDefaults.name = process.env.DEV_TAUTULLI_NAME
  if (process.env.DEV_TAUTULLI_HOSTNAME) tautulliDefaults.hostname = process.env.DEV_TAUTULLI_HOSTNAME
  if (process.env.DEV_TAUTULLI_PORT) tautulliDefaults.port = parseInt(process.env.DEV_TAUTULLI_PORT, 10)
  if (process.env.DEV_TAUTULLI_PROTOCOL) tautulliDefaults.protocol = process.env.DEV_TAUTULLI_PROTOCOL as "http" | "https"
  if (process.env.DEV_TAUTULLI_API_KEY) tautulliDefaults.apiKey = process.env.DEV_TAUTULLI_API_KEY

  if (process.env.DEV_OVERSEERR_NAME) overseerrDefaults.name = process.env.DEV_OVERSEERR_NAME
  if (process.env.DEV_OVERSEERR_HOSTNAME) overseerrDefaults.hostname = process.env.DEV_OVERSEERR_HOSTNAME
  if (process.env.DEV_OVERSEERR_PORT) overseerrDefaults.port = parseInt(process.env.DEV_OVERSEERR_PORT, 10)
  if (process.env.DEV_OVERSEERR_PROTOCOL) overseerrDefaults.protocol = process.env.DEV_OVERSEERR_PROTOCOL as "http" | "https"
  if (process.env.DEV_OVERSEERR_API_KEY) overseerrDefaults.apiKey = process.env.DEV_OVERSEERR_API_KEY

  if (process.env.DEV_LLM_PROVIDER) llmProviderDefaults.provider = process.env.DEV_LLM_PROVIDER as "openai" | "openrouter"
  if (process.env.DEV_LLM_API_KEY) llmProviderDefaults.apiKey = process.env.DEV_LLM_API_KEY
  if (process.env.DEV_LLM_MODEL) llmProviderDefaults.model = process.env.DEV_LLM_MODEL

  return {
    plex: Object.keys(plexDefaults).length > 0 ? plexDefaults : null,
    tautulli: Object.keys(tautulliDefaults).length > 0 ? tautulliDefaults : null,
    overseerr: Object.keys(overseerrDefaults).length > 0 ? overseerrDefaults : null,
    llmProvider: Object.keys(llmProviderDefaults).length > 0 ? llmProviderDefaults : null,
  }
}

