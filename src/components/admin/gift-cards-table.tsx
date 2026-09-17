"use client";

import type { GiftCard } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

function sortValue(g: GiftCard, key: string): string | number {
  switch (key) {
    case "code":
      return g.code;
    case "value":
      return Number(g.value);
    case "status":
      return g.status;
    case "buyerEmail":
      return g.buyerEmail;
    case "recipientEmail":
      return g.recipientEmail ?? "";
    case "createdAt":
      return g.createdAt;
    default:
      return "";
  }
}

export function GiftCardsTable({ giftCards }: { giftCards: GiftCard[] }) {
  const { query, setQuery, filtered } = useAdminSearch(
    giftCards,
    (g) => `${g.code} ${g.buyerEmail} ${g.recipientEmail ?? ""}`,
  );
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, sortValue);

  return (
    <div>
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Pesquisar por código, comprador ou destinatário..."
        className="mb-3 max-w-sm"
      />
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <SortableHeader label="Código" sortKey="code" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader label="Valor" sortKey="value" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader label="Estado" sortKey="status" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader
                label="Comprador"
                sortKey="buyerEmail"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Destinatário"
                sortKey="recipientEmail"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Criado em"
                sortKey="createdAt"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3 font-mono font-medium text-foreground">{g.code}</td>
                <td className="px-4 py-3 text-foreground">{formatPrice(Number(g.value))}</td>
                <td className={`px-4 py-3 font-medium ${g.status === "ACTIVE" ? "text-success" : "text-muted"}`}>
                  {g.status === "ACTIVE" ? "Ativo" : "Resgatado"}
                </td>
                <td className="px-4 py-3 text-muted">{g.buyerEmail}</td>
                <td className="px-4 py-3 text-muted">{g.recipientEmail ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{new Date(g.createdAt).toLocaleDateString("pt-PT")}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {query.trim() ? `Nenhum cartão encontrado para "${query}".` : "Ainda não há cartões presente."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
