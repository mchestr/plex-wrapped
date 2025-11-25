import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/utils/logger"
import { NextResponse } from "next/server"

const logger = createLogger("DISCORD_CHAT_CLEAR_ROUTE")

interface DiscordClearPayload {
  discordUserId?: string
  channelId?: string
}

function extractSecret(request: Request): string | null {
  const headerKey = request.headers.get("x-plexwrapped-bot-key")
  if (headerKey) return headerKey

  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim()
  }

  return authHeader.trim()
}

export async function POST(request: Request) {
  const integration = await prisma.discordIntegration.findUnique({ where: { id: "discord" } })
  if (!integration?.botSharedSecret) {
    return NextResponse.json({ error: "Bot chat is not configured" }, { status: 503 })
  }

  const providedSecret = extractSecret(request)
  if (!providedSecret || providedSecret !== integration.botSharedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: DiscordClearPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const discordUserId = payload.discordUserId?.trim()
  const channelId = payload.channelId?.trim()

  if (!discordUserId || !channelId) {
    return NextResponse.json({ error: "discordUserId and channelId are required" }, { status: 400 })
  }

  const connection = await prisma.discordConnection.findUnique({
    where: { discordUserId },
  })

  if (!connection || connection.revokedAt) {
    return NextResponse.json({ linked: false, error: "Discord account is not linked" }, { status: 403 })
  }

  const sessionKey = {
    discordUserId,
    discordChannelId: channelId,
  }

  const session = await prisma.discordChatSession.findUnique({
    where: {
      discordUserId_discordChannelId: sessionKey,
    },
  })

  if (!session) {
    // No session to clear, return success anyway
    logger.info("No session found to clear", {
      discordUserId,
      channelId,
    })
    return NextResponse.json({
      success: true,
      message: "Chat context cleared",
    })
  }

  // Create a new conversation and clear the messages
  const conversation = await prisma.chatConversation.create({
    data: { userId: connection.userId },
  })

  await prisma.discordChatSession.update({
    where: { id: session.id },
    data: {
      chatConversationId: conversation.id,
      messages: [],
      isActive: true,
      lastMessageAt: new Date(),
    },
  })

  logger.info("Discord chat session cleared", {
    discordUserId,
    channelId,
    oldConversationId: session.chatConversationId,
    newConversationId: conversation.id,
  })

  return NextResponse.json({
    success: true,
    message: "Chat context cleared",
    conversationId: conversation.id,
  })
}

