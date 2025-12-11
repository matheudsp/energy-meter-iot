-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INTEGRATOR', 'OWNER', 'TENANT');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('PROVISIONED', 'ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TENANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "name" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "serialNumber" TEXT NOT NULL,
    "firmwareVersion" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'PROVISIONED',
    "plantId" TEXT NOT NULL,
    "metadata" JSONB,
    "lastSeenAt" TIMESTAMPTZ,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMap" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "deviceId" TEXT NOT NULL,
    "channelIndex" INTEGER NOT NULL DEFAULT 0,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "ChannelMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenancy" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ,

    CONSTRAINT "Tenancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "pricePerKwh" DECIMAL(10,4) NOT NULL,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMap" ADD CONSTRAINT "ChannelMap_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMap" ADD CONSTRAINT "ChannelMap_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenancy" ADD CONSTRAINT "Tenancy_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenancy" ADD CONSTRAINT "Tenancy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
