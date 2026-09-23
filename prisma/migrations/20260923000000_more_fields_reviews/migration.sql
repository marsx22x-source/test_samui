-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "allowPets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowSmoking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bathrooms" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "deposit" INTEGER,
ADD COLUMN     "distanceToBeach" INTEGER,
ADD COLUMN     "minNights" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "stayDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_propertyId_idx" ON "Review"("propertyId");

-- CreateIndex
CREATE INDEX "Property_pricePerNight_idx" ON "Property"("pricePerNight");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

