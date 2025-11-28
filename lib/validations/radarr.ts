import { parseServerUrl } from "@/lib/utils"
import { z } from "zod"

export const radarrSchema = z.object({
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
    { message: "Invalid URL format. Expected format: http://example.com:7878" }
  ).transform((url) => {
    // Normalize URL by parsing and reconstructing it
    const parsed = parseServerUrl(url)
    const defaultPort = parsed.protocol === "https" ? 443 : 80
    if (parsed.port === defaultPort) {
      return `${parsed.protocol}://${parsed.hostname}`
    }
    return `${parsed.protocol}://${parsed.hostname}:${parsed.port}`
  }),
  apiKey: z.string().min(1, "API key is required"),
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
    { message: "Invalid URL format. Expected format: https://radarr.example.com" }
  ),
})

export type RadarrInput = z.input<typeof radarrSchema>
export type RadarrParsed = z.output<typeof radarrSchema>

// Schema for Radarr server list response
export const radarrServerListSchema = z.object({
  servers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
})

export type RadarrServerList = z.infer<typeof radarrServerListSchema>

