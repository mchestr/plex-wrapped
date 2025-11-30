import { parseServerUrl } from "@/lib/utils"
import { z } from "zod"

/**
 * Schema for validating and normalizing server URLs.
 * Uses parseServerUrl to validate the URL format and normalizes output.
 *
 * @param examplePort - Example port to show in error message (e.g., "32400" for Plex)
 * @returns Zod schema that validates and transforms server URLs
 */
export function createServerUrlSchema(examplePort?: string) {
  const portExample = examplePort ? `:${examplePort}` : ""

  return z.string()
    .min(1, "Server URL is required")
    .refine(
      (url) => {
        try {
          parseServerUrl(url)
          return true
        } catch {
          return false
        }
      },
      { message: `Invalid URL format. Expected format: http://example.com${portExample}` }
    )
    .transform((url) => {
      const parsed = parseServerUrl(url)
      const defaultPort = parsed.protocol === "https" ? 443 : 80
      if (parsed.port === defaultPort) {
        return `${parsed.protocol}://${parsed.hostname}`
      }
      return `${parsed.protocol}://${parsed.hostname}:${parsed.port}`
    })
}

/**
 * Schema for validating optional public URLs.
 * Used for external access URLs that may be different from internal server URLs.
 *
 * @param exampleDomain - Example domain to show in error message (e.g., "plex.example.com")
 * @returns Zod schema that validates optional public URLs
 */
export function createPublicUrlSchema(exampleDomain?: string) {
  const domainExample = exampleDomain ? exampleDomain : "example.com"

  return z.string()
    .optional()
    .refine(
      (url) => {
        if (!url) return true
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      { message: `Invalid URL format. Expected format: https://${domainExample}` }
    )
}
