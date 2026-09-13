-- Reverte "specs" de HTML livre para JSON estruturado [{label,value}] —
-- extrai os pares de volta do padrão <p><strong>label:</strong> value</p>
-- em vez de descartar o conteúdo existente.
ALTER TABLE "Product" ADD COLUMN "specs_json" JSONB;

UPDATE "Product" SET "specs_json" = COALESCE((
  SELECT jsonb_agg(jsonb_build_object('label', trim(m[1]), 'value', trim(m[2])))
  FROM regexp_matches(specs, '<p><strong>(.*?):</strong>\s*(.*?)</p>', 'g') AS m
), '[]'::jsonb);

ALTER TABLE "Product" DROP COLUMN "specs";
ALTER TABLE "Product" RENAME COLUMN "specs_json" TO "specs";
ALTER TABLE "Product" ALTER COLUMN "specs" SET NOT NULL;
