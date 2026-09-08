-- Add gadget-specific inventory tracking and warranties.
CREATE TYPE "ProductTrackingMode" AS ENUM ('QUANTITY', 'SERIALIZED');
CREATE TYPE "ProductUnitStatus" AS ENUM ('AVAILABLE', 'SOLD');
CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'VOIDED');

ALTER TABLE "Product"
ADD COLUMN "trackingMode" "ProductTrackingMode" NOT NULL DEFAULT 'QUANTITY',
ADD COLUMN "warrantyMonths" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "SaleItem" ADD COLUMN "unitId" TEXT;

CREATE TABLE "ProductUnit" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "imei" TEXT,
    "status" "ProductUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductUnit_serialNumber_key" ON "ProductUnit"("serialNumber");
CREATE UNIQUE INDEX "ProductUnit_imei_key" ON "ProductUnit"("imei");
CREATE INDEX "ProductUnit_productId_status_idx" ON "ProductUnit"("productId", "status");
CREATE UNIQUE INDEX "SaleItem_unitId_key" ON "SaleItem"("unitId");
CREATE UNIQUE INDEX "Warranty_saleItemId_key" ON "Warranty"("saleItemId");
CREATE INDEX "Warranty_status_expiresAt_idx" ON "Warranty"("status", "expiresAt");

ALTER TABLE "ProductUnit"
ADD CONSTRAINT "ProductUnit_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "ProductUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Warranty"
ADD CONSTRAINT "Warranty_saleItemId_fkey"
FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
