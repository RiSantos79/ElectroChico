-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- Backfill: para as encomendas já pagas não existe registo de quando o
-- pagamento entrou. `createdAt` é a melhor aproximação honesta (entre o
-- checkout e o pagamento passam minutos) — ao contrário de `updatedAt`,
-- que já andou a saltar com cada alteração de estado.
UPDATE "Order"
SET "paidAt" = "createdAt"
WHERE "status" IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED');
