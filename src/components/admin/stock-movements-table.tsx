"use client";

import Link from "next/link";
import type { StockMovement } from "@/lib/api";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";

const typeLabel: Record<string, string> = {
  SALE: "Venda",
  RESTOCK: "Reposição",
  ADJUSTMENT: "Ajuste manual",
  RETURN: "Devolução",
};

const typeColor: Record<string, string> = {
  SALE: "text-danger",
  RESTOCK: "text-success",
  ADJUSTMENT: "text-accent",
  RETURN: "text-success",
};

function sortValue(m: StockMovement, key: string): string | number {
  switch (key) {
    case "createdAt":
      return m.createdAt;
    case "product":
      return m.product.name.toLowerCase();
    case "type":
      return typeLabel[m.type] ?? m.type;
    case "delta":
      return m.delta;
    default:
      return "";
  }
}

export function StockMovementsTable({ movements }: { movements: StockMovement[] }) {
  const { sorted, sortKey, ascending, toggleSort } = useSortable(movements, sortValue);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Data" sortKey="createdAt" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Produto"
              sortKey="product"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader label="Tipo" sortKey="type" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Quantidade"
              sortKey="delta"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <th className="px-4 py-3 font-medium">Detalhe</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3 text-muted">{new Date(m.createdAt).toLocaleString("pt-PT")}</td>
              <td className="px-4 py-3 font-medium text-foreground">{m.product.name}</td>
              <td className={`px-4 py-3 font-medium ${typeColor[m.type] ?? "text-muted"}`}>
                {typeLabel[m.type] ?? m.type}
              </td>
              <td className={`px-4 py-3 font-medium ${m.delta >= 0 ? "text-success" : "text-danger"}`}>
                {m.delta > 0 ? `+${m.delta}` : m.delta}
              </td>
              <td className="px-4 py-3 text-muted">
                {m.orderId ? (
                  <Link href={`/admin/encomendas/${m.orderId}`} className="text-accent hover:underline">
                    Encomenda #{m.orderId.slice(-8)}
                  </Link>
                ) : (
                  (m.reason ?? "—")
                )}
              </td>
            </tr>
          ))}
          {movements.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted">
                Ainda não há movimentos de stock registados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
