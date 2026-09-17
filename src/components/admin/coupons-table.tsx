"use client";

import type { Coupon } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { deleteCouponAction, toggleCouponAction } from "@/lib/admin-actions";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

function formatDiscount(coupon: { type: string; value: string }) {
  return coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : formatPrice(Number(coupon.value));
}

function sortValue(c: Coupon, key: string): string | number {
  switch (key) {
    case "code":
      return c.code;
    case "value":
      return Number(c.value);
    case "minOrderValue":
      return c.minOrderValue ? Number(c.minOrderValue) : -1;
    case "usesCount":
      return c.usesCount;
    case "validUntil":
      return c.validUntil ?? "";
    case "active":
      return c.active ? 1 : 0;
    default:
      return "";
  }
}

export function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  const { query, setQuery, filtered } = useAdminSearch(coupons, (c) => c.code);
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, sortValue);

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} placeholder="Pesquisar por código..." className="mb-3 max-w-sm" />
      <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-muted">
          <tr>
            <SortableHeader label="Código" sortKey="code" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader label="Desconto" sortKey="value" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <SortableHeader
              label="Compra mínima"
              sortKey="minOrderValue"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader
              label="Utilizações"
              sortKey="usesCount"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader
              label="Validade"
              sortKey="validUntil"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
            <SortableHeader label="Estado" sortKey="active" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((coupon) => (
            <tr key={coupon.id}>
              <td className="px-4 py-3 font-mono font-medium text-foreground">{coupon.code}</td>
              <td className="px-4 py-3 text-muted">{formatDiscount(coupon)}</td>
              <td className="px-4 py-3 text-muted">
                {coupon.minOrderValue ? formatPrice(Number(coupon.minOrderValue)) : "—"}
              </td>
              <td className="px-4 py-3 text-muted">
                {coupon.usesCount}
                {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
              </td>
              <td className="px-4 py-3 text-muted">
                {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString("pt-PT") : "—"}
                {" – "}
                {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("pt-PT") : "—"}
              </td>
              <td className={`px-4 py-3 font-medium ${coupon.active ? "text-success" : "text-muted"}`}>
                {coupon.active ? "Ativo" : "Inativo"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3">
                  <form action={toggleCouponAction.bind(null, coupon.id, !coupon.active)}>
                    <button type="submit" className="font-medium text-accent hover:underline">
                      {coupon.active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deleteCouponAction.bind(null, coupon.id)}>
                    <button type="submit" className="font-medium text-danger hover:underline">
                      Apagar
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted">
                {query.trim() ? `Nenhum cupão encontrado para "${query}".` : "Ainda não há cupões criados."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
