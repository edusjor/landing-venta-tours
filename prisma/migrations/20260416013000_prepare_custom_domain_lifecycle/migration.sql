-- CreateEnum
CREATE TYPE "AgencyDomainVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgencyDomainTlsStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'ACTIVE', 'FAILED');

-- AlterTable
ALTER TABLE "AgencyDomain"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "verificationStatus" "AgencyDomainVerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "verificationRecordType" TEXT,
  ADD COLUMN "verificationRecordName" TEXT,
  ADD COLUMN "verificationRecordValue" TEXT,
  ADD COLUMN "verificationCheckedAt" TIMESTAMP(3),
  ADD COLUMN "verificationFailureReason" TEXT,
  ADD COLUMN "tlsStatus" "AgencyDomainTlsStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN "tlsCheckedAt" TIMESTAMP(3),
  ADD COLUMN "tlsFailureReason" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill current subdomains/domains to verification + TLS state
UPDATE "AgencyDomain"
SET
  "verificationStatus" = CASE
    WHEN "isVerified" THEN 'VERIFIED'::"AgencyDomainVerificationStatus"
    ELSE 'PENDING'::"AgencyDomainVerificationStatus"
  END,
  "tlsStatus" = CASE
    WHEN "type" = 'SUBDOMAIN'::"AgencyDomainType" AND "isVerified" THEN 'ACTIVE'::"AgencyDomainTlsStatus"
    ELSE "tlsStatus"
  END;

-- CreateIndex
CREATE INDEX "AgencyDomain_agencyId_type_isPrimary_idx" ON "AgencyDomain"("agencyId", "type", "isPrimary");
CREATE INDEX "AgencyDomain_agencyId_isActive_idx" ON "AgencyDomain"("agencyId", "isActive");
