import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/session";
import { GiftCardLookup } from "@/components/admin/gift-card-lookup";

export const metadata = { title: "Cartões Presente — Backoffice" };

export default async function AdminGiftCardsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Cartões Presente</h1>
      <GiftCardLookup />
    </div>
  );
}
