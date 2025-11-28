-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV_SERIES', 'EPISODE');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('FLAG_FOR_REVIEW', 'AUTO_DELETE');

-- CreateEnum
CREATE TYPE "MarkType" AS ENUM ('FINISHED_WATCHING', 'NOT_INTERESTED', 'KEEP_FOREVER', 'REWATCH_CANDIDATE', 'POOR_QUALITY', 'WRONG_VERSION');

-- CreateEnum
CREATE TYPE "IntentType" AS ENUM ('PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "MaintenanceRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mediaType" "MediaType" NOT NULL,
    "criteria" JSONB NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "schedule" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceScan" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "itemsScanned" INTEGER NOT NULL DEFAULT 0,
    "itemsFlagged" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceCandidate" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "plexRatingKey" TEXT NOT NULL,
    "radarrId" INTEGER,
    "sonarrId" INTEGER,
    "tmdbId" INTEGER,
    "tvdbId" INTEGER,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "poster" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "lastWatchedAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3),
    "matchedRules" JSONB NOT NULL,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewStatus" "ReviewStatus" NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceDeletionLog" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "fileSize" BIGINT,
    "deletedBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedFrom" TEXT NOT NULL,
    "filesDeleted" BOOLEAN NOT NULL,
    "ruleNames" JSONB NOT NULL,

    CONSTRAINT "MaintenanceDeletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMediaMark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "plexRatingKey" TEXT NOT NULL,
    "radarrId" INTEGER,
    "sonarrId" INTEGER,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "seasonNumber" INTEGER,
    "episodeNumber" INTEGER,
    "parentTitle" TEXT,
    "markType" "MarkType" NOT NULL,
    "note" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedVia" TEXT NOT NULL,
    "discordChannelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMediaMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWatchIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plexRatingKey" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "intentType" "IntentType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "currentSeason" INTEGER,
    "currentEpisode" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserWatchIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceRule_enabled_idx" ON "MaintenanceRule"("enabled");

-- CreateIndex
CREATE INDEX "MaintenanceRule_nextRunAt_idx" ON "MaintenanceRule"("nextRunAt");

-- CreateIndex
CREATE INDEX "MaintenanceRule_mediaType_idx" ON "MaintenanceRule"("mediaType");

-- CreateIndex
CREATE INDEX "MaintenanceScan_ruleId_createdAt_idx" ON "MaintenanceScan"("ruleId", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceScan_status_idx" ON "MaintenanceScan"("status");

-- CreateIndex
CREATE INDEX "MaintenanceCandidate_scanId_reviewStatus_idx" ON "MaintenanceCandidate"("scanId", "reviewStatus");

-- CreateIndex
CREATE INDEX "MaintenanceCandidate_mediaType_reviewStatus_idx" ON "MaintenanceCandidate"("mediaType", "reviewStatus");

-- CreateIndex
CREATE INDEX "MaintenanceCandidate_reviewStatus_flaggedAt_idx" ON "MaintenanceCandidate"("reviewStatus", "flaggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceCandidate_scanId_plexRatingKey_key" ON "MaintenanceCandidate"("scanId", "plexRatingKey");

-- CreateIndex
CREATE INDEX "MaintenanceDeletionLog_deletedAt_idx" ON "MaintenanceDeletionLog"("deletedAt");

-- CreateIndex
CREATE INDEX "MaintenanceDeletionLog_deletedBy_idx" ON "MaintenanceDeletionLog"("deletedBy");

-- CreateIndex
CREATE INDEX "UserMediaMark_userId_mediaType_idx" ON "UserMediaMark"("userId", "mediaType");

-- CreateIndex
CREATE INDEX "UserMediaMark_plexRatingKey_idx" ON "UserMediaMark"("plexRatingKey");

-- CreateIndex
CREATE INDEX "UserMediaMark_markType_idx" ON "UserMediaMark"("markType");

-- CreateIndex
CREATE INDEX "UserMediaMark_markedAt_idx" ON "UserMediaMark"("markedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserMediaMark_userId_plexRatingKey_markType_key" ON "UserMediaMark"("userId", "plexRatingKey", "markType");

-- CreateIndex
CREATE INDEX "UserWatchIntent_userId_intentType_idx" ON "UserWatchIntent"("userId", "intentType");

-- CreateIndex
CREATE INDEX "UserWatchIntent_plexRatingKey_idx" ON "UserWatchIntent"("plexRatingKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserWatchIntent_userId_plexRatingKey_key" ON "UserWatchIntent"("userId", "plexRatingKey");

-- AddForeignKey
ALTER TABLE "MaintenanceScan" ADD CONSTRAINT "MaintenanceScan_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "MaintenanceRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCandidate" ADD CONSTRAINT "MaintenanceCandidate_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "MaintenanceScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMediaMark" ADD CONSTRAINT "UserMediaMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWatchIntent" ADD CONSTRAINT "UserWatchIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
