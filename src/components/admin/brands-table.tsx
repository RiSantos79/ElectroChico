"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminBrand } from "@/lib/api";
import { deleteBrandAction, deleteBrandsAction, removeBrandLogoAction } from "@/lib/admin-actions";
import { ConfirmDialog } from "./confirm-dialog";
import { SortableHeader } from "./sortable-header";
import { useSortable } from "@/lib/use-sortable";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

type PendingDelete = { type: "one"; id: string; name: string } | { type: "bulk"; ids: string[] };

function sortValue(b: AdminBrand, key: string): string | number {
  switch (key) {
    case "name":
      return b.name.toLowerCase();
    case "productCount":
      return b.productCount;
    default:
      return "";
  }
}

export function BrandsTable({ brands }: { brands: AdminBrand[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { query, setQuery, filtered } = useAdminSearch(brands, (b) => `${b.name} ${b.slug}`);
  const { sorted, sortKey, ascending, toggleSort } = useSortable(filtered, sortValue);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [removingLogoId, setRemovingLogoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = filtered.length > 0 && filtered.every((b) => selected.has(b.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((b) => next.delete(b.id));
      else filtered.forEach((b) => next.add(b.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmDelete() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    const result = pending.type === "one" ? await deleteBrandAction(pending.id) : await deleteBrandsAction(pending.ids);
    setBusy(false);
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (pending.type === "bulk") setSelected(new Set());
  }

  async function handleConfirmRemoveLogo() {
    if (!removingLogoId) return;
    setBusy(true);
    setError(null);
    const result = await removeBrandLogoAction(removingLogoId);
    setBusy(false);
    setRemovingLogoId(null);
    if (!result.ok) setError(result.error);
  }

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} placeholder="Pesquisar marcas..." className="mb-3 max-w-sm" />

      <div className="mb-3 flex items-center justify-between">
        <div>{selected.size > 0 && <span className="text-sm text-foreground">{selected.size} selecionada(s)</span>}</div>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setPending({ type: "bulk", ids: [...selected] })}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Apagar selecionadas
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4" />
              </th>
              <th className="px-4 py-3 font-medium">Logótipo</th>
              <SortableHeader label="Nome" sortKey="name" activeKey={sortKey} ascending={ascending} onSort={toggleSort} />
              <SortableHeader
                label="Produtos"
                sortKey="productCount"
                activeKey={sortKey}
                ascending={ascending}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((brand) => (
              <tr key={brand.id}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(brand.id)}
                    onChange={() => toggleOne(brand.id)}
                    className="size-4"
                  />
                </td>
                <td className="px-4 py-3">
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logótipo de marca vindo da API, não vale a pena otimizar
                    <img src={brand.logoUrl} alt={brand.name} className="size-10 rounded-lg object-contain" />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{brand.name}</td>
                <td className="px-4 py-3 text-muted">{brand.productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-3">
                    <Link href={`/admin/marcas/${brand.id}/editar`} className="font-medium text-accent hover:underline">
                      Editar
                    </Link>
                    {brand.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setRemovingLogoId(brand.id)}
                        className="font-medium text-muted hover:underline"
                      >
                        Remover imagem
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={brand.productCount > 0}
                      title={brand.productCount > 0 ? "Tem produtos associados" : undefined}
                      onClick={() => setPending({ type: "one", id: brand.id, name: brand.name })}
                      className="font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Apagar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {query.trim() ? `Nenhuma marca encontrada para "${query}".` : "Ainda não há marcas."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pending && (
        <ConfirmDialog
          message={
            pending.type === "one"
              ? `Apagar a marca "${pending.name}"? Esta ação não pode ser desfeita.`
              : `Apagar ${pending.ids.length} marca(s) selecionada(s)? Esta ação não pode ser desfeita.`
          }
          confirmLabel="Apagar"
          danger
          pending={busy}
          onCancel={() => setPending(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {removingLogoId && (
        <ConfirmDialog
          message="Remover a imagem desta marca?"
          confirmLabel="Remover"
          pending={busy}
          onCancel={() => setRemovingLogoId(null)}
          onConfirm={handleConfirmRemoveLogo}
        />
      )}
    </div>
  );
}
