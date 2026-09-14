-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "copyrightText" TEXT,
    "trustBadge1Title" TEXT,
    "trustBadge1Desc" TEXT,
    "trustBadge2Title" TEXT,
    "trustBadge2Desc" TEXT,
    "trustBadge3Title" TEXT,
    "trustBadge3Desc" TEXT,
    "trustBadge4Title" TEXT,
    "trustBadge4Desc" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
