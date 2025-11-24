"use server"

import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/utils/logger"

import { getConfig } from "@/actions/admin"
import { runConversationLoop } from "./conversation"
import { generateSystemPrompt } from "./tools"
import { type ChatMessage, type ChatResponse } from "./types"

const logger = createLogger("CHATBOT")

export type { ChatMessage, ChatResponse }

export async function chatWithAdminBot(
  messages: ChatMessage[],
  conversationId?: string
): Promise<ChatResponse> {
  try {
    const session = await requireAdmin()
    const userId = session.user.id

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "user") {
      return { success: false, error: "Invalid message history" }
    }

    // Get config to check if LLM is enabled
    const config = await getConfig()
    const llmProvider = await prisma.lLMProvider.findFirst({
      where: { isActive: true, purpose: "chat" }
    })
    const useLLM = !config.llmDisabled && !!llmProvider && llmProvider.provider === "openai" && !!llmProvider.model

    // Basic fallback if LLM is not enabled
    if (!useLLM || !llmProvider || !llmProvider.model) {
      return {
        success: true,
        message: {
          role: "assistant",
          content:
            "AI features are currently disabled or not configured. Please configure a chat OpenAI model in Settings to use the troubleshooting assistant.",
          timestamp: Date.now(),
        },
      }
    }

    // Ensure we have a chat conversation for this request
    let activeConversationId = conversationId
    if (!activeConversationId) {
      const conversation = await prisma.chatConversation.create({
        data: {
          userId,
        },
      })
      activeConversationId = conversation.id
    }

    const systemPrompt = generateSystemPrompt()

    const result = await runConversationLoop(messages, {
      userId,
      conversationId: activeConversationId,
      llmProvider: {
        apiKey: llmProvider.apiKey,
        model: llmProvider.model,
        temperature: llmProvider.temperature,
        maxTokens: llmProvider.maxTokens,
      },
      systemPrompt,
    })
    return {
      ...result,
      conversationId: activeConversationId,
    }
  } catch (error) {
    logger.error("Chatbot error", error)
    return {
      success: false,
      error: "Failed to process message",
    }
  }
}


