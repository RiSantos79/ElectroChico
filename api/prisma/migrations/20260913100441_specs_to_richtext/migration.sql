-- Converte "specs" de JSON estruturado [{label,value}] para HTML livre —
-- preserva o conteúdo existente (em vez de perder os dados com um simples
-- cast jsonb->text, que produziria o JSON em bruto).
ALTER TABLE "Product" ADD COLUMN "specs_new" TEXT;

UPDATE "Product" SET "specs_new" = COALESCE((
  SELECT string_agg('<p><strong>' || (elem->>'label') || ':</strong> ' || (elem->>'value') || '</p>', '')
  FROM jsonb_array_elements(specs) AS elem
), '');

ALTER TABLE "Product" DROP COLUMN "specs";
ALTER TABLE "Product" RENAME COLUMN "specs_new" TO "specs";
ALTER TABLE "Product" ALTER COLUMN "specs" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "specs" SET DEFAULT '';
