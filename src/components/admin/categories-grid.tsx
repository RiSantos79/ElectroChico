"use client";

import type { AdminCategory } from "@/lib/api";
import { updateCategoryImageAction } from "@/lib/admin-actions";
import { SearchBox } from "./search-box";
import { useAdminSearch } from "@/lib/use-admin-search";

export function CategoriesGrid({ categories }: { categories: AdminCategory[] }) {
  const { query, setQuery, filtered } = useAdminSearch(categories, (c) => `${c.name} ${c.slug}`);

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} placeholder="Pesquisar categorias..." className="mb-4 max-w-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((category) => (
          <form
            key={category.id}
            action={updateCategoryImageAction.bind(null, category.id)}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4"
          >
            {category.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagem de categoria vinda da API, não vale a pena otimizar
              <img src={category.imageUrl} alt={category.name} className="h-32 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                Sem imagem
              </div>
            )}
            <p className="text-sm font-medium text-foreground">{category.name}</p>
            <input type="file" name="logo" accept="image/*" className="text-xs" />
            <button type="submit" className="self-start text-sm font-medium text-accent hover:underline">
              Guardar imagem
            </button>
          </form>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted">
            Nenhuma categoria encontrada para &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
