-- CreateEnum
CREATE TYPE "BannerSize" AS ENUM ('LARGE', 'SMALL');

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "size" "BannerSize" NOT NULL DEFAULT 'LARGE',
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "linkUrl" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_active_order_idx" ON "Banner"("active", "order");

-- Semeia os dois banners que estavam fixos no código, para a homepage não
-- ficar sem hero antes de o admin criar as suas próprias campanhas.
INSERT INTO "Banner" (id, size, eyebrow, title, description, "linkUrl", "ctaLabel", "order", "updatedAt") VALUES
(
    md5(random()::text || clock_timestamp()::text || 'banner-1'),
    'LARGE',
    'Campanha da semana',
    'Até 30% de desconto em eletrodomésticos de cozinha',
    'Renove a sua cozinha com as melhores marcas e entrega rápida em todo o país.',
    '/catalogo/eletrodomesticos',
    'Ver ofertas',
    0,
    now()
),
(
    md5(random()::text || clock_timestamp()::text || 'banner-2'),
    'SMALL',
    'Destaque',
    'Imagem e Som',
    'TVs, home cinema e o melhor em entretenimento.',
    '/catalogo/imagem-e-som',
    'Explorar',
    1,
    now()
);
