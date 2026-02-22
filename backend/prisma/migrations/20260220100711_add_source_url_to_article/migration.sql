-- AlterTable
ALTER TABLE "articles" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "articles_sourceUrl_idx" ON "articles"("sourceUrl");
