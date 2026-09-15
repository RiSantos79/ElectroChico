"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { deleteProductAction, deleteProductsAction, duplicateProductAction } from "@/lib/admin-actions";
import { StockBar } from "@/components/stock-bar";
import { ConfirmDialog } from "./confirm-dialog";

type PendingDelete = { type: "one"; id: string; name: string } | { type: "bulk"; ids: string[] };

export function ProductsTable({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

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
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5">
          <span className="text-sm text-foreground">{selected.size} produto(s) selecionado(s)</span>
          <button
            type="button"
            onClick={() => setPending({ type: "bulk", ids: products.filter((p) => selected.has(p.id)).map((p) => p.id) })}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Apagar selecionados
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4" />
              </th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
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
    </div>
  );
}
