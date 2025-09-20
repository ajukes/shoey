/*
  Warnings:

  - You are about to drop the column `date` on the `games` table. All the data in the column will be lost.
  - Added the required column `date_time` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."games" DROP COLUMN "date",
ADD COLUMN     "date_time" TIMESTAMP(3) NOT NULL;
