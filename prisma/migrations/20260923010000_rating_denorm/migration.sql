-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "ratingAvg" DOUBLE PRECISION,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;


-- Backfill: посчитать рейтинг по существующим отзывам
UPDATE "Property" p
SET "ratingAvg" = sub.avg, "ratingCount" = sub.cnt
FROM (
  SELECT "propertyId", AVG("rating")::double precision AS avg, COUNT(*)::int AS cnt
  FROM "Review"
  GROUP BY "propertyId"
) sub
WHERE p.id = sub."propertyId";
