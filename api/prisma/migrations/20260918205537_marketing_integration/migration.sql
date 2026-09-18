-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN     "syncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MarketingSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "apiKeyEncrypted" TEXT,
    "groupId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncResult" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSettings_pkey" PRIMARY KEY ("id")
);
