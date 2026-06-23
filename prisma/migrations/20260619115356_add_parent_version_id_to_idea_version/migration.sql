-- AlterTable
ALTER TABLE "ideaVersion" ADD COLUMN     "parentVersionId" TEXT;

-- CreateIndex
CREATE INDEX "ideaVersion_parentVersionId_idx" ON "ideaVersion"("parentVersionId");

-- AddForeignKey
ALTER TABLE "ideaVersion" ADD CONSTRAINT "ideaVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ideaVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
