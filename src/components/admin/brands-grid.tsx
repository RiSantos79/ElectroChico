"use client";

import type { AdminBrand } from "@/lib/api";
import { updateBrandAction } from "@/lib/admin-actions";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

export function BrandsGrid({ brands }: { brands: AdminBrand[] }) {
  const { query, setQuery, filtered } = useAdminSearch(brands, (b) => `${b.name} ${b.slug}`);

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} placeholder="Pesquisar marcas..." className="mb-4 max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((brand) => (
          <form
            key={brand.id}
            action={updateBrandAction.bind(null, brand.id)}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4"
          >
            <div className="flex items-center gap-3">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logótipo de marca vindo da API, não vale a pena otimizar
                <img src={brand.logoUrl} alt={brand.name} className="size-10 rounded-lg object-contain" />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="text-xs text-muted">
                {brand.productCount} {brand.productCount === 1 ? "produto" : "produtos"}
              </p>
            </div>
            <input name="name" defaultValue={brand.name} className="input-field text-sm" />
            <input type="file" name="logo" accept="image/*" className="text-xs" />
            <button type="submit" className="self-start text-sm font-medium text-accent hover:underline">
              Guardar
            </button>
          </form>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted">
            Nenhuma marca encontrada para &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
