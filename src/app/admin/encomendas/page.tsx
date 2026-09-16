import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrdersAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { OrdersTable } from "@/components/admin/orders-table";

export const metadata = { title: "Encomendas — Backoffice" };

export default async function AdminOrdersPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const orders = await getOrdersAdmin(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Encomendas ({orders.length})</h1>
        <Link
          href="/admin/encomendas/export"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Exportar CSV
        </Link>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
