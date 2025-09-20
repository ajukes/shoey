/*
  Warnings:

  - You are about to drop the column `date_time` on the `games` table. All the data in the column will be lost.
  - Added the required column `date` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `game_time` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meet_time` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."KitType" AS ENUM ('HOME', 'AWAY');

-- AlterTable
ALTER TABLE "public"."games" DROP COLUMN "date_time",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "game_time" TEXT NOT NULL,
ADD COLUMN     "kit" "public"."KitType" NOT NULL DEFAULT 'HOME',
ADD COLUMN     "meet_time" TEXT NOT NULL,
ADD COLUMN     "opponent" TEXT;
