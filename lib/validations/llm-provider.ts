import { z } from "zod"

export const llmProviderSchema = z.object({
  provider: z.enum(["openai", "openrouter"], {
    required_error: "Please select a provider",
  }),
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().optional(),
})

export type LLMProviderInput = z.infer<typeof llmProviderSchema>

