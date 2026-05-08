-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('ACTIVE', 'TRASHED');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "agencyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "originalRelativePath" TEXT,
    "url" TEXT NOT NULL,
    "extension" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_agencyId_relativePath_key" ON "MediaAsset"("agencyId", "relativePath");

-- CreateIndex
CREATE INDEX "MediaAsset_agencyId_status_idx" ON "MediaAsset"("agencyId", "status");