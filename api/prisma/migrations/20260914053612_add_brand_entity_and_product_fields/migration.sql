-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- Cria uma marca a partir de cada valor distinto já usado em Product.brand,
-- antes de a coluna de texto ser substituída pela relação.
INSERT INTO "Brand" (id, slug, name, "createdAt", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text || brand),
    regexp_replace(regexp_replace(lower(brand), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'),
    brand,
    now(),
    now()
FROM (SELECT DISTINCT brand FROM "Product") AS distinct_brands;

-- AlterTable: adiciona a coluna nova (ainda opcional) e os restantes campos
ALTER TABLE "Product" ADD COLUMN "brandId" TEXT;
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "ean" TEXT;
ALTER TABLE "Product" ADD COLUMN "weightKg" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "widthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "heightCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "depthCm" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "warrantyMonths" INTEGER;
ALTER TABLE "Product" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN "metaDescription" TEXT;

-- Liga cada produto à marca criada a partir do seu texto atual
UPDATE "Product" p SET "brandId" = b.id
FROM "Brand" b
WHERE b.name = p.brand;

-- Agora que todos os produtos têm brandId, a coluna pode ficar obrigatória
ALTER TABLE "Product" ALTER COLUMN "brandId" SET NOT NULL;

-- DropIndex (índice antigo sobre a coluna de texto que vai desaparecer)
DROP INDEX "Product_brand_idx";

-- AlterTable: remove a coluna de texto, substituída pela relação
ALTER TABLE "Product" DROP COLUMN "brand";

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT;
