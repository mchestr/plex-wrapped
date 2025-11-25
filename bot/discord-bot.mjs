import { Client, Events, GatewayIntentBits } from "discord.js"
import "dotenv/config"
import winston from "winston"

// Create logger instance
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isDevelopment
      ? winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const levelSymbol = {
            error: "✖",
            warn: "⚠",
            info: "ℹ",
            debug: "→",
          }[level] || "•"
          const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : ""
          return `${timestamp} ${levelSymbol} ${level.toUpperCase().padEnd(5)} [discord-bot] ${message}${metaStr}`
        })
      : winston.format.json()
  ),
  defaultMeta: {
    service: "discord-bot",
    env: process.env.NODE_ENV || "development",
  },
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
  exitOnError: false,
})

const REQUIRED_ENV = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_SUPPORT_CHANNEL_ID",
  "PLEX_WRAPPED_BASE_URL",
  "DISCORD_BOT_SHARED_SECRET",
]

const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  logger.error("Missing required environment variables", { missing })
  process.exit(1)
}

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const SUPPORT_CHANNEL_ID = process.env.DISCORD_SUPPORT_CHANNEL_ID
const BOT_SHARED_SECRET = process.env.DISCORD_BOT_SHARED_SECRET
const BASE_URL = process.env.PLEX_WRAPPED_BASE_URL?.replace(/\/$/, "")
const PORTAL_URL = process.env.DISCORD_PORTAL_URL || `${BASE_URL}/discord/link`
const LISTEN_THREAD_IDS = process.env.DISCORD_SUPPORT_THREAD_IDS
  ? process.env.DISCORD_SUPPORT_THREAD_IDS.split(",").map((id) => id.trim()).filter(Boolean)
  : []
const CHAT_TRIGGER_PREFIXES = ["!assistant", "!bot", "!support"]
const CLEAR_COMMANDS = ["!clear", "!reset", "!clearcontext"]

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})

client.once(Events.ClientReady, (readyClient) => {
  logger.info("Bot connected and ready", {
    botTag: readyClient.user.tag,
    botId: readyClient.user.id,
    supportChannelId: SUPPORT_CHANNEL_ID,
    threadIds: LISTEN_THREAD_IDS,
    guildCount: readyClient.guilds.cache.size,
  })
})

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    logger.debug("Ignoring bot message", {
      authorId: message.author.id,
      authorTag: message.author.tag,
    })
    return
  }

  const isDm = !message.guildId
  const isSupportChannel = message.channelId === SUPPORT_CHANNEL_ID
  const isAllowedThread = LISTEN_THREAD_IDS.includes(message.channelId)
  const channelType = isDm ? "dm" : isSupportChannel ? "support-channel" : "thread"
  const botId = client.user?.id ?? null
  const mentionBot = botId ? message.mentions.has(botId) : false
  const normalizedContent = message.content?.trim().toLowerCase() || ""
  const prefixUsed = Boolean(normalizedContent) && CHAT_TRIGGER_PREFIXES.some((prefix) => normalizedContent.startsWith(prefix))
  const shouldUseChatbot = isDm || mentionBot || prefixUsed

  if (!isDm && !isSupportChannel && !isAllowedThread) {
    logger.debug("Message not in monitored channel", {
      channelId: message.channelId,
      guildId: message.guildId,
      authorId: message.author.id,
    })
    return
  }

  logger.info("Message received in monitored channel", {
    channelId: message.channelId,
    channelType,
    authorId: message.author.id,
    authorTag: message.author.tag,
    messageLength: message.content?.length || 0,
    hasAttachments: message.attachments.size > 0,
    mentionBot,
    prefixUsed,
  })

  try {
    const verification = await verifyDiscordUser(message.author.id)

    if (!verification.linked) {
      logger.info("User not linked, sending link request", {
        discordUserId: message.author.id,
        discordUserTag: message.author.tag,
      })
      await message.reply({
        content: `Hi <@${message.author.id}>! To talk with support, please link your account first: ${PORTAL_URL}`,
        allowedMentions: { users: [message.author.id] },
      })
      return
    }

    const displayName = verification.user?.name || verification.user?.email || `User ${verification.user?.id ?? "unknown"}`

    logger.info("User verified successfully", {
      discordUserId: message.author.id,
      discordUserTag: message.author.tag,
      userId: verification.user?.id,
      userName: verification.user?.name,
      userEmail: verification.user?.email,
    })

    // Check for clear context command
    const isClearCommand = CLEAR_COMMANDS.some((cmd) => normalizedContent === cmd || normalizedContent.startsWith(`${cmd} `))
    if (isClearCommand) {
      try {
        const clearResponse = await clearChatContext({
          discordUserId: message.author.id,
          channelId: message.channelId,
        })

        if (clearResponse.success) {
          await message.reply({
            content: "✅ Chat context cleared! Starting fresh.",
            allowedMentions: { users: [message.author.id] },
          })
        } else {
          await message.reply({
            content: "Sorry, I couldn't clear the chat context right now. Please try again in a moment.",
            allowedMentions: { users: [message.author.id] },
          })
        }
        return
      } catch (error) {
        logger.error("Error clearing chat context", error, {
          discordUserId: message.author.id,
          channelId: message.channelId,
        })
        await message.reply({
          content: "Sorry, I couldn't clear the chat context right now. Please try again in a moment.",
          allowedMentions: { users: [message.author.id] },
        })
        return
      }
    }

    if (shouldUseChatbot) {
      const chatInput = buildChatInput({
        content: message.content ?? "",
        attachments: Array.from(message.attachments.values()),
        botId,
      })

      if (!chatInput) {
        logger.info("No actionable content for chatbot", {
          discordUserId: message.author.id,
          channelId: message.channelId,
        })
        await message.reply({
          content: "I didn't catch a question. Please include a message or attachment so I can help.",
          allowedMentions: { users: [message.author.id] },
        })
        return
      }

      try {
        await message.channel.sendTyping().catch(() => {})
        const chatbotResponse = await requestChatbotResponse({
          discordUserId: message.author.id,
          channelId: message.channelId,
          channelType,
          messageId: message.id,
          content: chatInput,
        })

        if (chatbotResponse.linked === false) {
          await message.reply({
            content: `Hi <@${message.author.id}>! To talk with support, please link your account first: ${PORTAL_URL}`,
            allowedMentions: { users: [message.author.id] },
          })
          return
        }

        if (!chatbotResponse.success || !chatbotResponse.message?.content) {
          throw new Error(chatbotResponse.error || "Empty chatbot response")
        }

        const replyContent = isDm
          ? chatbotResponse.message.content
          : `<@${message.author.id}> ${chatbotResponse.message.content}`

        await message.reply({
          content: replyContent,
          allowedMentions: { users: [message.author.id] },
        })
        return
      } catch (error) {
        logger.error("Error responding with chatbot", error, {
          discordUserId: message.author.id,
          channelId: message.channelId,
          channelType,
        })
        await message.reply({
          content: "Sorry, I couldn't reach the assistant right now. Please try again in a moment.",
          allowedMentions: { users: [message.author.id] },
        })
        return
      }
    }

    logger.info("Message logged from verified user", {
      displayName,
      discordUserTag: message.author.tag,
      userId: verification.user?.id,
      channelId: message.channelId,
      messagePreview: message.content?.substring(0, 100) || "",
    })
  } catch (error) {
    logger.error("Error verifying user", error, {
      discordUserId: message.author.id,
      discordUserTag: message.author.tag,
      channelId: message.channelId,
      channelType,
    })
    await message.reply("Sorry, I couldn't verify your access right now. Please try again in a moment.")
  }
})

async function verifyDiscordUser(discordUserId) {
  const startTime = Date.now()

  logger.debug("Verifying Discord user", {
    discordUserId,
    baseUrl: BASE_URL,
  })

  try {
    const response = await fetch(`${BASE_URL}/api/discord/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_SHARED_SECRET}`,
      },
      body: JSON.stringify({ discordUserId }),
    })

    const duration = Date.now() - startTime

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      logger.warn("Verification request failed", {
        discordUserId,
        status: response.status,
        statusText: response.statusText,
        body: body.substring(0, 200),
        duration,
      })
      throw new Error(`Verification request failed (${response.status}): ${body}`)
    }

    const result = await response.json()

    logger.debug("Verification request successful", {
      discordUserId,
      linked: result.linked,
      userId: result.user?.id,
      duration,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Error during verification request", error, {
      discordUserId,
      duration,
    })
    throw error
  }
}

async function requestChatbotResponse({ discordUserId, channelId, channelType, messageId, content }) {
  const startTime = Date.now()

  logger.debug("Sending Discord message to chatbot", {
    discordUserId,
    channelId,
    channelType,
  })

  try {
    const response = await fetch(`${BASE_URL}/api/discord/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_SHARED_SECRET}`,
      },
      body: JSON.stringify({
        discordUserId,
        channelId,
        channelType,
        messageId,
        message: content,
      }),
    })

    const duration = Date.now() - startTime
    const rawBody = await response.text()
    let parsedBody = {}

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody)
      } catch (parseError) {
        logger.error("Failed to parse chatbot response JSON", parseError, {
          discordUserId,
          channelId,
          rawBody: rawBody.substring(0, 200),
        })
        throw new Error("Invalid chatbot response payload")
      }
    }

    if (!response.ok) {
      logger.warn("Chatbot request failed", {
        discordUserId,
        channelId,
        status: response.status,
        duration,
        body: rawBody.substring(0, 200),
      })

      if (response.status === 403 && parsedBody && parsedBody.linked === false) {
        return { success: false, linked: false, error: parsedBody.error }
      }

      throw new Error(parsedBody?.error || `Chatbot request failed (${response.status})`)
    }

    logger.debug("Chatbot request succeeded", {
      discordUserId,
      channelId,
      duration,
    })

    return parsedBody
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Error during chatbot request", error, {
      discordUserId,
      channelId,
      duration,
    })
    throw error
  }
}

async function clearChatContext({ discordUserId, channelId }) {
  const startTime = Date.now()

  logger.debug("Clearing Discord chat context", {
    discordUserId,
    channelId,
  })

  try {
    const response = await fetch(`${BASE_URL}/api/discord/chat/clear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOT_SHARED_SECRET}`,
      },
      body: JSON.stringify({
        discordUserId,
        channelId,
      }),
    })

    const duration = Date.now() - startTime
    const rawBody = await response.text()
    let parsedBody = {}

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody)
      } catch (parseError) {
        logger.error("Failed to parse clear response JSON", parseError, {
          discordUserId,
          channelId,
          rawBody: rawBody.substring(0, 200),
        })
        throw new Error("Invalid clear response payload")
      }
    }

    if (!response.ok) {
      logger.warn("Clear context request failed", {
        discordUserId,
        channelId,
        status: response.status,
        duration,
        body: rawBody.substring(0, 200),
      })

      if (response.status === 403 && parsedBody && parsedBody.linked === false) {
        return { success: false, linked: false, error: parsedBody.error }
      }

      throw new Error(parsedBody?.error || `Clear context request failed (${response.status})`)
    }

    logger.debug("Clear context request succeeded", {
      discordUserId,
      channelId,
      duration,
    })

    return parsedBody
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Error during clear context request", error, {
      discordUserId,
      channelId,
      duration,
    })
    throw error
  }
}

function buildChatInput({ content, attachments, botId }) {
  const strippedMention = stripBotMention(content ?? "", botId)
  const strippedCommand = stripCommandPrefix(strippedMention)
  const attachmentSummary = describeAttachments(attachments)

  return [strippedCommand, attachmentSummary].filter(Boolean).join("\n\n").trim()
}

function stripBotMention(content, botId) {
  if (!botId) {
    return content?.trim() || ""
  }

  const mentionPattern = new RegExp(`<@!?${botId}>`, "gi")
  return (content || "").replace(mentionPattern, " ").replace(/\s+/g, " ").trim()
}

function stripCommandPrefix(content) {
  const trimmed = content?.trim() || ""
  if (!trimmed) {
    return ""
  }

  const lower = trimmed.toLowerCase()
  for (const prefix of CHAT_TRIGGER_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return trimmed.slice(prefix.length).trim()
    }
  }

  return trimmed
}

function describeAttachments(attachments) {
  if (!attachments || attachments.length === 0) {
    return ""
  }

  const lines = attachments.map((attachment, index) => {
    const label = attachment.name || `Attachment ${index + 1}`
    return `${index + 1}. ${label} - ${attachment.url}`
  })

  return `Attachments:\n${lines.join("\n")}`
}

// Log startup information
logger.info("Starting Discord bot", {
  baseUrl: BASE_URL,
  supportChannelId: SUPPORT_CHANNEL_ID,
  threadIds: LISTEN_THREAD_IDS,
  hasBotToken: !!BOT_TOKEN,
  hasSharedSecret: !!BOT_SHARED_SECRET,
})

// Handle client errors
client.on(Events.Error, (error) => {
  logger.error("Discord client error", error)
})

client.on(Events.Warn, (warning) => {
  logger.warn("Discord client warning", { warning })
})

client.on(Events.Debug, (info) => {
  logger.debug("Discord client debug", { info })
})

// Handle disconnects
client.on(Events.ShardDisconnect, (event, shardId) => {
  logger.warn("Discord shard disconnected", {
    shardId,
    code: event.code,
    reason: event.reason,
  })
})

client.on(Events.ShardReconnecting, (shardId) => {
  logger.info("Discord shard reconnecting", { shardId })
})

client.on(Events.ShardResume, (shardId, replayed) => {
  logger.info("Discord shard resumed", {
    shardId,
    replayedEvents: replayed,
  })
})

client.login(BOT_TOKEN).catch((error) => {
  logger.error("Failed to login to Discord", error, {
    hasToken: !!BOT_TOKEN,
  })
  process.exit(1)
})

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully")
  client.destroy().then(() => {
    logger.info("Discord client destroyed")
    process.exit(0)
  })
})

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully")
  client.destroy().then(() => {
    logger.info("Discord client destroyed")
    process.exit(0)
  })
})

