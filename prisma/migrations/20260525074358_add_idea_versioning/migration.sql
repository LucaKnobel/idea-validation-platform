/*
  Warnings:

  - You are about to drop the column `description` on the `idea` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `idea` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IdeaVersionType" AS ENUM ('INITIAL', 'ITERATION', 'PIVOT');

-- AlterTable
ALTER TABLE "idea" DROP COLUMN "description",
DROP COLUMN "title";

-- CreateTable
CREATE TABLE "ideaVersion" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "type" "IdeaVersionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideaVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ideaVersion_ideaId_idx" ON "ideaVersion"("ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "ideaVersion_ideaId_versionNumber_key" ON "ideaVersion"("ideaId", "versionNumber");

-- AddForeignKey
ALTER TABLE "ideaVersion" ADD CONSTRAINT "ideaVersion_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
