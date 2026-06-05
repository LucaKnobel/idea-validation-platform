-- CreateEnum
CREATE TYPE "MetricDataType" AS ENUM ('NUMBER', 'PERCENT', 'CURRENCY');

-- CreateEnum
CREATE TYPE "ThresholdOperator" AS ENUM ('GTE', 'GT', 'LTE', 'LT', 'EQ');

-- CreateTable
CREATE TABLE "metric" (
    "id" TEXT NOT NULL,
    "hypothesisId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataType" "MetricDataType" NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metricThreshold" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "operator" "ThresholdOperator" NOT NULL,
    "referenceValue" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metricThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_hypothesisId_idx" ON "metric"("hypothesisId");

-- CreateIndex
CREATE UNIQUE INDEX "metricThreshold_metricId_key" ON "metricThreshold"("metricId");

-- AddForeignKey
ALTER TABLE "metric" ADD CONSTRAINT "metric_hypothesisId_fkey" FOREIGN KEY ("hypothesisId") REFERENCES "hypothesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricThreshold" ADD CONSTRAINT "metricThreshold_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
