/*
  Warnings:

  - You are about to drop the column `avatar` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `county` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `league_type` on the `leagues` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `season` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `leagues` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."leagues_name_key";

-- AlterTable
ALTER TABLE "public"."leagues" DROP COLUMN "avatar",
DROP COLUMN "country",
DROP COLUMN "county",
DROP COLUMN "league_type",
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "season" TEXT NOT NULL,
ADD COLUMN     "sport" TEXT NOT NULL,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL;
