import { z } from "zod"

export const plexServerSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  hostname: z.string().min(1, "Hostname is required"),
  port: z.number().int().min(1).max(65535).default(32400),
  protocol: z.enum(["http", "https"]).default("https"),
  token: z.string().min(1, "Plex token is required"),
})

export type PlexServerInput = z.infer<typeof plexServerSchema>

