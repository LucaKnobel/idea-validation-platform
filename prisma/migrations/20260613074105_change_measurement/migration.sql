/*
  Warnings:

  - You are about to drop the column `experimentId` on the `measurement` table. All the data in the column will be lost.
  - You are about to drop the column `metricId` on the `measurement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hypothesisId]` on the table `measurement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hypothesisId` to the `measurement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "measurement" DROP CONSTRAINT "measurement_experimentId_fkey";

-- DropForeignKey
ALTER TABLE "measurement" DROP CONSTRAINT "measurement_metricId_fkey";

-- DropIndex
DROP INDEX "measurement_experimentId_key";

-- DropIndex
DROP INDEX "measurement_metricId_key";

-- AlterTable
ALTER TABLE "measurement" DROP COLUMN "experimentId",
DROP COLUMN "metricId",
ADD COLUMN     "hypothesisId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "measurement_hypothesisId_key" ON "measurement"("hypothesisId");

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_hypothesisId_fkey" FOREIGN KEY ("hypothesisId") REFERENCES "hypothesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
