/**
 * Model pricing configuration and cost calculation
 */

/**
 * Model pricing per 1M tokens (input, output)
 * Based on OpenAI pricing: https://platform.openai.com/docs/pricing
 * Prices are for Standard tier (most common). Prices are stored as per 1M tokens.
 * Format: { input: price per 1M tokens, output: price per 1M tokens, cachedInput?: price per 1M tokens }
 */
export const MODEL_PRICING: Record<string, { input: number; output: number; cachedInput?: number }> = {
  // GPT-5 models (Standard tier)
  "gpt-5.1": { input: 1.25, output: 10.0, cachedInput: 0.125 },
  "gpt-5": { input: 1.25, output: 10.0, cachedInput: 0.125 },
  "gpt-5-mini": { input: 0.25, output: 2.0, cachedInput: 0.025 },
  "gpt-5-nano": { input: 0.05, output: 0.4, cachedInput: 0.005 },
  "gpt-5-pro": { input: 15.0, output: 120.0 },
  "gpt-5.1-chat-latest": { input: 1.25, output: 10.0, cachedInput: 0.125 },
  "gpt-5-chat-latest": { input: 1.25, output: 10.0, cachedInput: 0.125 },
  "gpt-5.1-codex": { input: 1.25, output: 10.0, cachedInput: 0.125 },
  "gpt-5-codex": { input: 1.25, output: 10.0, cachedInput: 0.125 },
  "gpt-5.1-codex-mini": { input: 0.25, output: 2.0, cachedInput: 0.025 },
  "codex-mini-latest": { input: 1.5, output: 6.0, cachedInput: 0.375 },
  "gpt-5-search-api": { input: 1.25, output: 10.0, cachedInput: 0.125 },

  // GPT-4.1 models (Standard tier)
  "gpt-4.1": { input: 2.0, output: 8.0, cachedInput: 0.5 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6, cachedInput: 0.1 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4, cachedInput: 0.025 },

  // GPT-4o models (Standard tier)
  "gpt-4o": { input: 2.5, output: 10.0, cachedInput: 1.25 },
  "gpt-4o-2024-05-13": { input: 5.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6, cachedInput: 0.075 },
  "gpt-4o-realtime-preview": { input: 5.0, output: 20.0, cachedInput: 2.5 },
  "gpt-4o-mini-realtime-preview": { input: 0.6, output: 2.4, cachedInput: 0.3 },
  "gpt-4o-mini-search-preview": { input: 0.15, output: 0.6 },
  "gpt-4o-search-preview": { input: 2.5, output: 10.0 },

  // GPT-4 Realtime models
  "gpt-realtime": { input: 4.0, output: 16.0, cachedInput: 0.4 },
  "gpt-realtime-mini": { input: 0.6, output: 2.4, cachedInput: 0.06 },

  // GPT-4 Audio models
  "gpt-audio": { input: 2.5, output: 10.0 },
  "gpt-audio-mini": { input: 0.6, output: 2.4 },
  "gpt-4o-audio-preview": { input: 2.5, output: 10.0 },
  "gpt-4o-mini-audio-preview": { input: 0.15, output: 0.6 },

  // O-series models (Standard tier)
  "o1": { input: 15.0, output: 60.0, cachedInput: 7.5 },
  "o1-pro": { input: 150.0, output: 600.0 },
  "o3-pro": { input: 20.0, output: 80.0 },
  "o3": { input: 2.0, output: 8.0, cachedInput: 0.5 },
  "o3-deep-research": { input: 10.0, output: 40.0, cachedInput: 2.5 },
  "o4-mini": { input: 1.1, output: 4.4, cachedInput: 0.275 },
  "o4-mini-deep-research": { input: 2.0, output: 8.0, cachedInput: 0.5 },
  "o3-mini": { input: 1.1, output: 4.4, cachedInput: 0.55 },
  "o1-mini": { input: 1.1, output: 4.4, cachedInput: 0.55 },

  // Other models
  "computer-use-preview": { input: 3.0, output: 12.0 },

  // Legacy GPT-4 models (Standard tier)
  "chatgpt-4o-latest": { input: 5.0, output: 15.0 },
  "gpt-4-turbo-2024-04-09": { input: 10.0, output: 30.0 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4-turbo-preview": { input: 10.0, output: 30.0 },
  "gpt-4-0125-preview": { input: 10.0, output: 30.0 },
  "gpt-4-1106-preview": { input: 10.0, output: 30.0 },
  "gpt-4-1106-vision-preview": { input: 10.0, output: 30.0 },
  "gpt-4-0613": { input: 30.0, output: 60.0 },
  "gpt-4-0314": { input: 30.0, output: 60.0 },
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-4-32k": { input: 60.0, output: 120.0 },
  "gpt-4-32k-0613": { input: 60.0, output: 120.0 },

  // GPT-3.5 Turbo models (Standard tier)
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-1106": { input: 1.0, output: 2.0 },
  "gpt-3.5-turbo-0613": { input: 1.5, output: 2.0 },
  "gpt-3.5-0301": { input: 1.5, output: 2.0 },
  "gpt-3.5-turbo-instruct": { input: 1.5, output: 2.0 },
  "gpt-3.5-turbo-16k": { input: 3.0, output: 4.0 },
  "gpt-3.5-turbo-16k-0613": { input: 3.0, output: 4.0 },

  // Other legacy models
  "davinci-002": { input: 2.0, output: 2.0 },
  "babbage-002": { input: 0.4, output: 0.4 },

  // Batch tier pricing (lower cost, higher latency)
  "gpt-5.1-batch": { input: 0.625, output: 5.0, cachedInput: 0.0625 },
  "gpt-5-batch": { input: 0.625, output: 5.0, cachedInput: 0.0625 },
  "gpt-5-mini-batch": { input: 0.125, output: 1.0, cachedInput: 0.0125 },
  "gpt-5-nano-batch": { input: 0.025, output: 0.2, cachedInput: 0.0025 },
  "gpt-5-pro-batch": { input: 7.5, output: 60.0 },
  "gpt-4.1-batch": { input: 1.0, output: 4.0 },
  "gpt-4.1-mini-batch": { input: 0.2, output: 0.8 },
  "gpt-4.1-nano-batch": { input: 0.05, output: 0.2 },
  "gpt-4o-batch": { input: 1.25, output: 5.0 },
  "gpt-4o-2024-05-13-batch": { input: 2.5, output: 7.5 },
  "gpt-4o-mini-batch": { input: 0.075, output: 0.3 },
  "o3-batch": { input: 1.0, output: 4.0, cachedInput: 0.25 },
  "o4-mini-batch": { input: 0.55, output: 2.2, cachedInput: 0.138 },

  // Legacy batch pricing
  "gpt-4-turbo-2024-04-09-batch": { input: 5.0, output: 15.0 },
  "gpt-4-0125-preview-batch": { input: 5.0, output: 15.0 },
  "gpt-4-1106-preview-batch": { input: 5.0, output: 15.0 },
  "gpt-4-1106-vision-preview-batch": { input: 5.0, output: 15.0 },
  "gpt-4-0613-batch": { input: 15.0, output: 30.0 },
  "gpt-4-0314-batch": { input: 15.0, output: 30.0 },
  "gpt-4-32k-batch": { input: 30.0, output: 60.0 },
  "gpt-3.5-turbo-0125-batch": { input: 0.25, output: 0.75 },
  "gpt-3.5-turbo-1106-batch": { input: 1.0, output: 2.0 },
  "gpt-3.5-turbo-0613-batch": { input: 1.5, output: 2.0 },
  "gpt-3.5-0301-batch": { input: 1.5, output: 2.0 },
  "gpt-3.5-turbo-16k-0613-batch": { input: 1.5, output: 2.0 },
  "davinci-002-batch": { input: 1.0, output: 1.0 },
  "babbage-002-batch": { input: 0.2, output: 0.2 },

  // Priority tier pricing (higher cost, lower latency)
  "gpt-5.1-priority": { input: 2.5, output: 20.0, cachedInput: 0.25 },
  "gpt-5-priority": { input: 2.5, output: 20.0, cachedInput: 0.25 },
  "gpt-5-mini-priority": { input: 0.45, output: 3.6, cachedInput: 0.045 },
  "gpt-5.1-codex-priority": { input: 2.5, output: 20.0, cachedInput: 0.25 },
  "gpt-5-codex-priority": { input: 2.5, output: 20.0, cachedInput: 0.25 },
  "gpt-4.1-priority": { input: 3.5, output: 14.0, cachedInput: 0.875 },
  "gpt-4.1-mini-priority": { input: 0.7, output: 2.8, cachedInput: 0.175 },
  "gpt-4.1-nano-priority": { input: 0.2, output: 0.8, cachedInput: 0.05 },
  "gpt-4o-priority": { input: 4.25, output: 17.0, cachedInput: 2.125 },
  "gpt-4o-2024-05-13-priority": { input: 8.75, output: 26.25 },
  "gpt-4o-mini-priority": { input: 0.25, output: 1.0, cachedInput: 0.125 },
  "o3-priority": { input: 3.5, output: 14.0, cachedInput: 0.875 },
  "o4-mini-priority": { input: 2.0, output: 8.0, cachedInput: 0.5 },

  // Flex tier pricing (lower cost, higher latency)
  "gpt-5.1-flex": { input: 0.625, output: 5.0, cachedInput: 0.0625 },
  "gpt-5-flex": { input: 0.625, output: 5.0, cachedInput: 0.0625 },
  "gpt-5-mini-flex": { input: 0.125, output: 1.0, cachedInput: 0.0125 },
  "gpt-5-nano-flex": { input: 0.025, output: 0.2, cachedInput: 0.0025 },
  "o3-flex": { input: 1.0, output: 4.0, cachedInput: 0.25 },
  "o4-mini-flex": { input: 0.55, output: 2.2, cachedInput: 0.138 },
}

/**
 * Calculate cost based on model, prompt tokens, and completion tokens
 * Prices in MODEL_PRICING are per 1M tokens, so we divide by 1,000,000 to get cost
 */
export function calculateCost(
  model: string | null | undefined,
  promptTokens: number,
  completionTokens: number,
  provider: "openai" | "openrouter"
): number {
  // For OpenRouter, pricing varies by model and is typically provided by the API
  // We'll use a conservative estimate or try to extract from model name
  if (provider === "openrouter") {
    // OpenRouter models are prefixed with provider/model (e.g., "openai/gpt-4")
    const modelName = model?.includes("/") ? model.split("/")[1] : model

    // Try to find pricing for the underlying model
    const pricing = modelName ? MODEL_PRICING[modelName] : null
    if (pricing) {
      // Prices are per 1M tokens, so divide by 1,000,000
      return (promptTokens / 1000000) * pricing.input + (completionTokens / 1000000) * pricing.output
    }

    // Fallback: conservative estimate for unknown OpenRouter models (using GPT-4 pricing)
    return (promptTokens / 1000000) * 30.0 + (completionTokens / 1000000) * 60.0
  }

  // For OpenAI, use model-specific pricing
  const pricing = model ? MODEL_PRICING[model] : null

  if (pricing) {
    // Prices are per 1M tokens, so divide by 1,000,000
    return (promptTokens / 1000000) * pricing.input + (completionTokens / 1000000) * pricing.output
  }

  // Fallback to GPT-4 pricing if model not found
  console.warn(`[LLM] Unknown model "${model}", using GPT-4 pricing as fallback`)
  return (promptTokens / 1000000) * 30.0 + (completionTokens / 1000000) * 60.0
}

