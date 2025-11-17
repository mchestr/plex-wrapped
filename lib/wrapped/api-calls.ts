/**
 * LLM API call implementations for OpenAI and OpenRouter
 */

import { WrappedStatistics } from "@/types/wrapped"
import { calculateCost } from "./pricing"
import { parseWrappedResponse } from "./prompt"
import { getBaseUrl } from "@/lib/utils"

export interface LLMConfig {
  provider: "openai" | "openrouter"
  apiKey: string
  model?: string
}

export interface LLMResponse {
  success: boolean
  data?: any
  error?: string
  rawResponse?: string // Raw response content for database storage
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost: number
  }
}

/**
 * Call OpenAI API to generate wrapped content
 */
export async function callOpenAI(
  config: LLMConfig,
  prompt: string,
  statistics: WrappedStatistics,
  year: number,
  userId: string,
  userName: string
): Promise<LLMResponse> {
  const model = config.model || "gpt-4"
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a creative assistant that generates personalized, fun, and engaging content for Plex Wrapped experiences. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 6000, // Increased to prevent truncation
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.error?.message || `OpenAI API error: ${response.statusText}`,
    }
  }

  const responseData = await response.json()
  const choice = responseData.choices?.[0]
  const content = choice?.message?.content

  if (!content) {
    return { success: false, error: "No content in LLM response" }
  }

  // Check if response was truncated
  const finishReason = choice?.finish_reason
  const trimmedContent = content.trim()

  // Check if JSON appears incomplete (doesn't end with closing brace or markdown block)
  const isIncompleteJson = !trimmedContent.endsWith("}") && !trimmedContent.endsWith("```")

  // If finish reason is "length", the response was definitely truncated
  // Also check if JSON structure appears incomplete
  if (finishReason === "length" || isIncompleteJson) {
    console.error("[LLM] Response appears to be truncated:", {
      finishReason,
      contentLength: content.length,
      lastChars: trimmedContent.slice(-100),
      isIncompleteJson,
    })
    return {
      success: false,
      error: "LLM response was truncated. The generated content exceeded the token limit. Please try regenerating.",
    }
  }

  const wrappedData = parseWrappedResponse(content, statistics, year, userId, userName)

  // Calculate token usage
  const usage = responseData.usage || {}
  const promptTokens = usage.prompt_tokens || 0
  const completionTokens = usage.completion_tokens || 0
  const totalTokens = usage.total_tokens || 0

  // Calculate cost based on model-specific pricing
  const cost = calculateCost(model, promptTokens, completionTokens, "openai")

  return {
    success: true,
    data: wrappedData,
    rawResponse: content,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
    },
  }
}

/**
 * Call OpenRouter API to generate wrapped content
 */
export async function callOpenRouter(
  config: LLMConfig,
  prompt: string,
  statistics: WrappedStatistics,
  year: number,
  userId: string,
  userName: string
): Promise<LLMResponse> {
  const model = config.model || "openai/gpt-4"
  const baseUrl = getBaseUrl()
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": baseUrl,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a creative assistant that generates personalized, fun, and engaging content for Plex Wrapped experiences. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 6000, // Increased to prevent truncation
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.error?.message || `OpenRouter API error: ${response.statusText}`,
    }
  }

  const responseData = await response.json()
  const choice = responseData.choices?.[0]
  const content = choice?.message?.content

  if (!content) {
    return { success: false, error: "No content in LLM response" }
  }

  // Check if response was truncated
  const finishReason = choice?.finish_reason
  const trimmedContent = content.trim()

  // Check if JSON appears incomplete (doesn't end with closing brace or markdown block)
  const isIncompleteJson = !trimmedContent.endsWith("}") && !trimmedContent.endsWith("```")

  // If finish reason is "length", the response was definitely truncated
  // Also check if JSON structure appears incomplete
  if (finishReason === "length" || isIncompleteJson) {
    console.error("[LLM] Response appears to be truncated:", {
      finishReason,
      contentLength: content.length,
      lastChars: trimmedContent.slice(-100),
      isIncompleteJson,
    })
    return {
      success: false,
      error: "LLM response was truncated. The generated content exceeded the token limit. Please try regenerating.",
    }
  }

  const wrappedData = parseWrappedResponse(content, statistics, year, userId, userName)

  // Calculate token usage
  const usage = responseData.usage || {}
  const promptTokens = usage.prompt_tokens || 0
  const completionTokens = usage.completion_tokens || 0
  const totalTokens = usage.total_tokens || 0

  // Calculate cost based on model-specific pricing
  const cost = calculateCost(model, promptTokens, completionTokens, "openrouter")

  return {
    success: true,
    data: wrappedData,
    rawResponse: content,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
    },
  }
}

