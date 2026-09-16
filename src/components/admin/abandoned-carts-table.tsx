"use client";

import type { Order } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { sendReminderAction } from "@/lib/admin-actions";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";

function timeSince(dateStr: string): string {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function sortValue(cart: Order, key: string): string | number {
  switch (key) {
    case "createdAt":
      return cart.createdAt;
    case "customerName":
      return cart.customerName.toLowerCase();
    case "total":
      return Number(cart.total);
    case "reminderSentAt":
      return cart.reminderSentAt ?? "";
    default:
      return "";
  }
}

export function AbandonedCartsTable({ carts }: { carts: Order[] }) {
  const { sorted, sortKey, ascending, toggleSort } = useSortable(carts, sortValue);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Há" sortKey="createdAt" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Cliente"
              sortKey="customerName"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <th className="px-4 py-3 font-medium">Artigos</th>
            <SortableHeader label="Valor" sortKey="total" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Contactado"
              sortKey="reminderSentAt"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((cart) => (
            <tr key={cart.id}>
              <td className="px-4 py-3 text-muted">{timeSince(cart.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{cart.customerName}</div>
                <div className="text-xs text-muted">
                  {cart.customerEmail}
                  {cart.customerPhone ? ` · ${cart.customerPhone}` : ""}
                </div>
              </td>
              <td className="px-4 py-3 text-muted">
                {cart.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{formatPrice(Number(cart.total))}</td>
              <td className="px-4 py-3 text-muted">
                {cart.reminderSentAt ? `Sim, há ${timeSince(cart.reminderSentAt)}` : "Não"}
              </td>
              <td className="px-4 py-3 text-right">
                <form action={sendReminderAction.bind(null, cart.id)}>
                  <button type="submit" className="font-medium text-accent hover:underline">
                    Enviar lembrete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {carts.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted">
                Sem carrinhos abandonados de momento.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
