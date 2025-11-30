import { z } from "zod"

import { createPublicUrlSchema, createServerUrlSchema } from "./shared-schemas"

export const tautulliSchema = z.object({
  name: z.string().min(1, "Server name is required"),
  url: createServerUrlSchema("8181"),
  apiKey: z.string().min(1, "API key is required"),
  publicUrl: createPublicUrlSchema("tautulli.example.com"),
})

export type TautulliInput = z.input<typeof tautulliSchema>
export type TautulliParsed = z.output<typeof tautulliSchema>

