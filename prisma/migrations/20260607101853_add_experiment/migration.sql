-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "experiment" (
    "id" TEXT NOT NULL,
    "hypothesisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT,
    "status" "ExperimentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiment_hypothesisId_idx" ON "experiment"("hypothesisId");

-- AddForeignKey
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_hypothesisId_fkey" FOREIGN KEY ("hypothesisId") REFERENCES "hypothesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
