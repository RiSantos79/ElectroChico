"use client";

import Link from "next/link";
import type { AdminCustomer } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

function sortValue(c: AdminCustomer, key: string): string | number {
  switch (key) {
    case "name":
      return (c.name ?? c.email).toLowerCase();
    case "email":
      return c.email;
    case "createdAt":
      return c.createdAt;
    case "orderCount":
      return c.orderCount;
    case "totalSpent":
      return c.totalSpent;
    case "lastOrderAt":
      return c.lastOrderAt ?? "";
    default:
      return "";
  }
}

export function CustomersTable({ customers }: { customers: AdminCustomer[] }) {
  const { query, setQuery, filtered } = useAdminSearch(customers, (c) => `${c.name ?? ""} ${c.email}`);
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, sortValue);

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} placeholder="Pesquisar por nome ou email..." className="mb-3 max-w-sm" />
      <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <SortableHeader label="Nome" sortKey="name" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Email" sortKey="email" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Desde"
              sortKey="createdAt"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader
              label="Encomendas"
              sortKey="orderCount"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader
              label="Total gasto"
              sortKey="totalSpent"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader
              label="Última encomenda"
              sortKey="lastOrderAt"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/clientes/${c.id}`} className="font-medium text-foreground hover:text-accent">
                  {c.name || "(sem nome)"}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{c.email}</td>
              <td className="px-4 py-3 text-muted">{new Date(c.createdAt).toLocaleDateString("pt-PT")}</td>
              <td className="px-4 py-3 text-muted">{c.orderCount}</td>
              <td className="px-4 py-3 font-medium text-foreground">{formatPrice(c.totalSpent)}</td>
              <td className="px-4 py-3 text-muted">
                {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-PT") : "—"}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted">
                {query.trim() ? `Nenhum cliente encontrado para "${query}".` : "Ainda não há clientes registados."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
