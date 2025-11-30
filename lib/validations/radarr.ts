import { z } from "zod"

import { createPublicUrlSchema, createServerUrlSchema } from "./shared-schemas"

export const radarrSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  url: createServerUrlSchema("7878"),
  apiKey: z.string().min(1, "API key is required"),
  publicUrl: createPublicUrlSchema("radarr.example.com"),
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

