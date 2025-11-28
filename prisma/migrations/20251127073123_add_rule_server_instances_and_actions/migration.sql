-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionType" ADD VALUE 'UNMONITOR_AND_DELETE';
ALTER TYPE "ActionType" ADD VALUE 'UNMONITOR_AND_KEEP';
ALTER TYPE "ActionType" ADD VALUE 'DO_NOTHING';

-- AlterTable
ALTER TABLE "MaintenanceRule" ADD COLUMN     "actionDelayDays" INTEGER,
ADD COLUMN     "radarrId" TEXT,
ADD COLUMN     "sonarrId" TEXT;

-- AddForeignKey
ALTER TABLE "MaintenanceRule" ADD CONSTRAINT "MaintenanceRule_radarrId_fkey" FOREIGN KEY ("radarrId") REFERENCES "Radarr"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRule" ADD CONSTRAINT "MaintenanceRule_sonarrId_fkey" FOREIGN KEY ("sonarrId") REFERENCES "Sonarr"("id") ON DELETE SET NULL ON UPDATE CASCADE;
