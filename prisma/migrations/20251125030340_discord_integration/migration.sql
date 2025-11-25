-- CreateTable
CREATE TABLE "DiscordIntegration" (
    "id" TEXT NOT NULL DEFAULT 'discord',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "clientSecret" TEXT,
    "guildId" TEXT,
    "metadataKey" TEXT NOT NULL DEFAULT 'plex_member',
    "metadataValue" TEXT NOT NULL DEFAULT '1',
    "platformName" TEXT NOT NULL DEFAULT 'Plex Wrapped',
    "instructions" TEXT,
    "botSharedSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "DiscordIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "discriminator" TEXT,
    "globalName" TEXT,
    "avatar" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadataSyncedAt" TIMESTAMP(3),
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordOAuthState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "redirectTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "DiscordOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordConnection_userId_key" ON "DiscordConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordConnection_discordUserId_key" ON "DiscordConnection"("discordUserId");

-- CreateIndex
CREATE INDEX "DiscordConnection_discordUserId_idx" ON "DiscordConnection"("discordUserId");

-- CreateIndex
CREATE INDEX "DiscordConnection_linkedAt_idx" ON "DiscordConnection"("linkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordOAuthState_state_key" ON "DiscordOAuthState"("state");

-- CreateIndex
CREATE INDEX "DiscordOAuthState_state_idx" ON "DiscordOAuthState"("state");

-- CreateIndex
CREATE INDEX "DiscordOAuthState_userId_idx" ON "DiscordOAuthState"("userId");

-- CreateIndex
CREATE INDEX "DiscordOAuthState_expiresAt_idx" ON "DiscordOAuthState"("expiresAt");

-- AddForeignKey
ALTER TABLE "DiscordConnection" ADD CONSTRAINT "DiscordConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscordOAuthState" ADD CONSTRAINT "DiscordOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
