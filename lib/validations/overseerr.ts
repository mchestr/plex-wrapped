import { parseServerUrl } from "@/lib/utils"
import { z } from "zod"

export const overseerrSchema = z.object({
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
    { message: "Invalid URL format. Expected format: http://example.com:5055" }
  ),
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
    { message: "Invalid URL format. Expected format: https://requests.example.com" }
  ),
}).transform((data) => {
  const { protocol, hostname, port } = parseServerUrl(data.url)
  return {
    name: data.name,
    hostname,
    port,
    protocol,
    apiKey: data.apiKey,
    publicUrl: data.publicUrl,
  }
})

export type OverseerrInput = z.input<typeof overseerrSchema>
export type OverseerrParsed = z.output<typeof overseerrSchema>

