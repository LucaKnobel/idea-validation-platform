-- CreateTable
CREATE TABLE "measurement" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "measurement_experimentId_idx" ON "measurement"("experimentId");

-- CreateIndex
CREATE INDEX "measurement_metricId_idx" ON "measurement"("metricId");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_experimentId_metricId_key" ON "measurement"("experimentId", "metricId");

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement" ADD CONSTRAINT "measurement_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
