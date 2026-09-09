import { redirect } from "next/navigation";
import { getOrdersAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Encomendas — Backoffice" };

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  FAILED: "Falhada",
  CANCELLED: "Cancelada",
};

const statusColor: Record<string, string> = {
  PENDING: "text-muted",
  PAID: "text-success",
  FAILED: "text-danger",
  CANCELLED: "text-muted",
};

export default async function AdminOrdersPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const orders = await getOrdersAdmin(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Encomendas ({orders.length})</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Artigos</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 text-muted">{new Date(order.createdAt).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{order.customerName}</div>
                  <div className="text-xs text-muted">{order.customerEmail}</div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{formatPrice(Number(order.total))}</td>
                <td className={`px-4 py-3 font-medium ${statusColor[order.status] ?? "text-muted"}`}>
                  {statusLabel[order.status] ?? order.status}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Ainda não há encomendas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
