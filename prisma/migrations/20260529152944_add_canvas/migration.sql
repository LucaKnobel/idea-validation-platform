-- CreateEnum
CREATE TYPE "CanvasElementType" AS ENUM ('CUSTOMER_SEGMENTS', 'VALUE_PROPOSITIONS', 'CHANNELS', 'CUSTOMER_RELATIONSHIPS', 'REVENUE_STREAMS', 'KEY_RESOURCES', 'KEY_ACTIVITIES', 'KEY_PARTNERS', 'COST_STRUCTURE');

-- CreateTable
CREATE TABLE "canvasElement" (
    "id" TEXT NOT NULL,
    "ideaVersionId" TEXT NOT NULL,
    "type" "CanvasElementType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvasElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canvasElement_ideaVersionId_idx" ON "canvasElement"("ideaVersionId");

-- CreateIndex
CREATE INDEX "canvasElement_ideaVersionId_type_idx" ON "canvasElement"("ideaVersionId", "type");

-- AddForeignKey
ALTER TABLE "canvasElement" ADD CONSTRAINT "canvasElement_ideaVersionId_fkey" FOREIGN KEY ("ideaVersionId") REFERENCES "ideaVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
