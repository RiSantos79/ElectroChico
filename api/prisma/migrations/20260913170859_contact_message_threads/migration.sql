-- CreateTable
CREATE TABLE "ContactReply" (
    "id" TEXT NOT NULL,
    "contactMessageId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fromAdmin" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactReply_contactMessageId_idx" ON "ContactReply"("contactMessageId");

-- AddForeignKey
ALTER TABLE "ContactReply" ADD CONSTRAINT "ContactReply_contactMessageId_fkey" FOREIGN KEY ("contactMessageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra a resposta única já existente para a nova tabela de thread, como a
-- primeira mensagem do admin, antes de a coluna antiga desaparecer.
INSERT INTO "ContactReply" (id, "contactMessageId", body, "fromAdmin", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text || id), id, reply, true, COALESCE("repliedAt", now())
FROM "ContactMessage"
WHERE reply IS NOT NULL;

-- AlterTable
ALTER TABLE "ContactMessage" DROP COLUMN "repliedAt",
DROP COLUMN "reply";
