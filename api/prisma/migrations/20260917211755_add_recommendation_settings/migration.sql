-- CreateEnum
CREATE TYPE "RecommendationStrategyKind" AS ENUM ('RULES', 'ML');

-- CreateTable
CREATE TABLE "RecommendationSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "strategy" "RecommendationStrategyKind" NOT NULL DEFAULT 'RULES',
    "limit" INTEGER NOT NULL DEFAULT 4,
    "preferSameBrand" BOOLEAN NOT NULL DEFAULT true,
    "priceTolerancePct" INTEGER NOT NULL DEFAULT 40,
    "useCoPurchase" BOOLEAN NOT NULL DEFAULT true,
    "mlEndpoint" TEXT,
    "mlApiKeyEncrypted" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationSettings_pkey" PRIMARY KEY ("id")
);
