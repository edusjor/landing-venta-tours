-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AgencyDomainType" AS ENUM ('SUBDOMAIN', 'CUSTOM_DOMAIN');

-- CreateEnum
CREATE TYPE "AgencyUserRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'AGENT', 'VIEWER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'PENDING_VALIDATION', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Agency" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "description" TEXT,
    "status" "AgencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agency_slug_key" UNIQUE ("slug")
);

-- CreateTable
CREATE TABLE "AgencyDomain" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "agencyId" INTEGER NOT NULL,
    "host" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "type" "AgencyDomainType" NOT NULL DEFAULT 'SUBDOMAIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyDomain_host_key" UNIQUE ("host"),
    CONSTRAINT "AgencyDomain_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "agencyId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "AgencyUserRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed a compatibility agency for the current single-tenant installation.
INSERT INTO "Agency" ("name", "slug", "status")
VALUES ('Agencia Base', 'default', 'ACTIVE')
ON CONFLICT ("slug") DO NOTHING;

-- AlterTable
ALTER TABLE "Category"
ADD COLUMN "agencyId" INTEGER;

-- AlterTable
ALTER TABLE "Tour"
ADD COLUMN "agencyId" INTEGER,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Reservation"
ADD COLUMN "agencyId" INTEGER,
ADD COLUMN "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill existing rows into the default agency.
UPDATE "Category"
SET "agencyId" = "Agency"."id"
FROM "Agency"
WHERE "Agency"."slug" = 'default'
  AND "Category"."agencyId" IS NULL;

UPDATE "Tour"
SET "agencyId" = "Agency"."id"
FROM "Agency"
WHERE "Agency"."slug" = 'default'
  AND "Tour"."agencyId" IS NULL;

UPDATE "Reservation"
SET "status" = CASE
    WHEN "paid" = true THEN 'CONFIRMED'::"ReservationStatus"
    WHEN COALESCE("paymentMethod", '') = 'SINPE Movil' THEN 'PENDING_VALIDATION'::"ReservationStatus"
    ELSE 'PENDING'::"ReservationStatus"
END;

UPDATE "Reservation" AS r
SET "agencyId" = t."agencyId"
FROM "Tour" AS t
WHERE r."tourId" = t."id"
  AND r."agencyId" IS NULL;

ALTER TABLE "Category"
ALTER COLUMN "agencyId" SET NOT NULL;

ALTER TABLE "Tour"
ALTER COLUMN "agencyId" SET NOT NULL;

ALTER TABLE "Reservation"
ALTER COLUMN "agencyId" SET NOT NULL;

-- Drop legacy global uniqueness before replacing it with agency-scoped uniqueness.
ALTER TABLE "Category"
DROP CONSTRAINT "Category_name_key";

DROP INDEX IF EXISTS "Tour_slug_key";

-- AddForeignKey
ALTER TABLE "Category"
ADD CONSTRAINT "Category_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tour"
ADD CONSTRAINT "Tour_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AgencyDomain_agencyId_idx" ON "AgencyDomain"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_agencyId_email_key" ON "User"("agencyId", "email");

-- CreateIndex
CREATE INDEX "User_agencyId_role_idx" ON "User"("agencyId", "role");

-- CreateIndex
CREATE INDEX "Category_agencyId_idx" ON "Category"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_agencyId_name_key" ON "Category"("agencyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tour_agencyId_slug_key" ON "Tour"("agencyId", "slug");

-- CreateIndex
CREATE INDEX "Tour_agencyId_createdAt_idx" ON "Tour"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Reservation_agencyId_createdAt_idx" ON "Reservation"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Reservation_agencyId_status_idx" ON "Reservation"("agencyId", "status");