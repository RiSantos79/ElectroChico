import { redirect } from "next/navigation";
import { getStockMovements } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { StockMovementsTable } from "@/components/admin/stock-movements-table";

export const metadata = { title: "Movimentos de stock — Backoffice" };

export default async function AdminStockPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const movements = await getStockMovements(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Movimentos de stock</h1>
      <StockMovementsTable movements={movements} />
    </div>
  );
}
