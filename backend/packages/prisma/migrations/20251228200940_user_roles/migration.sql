/*
  Warnings:

  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CustomerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `service` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `CustomerProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `CustomerProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('draft', 'published', 'hidden', 'closed');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('booked', 'canceled');

-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('USER', 'LECTOR', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_locationId_fkey";

-- DropIndex
DROP INDEX "CustomerProfile_email_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "description",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "CustomerProfile" DROP COLUMN "isAdmin",
DROP COLUMN "updatedAt",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "entityType",
DROP COLUMN "ip",
DROP COLUMN "payload",
DROP COLUMN "service",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "entity" TEXT,
ADD COLUMN     "meta" JSONB;

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "Location";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "EventStatus";

-- CreateTable
CREATE TABLE "ClassType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "classTypeId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "TimeSlotStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "role" "UserRoleType" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'booked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassType_categoryId_idx" ON "ClassType"("categoryId");

-- CreateIndex
CREATE INDEX "TimeSlot_startAt_idx" ON "TimeSlot"("startAt");

-- CreateIndex
CREATE INDEX "TimeSlot_status_idx" ON "TimeSlot"("status");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "Reservation_timeSlotId_idx" ON "Reservation"("timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- AddForeignKey
ALTER TABLE "ClassType" ADD CONSTRAINT "ClassType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "ClassType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
