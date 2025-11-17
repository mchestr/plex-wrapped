/**
 * LLM integration for generating wrapped content
 */

import { prisma } from "@/lib/prisma"
import { WrappedStatistics } from "@/types/wrapped"
import { generateWrappedPrompt } from "./prompt"
import { generateMockWrappedData } from "./mock-data"
import { callOpenAI, callOpenRouter, LLMConfig } from "./api-calls"

/**
 * Call LLM to generate wrapped content
 */
export async function generateWrappedWithLLM(
  userName: string,
  year: number,
  userId: string,
  wrappedId: string,
  statistics: WrappedStatistics
): Promise<{
  success: boolean
  data?: any
  error?: string
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost: number
  }
}> {
  try {
    // Check if LLM is disabled in config
    const appConfig = await prisma.config.findUnique({
      where: { id: "config" },
    })

    if (appConfig?.llmDisabled) {
      console.log("[LLM] LLM calls are disabled - returning mock data")
      const mockData = generateMockWrappedData(userName, year, userId, statistics)

      // Still save a record that this was generated with mock data (no cost)
      // Always create a new record to track all usage, including regenerations
      try {
        await prisma.lLMUsage.create({
          data: {
            wrappedId,
            userId,
            provider: "mock",
            model: "mock",
            prompt: "[LLM Disabled - Mock Data]",
            response: JSON.stringify(mockData),
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            cost: 0,
          },
        })
      } catch (dbError) {
        console.error("[LLM] Failed to save mock usage to database:", dbError)
        // Don't fail the whole operation if logging fails
      }

      return {
        success: true,
        data: mockData,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
        },
      }
    }

    // Get active LLM provider
    const llmProvider = await prisma.lLMProvider.findFirst({
      where: { isActive: true },
    })

    if (!llmProvider) {
      return { success: false, error: "No active LLM provider configured" }
    }

    const config: LLMConfig = {
      provider: llmProvider.provider as "openai" | "openrouter",
      apiKey: llmProvider.apiKey,
      model: llmProvider.model || undefined,
    }

    // Generate prompt
    const prompt = generateWrappedPrompt(userName, year, statistics)

    // Call appropriate LLM provider
    let llmResult
    if (config.provider === "openai") {
      llmResult = await callOpenAI(config, prompt, statistics, year, userId, userName)
    } else if (config.provider === "openrouter") {
      llmResult = await callOpenRouter(config, prompt, statistics, year, userId, userName)
    } else {
      return { success: false, error: "Unsupported LLM provider" }
    }

    if (!llmResult.success || !llmResult.data) {
      return llmResult
    }

    // Save token usage to database for cost tracking
    // Always create a new record to track all usage, including regenerations
    if (llmResult.tokenUsage) {
      try {
        await prisma.lLMUsage.create({
          data: {
            wrappedId,
            userId,
            provider: config.provider,
            model: config.model || (config.provider === "openai" ? "gpt-4" : "openai/gpt-4"),
            prompt,
            response: llmResult.rawResponse || JSON.stringify(llmResult.data),
            promptTokens: llmResult.tokenUsage.promptTokens,
            completionTokens: llmResult.tokenUsage.completionTokens,
            totalTokens: llmResult.tokenUsage.totalTokens,
            cost: llmResult.tokenUsage.cost,
          },
        })
      } catch (dbError) {
        console.error("[LLM] Failed to save token usage to database:", dbError)
        // Don't fail the whole operation if logging fails
      }
    }

    return llmResult
  } catch (error) {
    console.error("[LLM] Error generating wrapped content:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate wrapped content",
    }
  }
}

