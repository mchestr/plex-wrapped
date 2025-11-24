import { parseServerUrl } from "@/lib/utils"
import { z } from "zod"

export const plexServerSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  url: z.string().min(1, "Server URL is required").refine(
    (url) => {
      try {
        parseServerUrl(url)
        return true
      } catch {
        return false
      }
    },
    { message: "Invalid URL format. Expected format: https://example.com:32400" }
  ).transform((url) => {
    // Normalize URL by parsing and reconstructing it
    const parsed = parseServerUrl(url)
    const defaultPort = parsed.protocol === "https" ? 443 : 80
    if (parsed.port === defaultPort) {
      return `${parsed.protocol}://${parsed.hostname}`
    }
    return `${parsed.protocol}://${parsed.hostname}:${parsed.port}`
  }),
  token: z.string().min(1, "Plex token is required"),
  publicUrl: z.string().optional().refine(
    (url) => {
      if (!url) return true
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    { message: "Invalid URL format. Expected format: https://plex.example.com" }
  ),
})

export type PlexServerInput = z.input<typeof plexServerSchema>
export type PlexServerParsed = z.output<typeof plexServerSchema>

