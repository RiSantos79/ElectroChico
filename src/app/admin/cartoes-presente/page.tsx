import { redirect } from "next/navigation";
import { getGiftCards } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { GiftCardLookup } from "@/components/admin/gift-card-lookup";
import { GiftCardsTable } from "@/components/admin/gift-cards-table";

export const metadata = { title: "Cartões Presente — Backoffice" };

export default async function AdminGiftCardsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const giftCards = await getGiftCards(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cartões Presente ({giftCards.length})</h1>
      <GiftCardLookup />
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Todos os cartões</h2>
      <GiftCardsTable giftCards={giftCards} />
    </div>
  );
}
