"use client";

import Link from "next/link";
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

const statusColor: Record<string, string> = {
  PENDING: "text-muted",
  PAID: "text-success",
  PROCESSING: "text-accent",
  SHIPPED: "text-accent",
  DELIVERED: "text-success",
  CANCELLED: "text-muted",
  REFUNDED: "text-danger",
  FAILED: "text-danger",
};

function sortValue(order: Order, key: string): string | number {
  switch (key) {
    case "createdAt":
      return order.createdAt;
    case "customerName":
      return order.customerName.toLowerCase();
    case "total":
      return Number(order.total);
    case "status":
      return statusLabel[order.status] ?? order.status;
    default:
      return "";
  }
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const { sorted, sortKey, ascending, toggleSort } = useSortable(orders, sortValue);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Data" sortKey="createdAt" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Cliente"
              sortKey="customerName"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <th className="px-4 py-3 font-medium">Artigos</th>
            <SortableHeader label="Total" sortKey="total" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Estado" sortKey="status" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((order) => (
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
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/encomendas/${order.id}`} className="font-medium text-accent hover:underline">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted">
                Ainda não há encomendas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
