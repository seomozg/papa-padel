/*
  Warnings:

  - Added the required column `slug` to the `courts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_courts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "amenities" JSONB NOT NULL,
    "phone" TEXT,
    "workingHours" TEXT,
    "description" TEXT,
    "prices" JSONB NOT NULL,
    "image" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "courtsCount" INTEGER NOT NULL DEFAULT 1,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_courts" ("address", "amenities", "city", "coordinates", "courtsCount", "createdAt", "description", "id", "image", "likes", "name", "phone", "prices", "rating", "reviewCount", "tags", "type", "updatedAt", "workingHours") SELECT "address", "amenities", "city", "coordinates", "courtsCount", "createdAt", "description", "id", "image", "likes", "name", "phone", "prices", "rating", "reviewCount", "tags", "type", "updatedAt", "workingHours" FROM "courts";
DROP TABLE "courts";
ALTER TABLE "new_courts" RENAME TO "courts";
CREATE UNIQUE INDEX "courts_slug_key" ON "courts"("slug");
CREATE INDEX "courts_city_idx" ON "courts"("city");
CREATE INDEX "courts_type_idx" ON "courts"("type");
CREATE INDEX "courts_rating_idx" ON "courts"("rating");
CREATE INDEX "courts_slug_idx" ON "courts"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
