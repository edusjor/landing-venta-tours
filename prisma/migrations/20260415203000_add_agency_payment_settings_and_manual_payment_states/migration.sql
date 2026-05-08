-- CreateEnum
CREATE TYPE "AgencyPaymentMode" AS ENUM ('GATEWAY', 'MANUAL', 'BOTH');

-- CreateTable
CREATE TABLE "AgencyPaymentSettings" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "paymentMode" "AgencyPaymentMode" NOT NULL DEFAULT 'BOTH',
    "gatewayProvider" TEXT,
    "gatewayConfigJson" JSONB,
    "manualPaymentInstructions" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountIban" TEXT,
    "sinpeMobile" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyPaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPaymentSettings_agencyId_key" ON "AgencyPaymentSettings"("agencyId");

-- Reservation status migration
CREATE TYPE "ReservationStatus_new" AS ENUM ('PENDING', 'PENDING_PAYMENT', 'PAYMENT_REVIEW', 'CONFIRMED', 'CANCELLED', 'REJECTED');

ALTER TABLE "Reservation" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Reservation"
ALTER COLUMN "status" TYPE "ReservationStatus_new"
USING (
  CASE
    WHEN "status"::text = 'PENDING_VALIDATION' THEN 'PAYMENT_REVIEW'::"ReservationStatus_new"
    WHEN "status"::text = 'PENDING' THEN 'PENDING'::"ReservationStatus_new"
    WHEN "status"::text = 'CONFIRMED' THEN 'CONFIRMED'::"ReservationStatus_new"
    WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'::"ReservationStatus_new"
    ELSE 'PENDING'::"ReservationStatus_new"
  END
);

ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "ReservationStatus";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";

-- AddColumns
ALTER TABLE "Reservation" ADD COLUMN "manualPaymentProofUrl" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "paymentReviewNote" TEXT;

-- Backfill manual proof from previous SINPE field when present
UPDATE "Reservation"
SET "manualPaymentProofUrl" = "sinpeReceiptUrl"
WHERE "manualPaymentProofUrl" IS NULL
  AND "sinpeReceiptUrl" IS NOT NULL;

-- ForeignKey
ALTER TABLE "AgencyPaymentSettings" ADD CONSTRAINT "AgencyPaymentSettings_agencyId_fkey"
FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed defaults for existing agencies
INSERT INTO "AgencyPaymentSettings" (
  "agencyId",
  "paymentMode",
  "gatewayProvider",
  "manualPaymentInstructions",
  "updatedAt"
)
SELECT
  a."id",
  'BOTH'::"AgencyPaymentMode",
  'ONVO',
  'Realiza tu transferencia o SINPE móvil y comparte el comprobante para validación manual.',
  NOW()
FROM "Agency" a
ON CONFLICT ("agencyId") DO NOTHING;
