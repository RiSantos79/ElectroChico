"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { deleteProductAction, deleteProductsAction, duplicateProductAction } from "@/lib/admin-actions";
import { StockBar } from "@/components/stock-bar";
import { ConfirmDialog } from "./confirm-dialog";
import { BulkPriceChangeModal } from "./bulk-price-change-modal";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";

type PendingDelete = { type: "one"; id: string; name: string } | { type: "bulk"; ids: string[] };

function sortValue(p: Product, key: string): string | number {
  switch (key) {
    case "name":
      return p.name.toLowerCase();
    case "brand":
      return p.brand.toLowerCase();
    case "category":
      return p.category.toLowerCase();
    case "price":
      return p.price;
    case "stockQuantity":
      return p.stockQuantity;
    default:
      return "";
  }
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { sorted, sortKey, ascending, toggleSort } = useSortable(products, sortValue);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);
  const [priceChangeOpen, setPriceChangeOpen] = useState(false);

  const allSelected = products.length > 0 && selected.size === products.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (!pending) return;
    setBusy(true);
    const result =
      pending.type === "one" ? await deleteProductAction(pending.id) : await deleteProductsAction(pending.ids);
    setBusy(false);
    setPending(null);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    if (pending.type === "bulk") setSelected(new Set());
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          {selected.size > 0 && <span className="text-sm text-foreground">{selected.size} produto(s) selecionado(s)</span>}
        </div>
        <div className="flex items-center gap-4">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() =>
                setPending({ type: "bulk", ids: products.filter((p) => selected.has(p.id)).map((p) => p.id) })
              }
              className="text-sm font-semibold text-danger hover:underline"
            >
              Apagar selecionados
            </button>
          )}
          <button
            type="button"
            onClick={() => setPriceChangeOpen(true)}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Alteração de preços em massa
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4" />
              </th>
              <SortableHeader label="Nome" sortKey="name" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader label="Marca" sortKey="brand" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader
                label="Categoria"
                sortKey="category"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
              <SortableHeader label="Preço" sortKey="price" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader
                label="Stock"
                sortKey="stockQuantity"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    className="size-4"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {product.name}
                  {product.archived && (
                    <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                      Arquivado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{product.brand}</td>
                <td className="px-4 py-3 text-muted">{product.category}</td>
                <td className="px-4 py-3 text-foreground">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  <StockBar quantity={product.stockQuantity} className="w-32" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="font-medium text-accent hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={duplicateProductAction.bind(null, product.id)}>
                      <button type="submit" className="font-medium text-accent hover:underline">
                        Duplicar
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setPending({ type: "one", id: product.id, name: product.name })}
                      className="font-medium text-danger hover:underline"
                    >
                      Apagar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending && (
        <ConfirmDialog
          message={
            pending.type === "one"
              ? `Apagar "${pending.name}"? Esta ação não pode ser desfeita.`
              : `Apagar ${pending.ids.length} produto(s) selecionado(s)? Esta ação não pode ser desfeita.`
          }
          confirmLabel="Apagar"
          danger
          pending={busy}
          onCancel={() => setPending(null)}
          onConfirm={handleConfirm}
        />
      )}

      {priceChangeOpen && (
        <BulkPriceChangeModal
          products={products}
          selectedIds={[...selected]}
          onClose={() => {
            setPriceChangeOpen(false);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}
