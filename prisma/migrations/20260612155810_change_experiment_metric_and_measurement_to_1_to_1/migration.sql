/*
  Warnings:

  - A unique constraint covering the columns `[hypothesisId]` on the table `experiment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[experimentId]` on the table `measurement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[metricId]` on the table `measurement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hypothesisId]` on the table `metric` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `evidenceType` to the `hypothesis` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HypothesisStatus" AS ENUM ('NOT_TESTED', 'VALIDATED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('QUALITATIVE', 'QUANTITATIVE', 'BEHAVIORAL', 'MONETARY');

-- DropIndex
DROP INDEX "experiment_hypothesisId_idx";

-- DropIndex
DROP INDEX "measurement_experimentId_idx";

-- DropIndex
DROP INDEX "measurement_experimentId_metricId_key";

-- DropIndex
DROP INDEX "measurement_metricId_idx";

-- DropIndex
DROP INDEX "metric_hypothesisId_idx";

-- AlterTable
ALTER TABLE "hypothesis" ADD COLUMN     "evidenceType" "EvidenceType" NOT NULL,
ADD COLUMN     "status" "HypothesisStatus" NOT NULL DEFAULT 'NOT_TESTED';

-- CreateIndex
CREATE UNIQUE INDEX "experiment_hypothesisId_key" ON "experiment"("hypothesisId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_experimentId_key" ON "measurement"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_metricId_key" ON "measurement"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "metric_hypothesisId_key" ON "metric"("hypothesisId");
