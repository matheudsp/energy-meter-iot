/*
  Warnings:

  - The values [PROVISIONED] on the enum `DeviceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceStatus_new" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');
ALTER TABLE "public"."Device" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Device" ALTER COLUMN "status" TYPE "DeviceStatus_new" USING ("status"::text::"DeviceStatus_new");
ALTER TYPE "DeviceStatus" RENAME TO "DeviceStatus_old";
ALTER TYPE "DeviceStatus_new" RENAME TO "DeviceStatus";
DROP TYPE "public"."DeviceStatus_old";
ALTER TABLE "Device" ALTER COLUMN "status" SET DEFAULT 'OFFLINE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_plantId_fkey";

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "status" SET DEFAULT 'OFFLINE',
ALTER COLUMN "plantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
