-- CreateTable
CREATE TABLE "DiscordChatSession" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "discordChannelId" TEXT NOT NULL,
    "chatConversationId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscordChatSession_discordUserId_idx" ON "DiscordChatSession"("discordUserId");

-- CreateIndex
CREATE INDEX "DiscordChatSession_chatConversationId_idx" ON "DiscordChatSession"("chatConversationId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordChatSession_discordUserId_discordChannelId_key" ON "DiscordChatSession"("discordUserId", "discordChannelId");

-- AddForeignKey
ALTER TABLE "DiscordChatSession" ADD CONSTRAINT "DiscordChatSession_chatConversationId_fkey" FOREIGN KEY ("chatConversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
