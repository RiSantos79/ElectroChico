"use client";

import type { Order } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  PROCESSING: "A preparar",
  SHIPPED: "Enviada",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
  FAILED: "Falhada",
};

function sortValue(o: Order, key: string): string | number {
  switch (key) {
    case "createdAt":
      return o.createdAt;
    case "total":
      return Number(o.total);
    case "status":
      return statusLabel[o.status] ?? o.status;
    default:
      return "";
  }
}

export function CustomerOrdersTable({ orders }: { orders: Order[] }) {
  const { sorted, sortKey, ascending, toggleSort } = useSortable(orders, sortValue);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <SortableHeader label="Data" sortKey="createdAt" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <th className="px-4 py-3 font-medium">Artigos</th>
            <SortableHeader label="Total" sortKey="total" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Estado" sortKey="status" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3 text-muted">{new Date(o.createdAt).toLocaleString("pt-PT")}</td>
              <td className="px-4 py-3 text-muted">
                {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{formatPrice(Number(o.total))}</td>
              <td className="px-4 py-3 text-muted">{statusLabel[o.status] ?? o.status}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted">
                Ainda não fez nenhuma encomenda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
