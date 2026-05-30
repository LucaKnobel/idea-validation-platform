-- CreateEnum
CREATE TYPE "HypothesisDimension" AS ENUM ('PROBLEM', 'SOLUTION', 'MARKET', 'MONETIZATION', 'EXECUTION');

-- CreateEnum
CREATE TYPE "HypothesisPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "hypothesis" (
    "id" TEXT NOT NULL,
    "ideaVersionId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "dimension" "HypothesisDimension" NOT NULL,
    "priority" "HypothesisPriority" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hypothesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hypothesisCanvasSection" (
    "id" TEXT NOT NULL,
    "hypothesisId" TEXT NOT NULL,
    "canvasElementType" "CanvasElementType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hypothesisCanvasSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hypothesis_ideaVersionId_idx" ON "hypothesis"("ideaVersionId");

-- CreateIndex
CREATE INDEX "hypothesisCanvasSection_canvasElementType_idx" ON "hypothesisCanvasSection"("canvasElementType");

-- CreateIndex
CREATE UNIQUE INDEX "hypothesisCanvasSection_hypothesisId_canvasElementType_key" ON "hypothesisCanvasSection"("hypothesisId", "canvasElementType");

-- AddForeignKey
ALTER TABLE "hypothesis" ADD CONSTRAINT "hypothesis_ideaVersionId_fkey" FOREIGN KEY ("ideaVersionId") REFERENCES "ideaVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hypothesisCanvasSection" ADD CONSTRAINT "hypothesisCanvasSection_hypothesisId_fkey" FOREIGN KEY ("hypothesisId") REFERENCES "hypothesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
