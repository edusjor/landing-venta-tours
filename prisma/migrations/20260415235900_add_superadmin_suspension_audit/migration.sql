-- CreateEnum
CREATE TYPE "SuspendedStorefrontMode" AS ENUM ('BLOCK', 'HIDE');

-- AlterTable
ALTER TABLE "Agency"
  ADD COLUMN "internalSubdomain" TEXT,
  ADD COLUMN "suspendedStorefrontMode" "SuspendedStorefrontMode" NOT NULL DEFAULT 'BLOCK';

-- Backfill internal subdomain for existing agencies
UPDATE "Agency"
SET "internalSubdomain" = "slug"
WHERE "internalSubdomain" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Agency_internalSubdomain_key" ON "Agency"("internalSubdomain");

-- CreateTable
CREATE TABLE "AgencyAuditLog" (
  "id" SERIAL NOT NULL,
  "agencyId" INTEGER NOT NULL,
  "userId" INTEGER,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgencyAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyAuditLog_agencyId_createdAt_idx" ON "AgencyAuditLog"("agencyId", "createdAt");
CREATE INDEX "AgencyAuditLog_userId_createdAt_idx" ON "AgencyAuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgencyAuditLog"
  ADD CONSTRAINT "AgencyAuditLog_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgencyAuditLog"
  ADD CONSTRAINT "AgencyAuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
