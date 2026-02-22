-- AlterTable
ALTER TABLE "courts" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "courts_sourceUrl_idx" ON "courts"("sourceUrl");
