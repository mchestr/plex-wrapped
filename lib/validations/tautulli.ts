import { z } from "zod"

export const tautulliSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  hostname: z.string().min(1, "Hostname is required"),
  port: z.number().int().min(1).max(65535).default(8181),
  protocol: z.enum(["http", "https"]).default("http"),
  apiKey: z.string().min(1, "API key is required"),
})

export type TautulliInput = z.infer<typeof tautulliSchema>

