"use server"

import { constructServerUrl } from "@/lib/utils"

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
    url: string
    hostname: string
    port: number
    protocol: "http" | "https"
    token: string
  }> = {}

  const tautulliDefaults: Partial<{
    name: string
    url: string
    hostname: string
    port: number
    protocol: "http" | "https"
    apiKey: string
  }> = {}

  const overseerrDefaults: Partial<{
    name: string
    url: string
    hostname: string
    port: number
    protocol: "http" | "https"
    apiKey: string
  }> = {}

  const llmProviderDefaults: Partial<{
    provider: "openai"
    apiKey: string
    model: string
  }> = {}

  // Plex defaults - prefer URL, fallback to constructing from parts
  if (process.env.DEV_PLEX_NAME) plexDefaults.name = process.env.DEV_PLEX_NAME
  if (process.env.DEV_PLEX_URL) {
    plexDefaults.url = process.env.DEV_PLEX_URL
  } else if (process.env.DEV_PLEX_HOSTNAME && process.env.DEV_PLEX_PROTOCOL && process.env.DEV_PLEX_PORT) {
    const protocol = process.env.DEV_PLEX_PROTOCOL as "http" | "https"
    const port = parseInt(process.env.DEV_PLEX_PORT, 10)
    plexDefaults.url = constructServerUrl(protocol, process.env.DEV_PLEX_HOSTNAME, port)
    // Also include legacy fields for backward compatibility
    plexDefaults.hostname = process.env.DEV_PLEX_HOSTNAME
    plexDefaults.port = port
    plexDefaults.protocol = protocol
  }
  if (process.env.DEV_PLEX_TOKEN) plexDefaults.token = process.env.DEV_PLEX_TOKEN

  // Tautulli defaults - prefer URL, fallback to constructing from parts
  if (process.env.DEV_TAUTULLI_NAME) tautulliDefaults.name = process.env.DEV_TAUTULLI_NAME
  if (process.env.DEV_TAUTULLI_URL) {
    tautulliDefaults.url = process.env.DEV_TAUTULLI_URL
  } else if (process.env.DEV_TAUTULLI_HOSTNAME && process.env.DEV_TAUTULLI_PROTOCOL && process.env.DEV_TAUTULLI_PORT) {
    const protocol = process.env.DEV_TAUTULLI_PROTOCOL as "http" | "https"
    const port = parseInt(process.env.DEV_TAUTULLI_PORT, 10)
    tautulliDefaults.url = constructServerUrl(protocol, process.env.DEV_TAUTULLI_HOSTNAME, port)
    // Also include legacy fields for backward compatibility
    tautulliDefaults.hostname = process.env.DEV_TAUTULLI_HOSTNAME
    tautulliDefaults.port = port
    tautulliDefaults.protocol = protocol
  }
  if (process.env.DEV_TAUTULLI_API_KEY) tautulliDefaults.apiKey = process.env.DEV_TAUTULLI_API_KEY

  // Overseerr defaults - prefer URL, fallback to constructing from parts
  if (process.env.DEV_OVERSEERR_NAME) overseerrDefaults.name = process.env.DEV_OVERSEERR_NAME
  if (process.env.DEV_OVERSEERR_URL) {
    overseerrDefaults.url = process.env.DEV_OVERSEERR_URL
  } else if (process.env.DEV_OVERSEERR_HOSTNAME && process.env.DEV_OVERSEERR_PROTOCOL && process.env.DEV_OVERSEERR_PORT) {
    const protocol = process.env.DEV_OVERSEERR_PROTOCOL as "http" | "https"
    const port = parseInt(process.env.DEV_OVERSEERR_PORT, 10)
    overseerrDefaults.url = constructServerUrl(protocol, process.env.DEV_OVERSEERR_HOSTNAME, port)
    // Also include legacy fields for backward compatibility
    overseerrDefaults.hostname = process.env.DEV_OVERSEERR_HOSTNAME
    overseerrDefaults.port = port
    overseerrDefaults.protocol = protocol
  }
  if (process.env.DEV_OVERSEERR_API_KEY) overseerrDefaults.apiKey = process.env.DEV_OVERSEERR_API_KEY

  if (process.env.DEV_LLM_PROVIDER) llmProviderDefaults.provider = process.env.DEV_LLM_PROVIDER as "openai"
  if (process.env.DEV_LLM_API_KEY) llmProviderDefaults.apiKey = process.env.DEV_LLM_API_KEY
  if (process.env.DEV_LLM_MODEL) llmProviderDefaults.model = process.env.DEV_LLM_MODEL

  return {
    plex: Object.keys(plexDefaults).length > 0 ? plexDefaults : null,
    tautulli: Object.keys(tautulliDefaults).length > 0 ? tautulliDefaults : null,
    overseerr: Object.keys(overseerrDefaults).length > 0 ? overseerrDefaults : null,
    llmProvider: Object.keys(llmProviderDefaults).length > 0 ? llmProviderDefaults : null,
  }
}

