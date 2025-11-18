import { parseServerUrl } from "@/lib/utils"
import { z } from "zod"

export const tautulliSchema = z.object({
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
    { message: "Invalid URL format. Expected format: http://example.com:8181" }
  ),
  apiKey: z.string().min(1, "API key is required"),
}).transform((data) => {
  const { protocol, hostname, port } = parseServerUrl(data.url)
  return {
    name: data.name,
    hostname,
    port,
    protocol,
    apiKey: data.apiKey,
  }
})

export type TautulliInput = z.input<typeof tautulliSchema>
export type TautulliParsed = z.output<typeof tautulliSchema>

